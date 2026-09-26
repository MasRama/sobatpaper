import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../../app/server';
import { getDatabase, seed } from '../../../shared/database';
import { csrfHeaders, issueCsrf, mergeResponseCookies } from '../../../shared/security/tests/helpers';

async function registerAdminCookie(): Promise<string> {
  const bootstrap = await issueCsrf(app);
  const response = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { ...csrfHeaders(bootstrap), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Pricing Administrator',
      email: `${randomUUID()}@example.com`,
      password: 'correct horse battery staple',
    }),
  });
  expect(response.status).toBe(201);
  const cookie = mergeResponseCookies(bootstrap.cookie, response);
  const payload = (await response.json()) as { data: { user: { id: string } } };
  const database = getDatabase();
  const adminRole = database.prepare('SELECT id FROM roles WHERE slug = ?').get('admin') as { id: string };
  database
    .prepare('INSERT OR IGNORE INTO user_roles (id, user_id, role_id, created_at) VALUES (?, ?, ?, ?)')
    .run(randomUUID(), payload.data.user.id, adminRole.id, Date.now());
  return cookie;
}

describe('pricing routes', () => {
  beforeEach(() => {
    seed();
  });

  it('lists pricing groups publicly with seeded prices', async () => {
    const response = await app.request('/api/pricing');

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      success: boolean;
      data: { groups: Array<{ slug: string; packages: Array<{ name: string; price: number }> }> };
    };
    expect(payload.success).toBe(true);
    const bySlug = Object.fromEntries(payload.data.groups.map((group) => [group.slug, group]));
    expect(bySlug.pendampingan.packages).toContainEqual(expect.objectContaining({ name: 'Pendampingan Skripsi', price: 3000000 }));
    expect(bySlug.konversi.packages).toContainEqual(expect.objectContaining({ name: 'SINTA 3', price: 1500000 }));
    expect(bySlug['artikel-nol'].packages).toContainEqual(expect.objectContaining({ name: 'SINTA 3', price: 5000000 }));
  });

  it('rejects package creation without an admin session', async () => {
    const csrf = await issueCsrf(app);
    const response = await app.request('/api/pricing', {
      method: 'POST',
      headers: { ...csrfHeaders(csrf), 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupSlug: 'x', groupName: 'X', name: 'X', price: 1000 }),
    });

    expect(response.status).toBe(401);
  });

  it('lets admins create, update, and delete packages', async () => {
    const cookie = await registerAdminCookie();

    const createCsrf = await issueCsrf(app, cookie);
    const created = await app.request('/api/pricing', {
      method: 'POST',
      headers: { ...csrfHeaders(createCsrf), 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupSlug: 'test-group', groupName: 'Test Group', name: 'Test Package', price: 123000 }),
    });
    expect(created.status).toBe(201);
    const createdPayload = (await created.json()) as { data: { package: { id: string; price: number } } };
    expect(createdPayload.data.package.price).toBe(123000);

    const invalidCsrf = await issueCsrf(app, cookie);
    const invalid = await app.request(`/api/pricing/${createdPayload.data.package.id}`, {
      method: 'PUT',
      headers: { ...csrfHeaders(invalidCsrf), 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: -5 }),
    });
    expect(invalid.status).toBe(422);

    const updateCsrf = await issueCsrf(app, cookie);
    const updated = await app.request(`/api/pricing/${createdPayload.data.package.id}`, {
      method: 'PUT',
      headers: { ...csrfHeaders(updateCsrf), 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 456000 }),
    });
    expect(updated.status).toBe(200);
    await expect(updated.json()).resolves.toMatchObject({ success: true, data: { package: { price: 456000 } } });

    const deleteCsrf = await issueCsrf(app, cookie);
    const deleted = await app.request(`/api/pricing/${createdPayload.data.package.id}`, {
      method: 'DELETE',
      headers: { ...csrfHeaders(deleteCsrf) },
    });
    expect(deleted.status).toBe(200);

    const missingCsrf = await issueCsrf(app, cookie);
    const missing = await app.request(`/api/pricing/${createdPayload.data.package.id}`, {
      method: 'PUT',
      headers: { ...csrfHeaders(missingCsrf), 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 1 }),
    });
    expect(missing.status).toBe(404);
  });
});
