// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../../app/server';
import { getDatabase, seed } from '../../../shared/database';
import { csrfHeaders, issueCsrf, mergeResponseCookies } from '../../../shared/security/tests/helpers';

const createdServiceIds: string[] = [];

afterEach(() => {
  const database = getDatabase();
  for (const id of createdServiceIds.splice(0)) {
    database.prepare('DELETE FROM service_faqs WHERE service_id = ?').run(id);
    database.prepare('DELETE FROM services WHERE id = ?').run(id);
  }
});

async function registerCookie(asAdmin: boolean): Promise<string> {
  const bootstrap = await issueCsrf(app);
  const response = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { ...csrfHeaders(bootstrap), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: asAdmin ? 'Services Administrator' : 'Services Customer',
      email: `${randomUUID()}@example.com`,
      password: 'correct horse battery staple',
    }),
  });
  expect(response.status).toBe(201);
  const payload = (await response.json()) as { data: { user: { id: string } } };
  if (asAdmin) {
    const database = getDatabase();
    const adminRole = database.prepare('SELECT id FROM roles WHERE slug = ?').get('admin') as { id: string };
    database
      .prepare('INSERT OR IGNORE INTO user_roles (id, user_id, role_id, created_at) VALUES (?, ?, ?, ?)')
      .run(randomUUID(), payload.data.user.id, adminRole.id, Date.now());
  }
  return mergeResponseCookies(bootstrap.cookie, response);
}

async function adminRequest(
  cookie: string | undefined,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<Response> {
  const csrf = await issueCsrf(app, cookie);
  return app.request(path, {
    method: init.method ?? 'GET',
    headers: { ...csrfHeaders(csrf), 'Content-Type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

function servicePayload(): Record<string, unknown> {
  return {
    slug: `layanan-uji-${randomUUID().slice(0, 8)}`,
    name: 'Layanan Uji',
    tagline: 'Tagline layanan uji',
    description: 'Deskripsi layanan uji.',
    scope: ['Ruang lingkup satu'],
    process: ['Langkah satu'],
    estimatedTime: '1 minggu',
    startingPrice: 100000,
    faqs: [{ question: 'Tanya?', answer: 'Jawab.' }],
  };
}

describe('services admin routes', () => {
  beforeEach(() => {
    seed();
  });

  it('rejects anonymous and non-admin writers', async () => {
    const anonymous = await adminRequest(undefined, '/api/services', { method: 'POST', body: servicePayload() });
    expect(anonymous.status).toBe(401);

    const customer = await registerCookie(false);
    const forbidden = await adminRequest(customer, '/api/services', { method: 'POST', body: servicePayload() });
    expect(forbidden.status).toBe(403);
  });

  it('creates, updates, and deletes services', async () => {
    const admin = await registerCookie(true);
    const created = await adminRequest(admin, '/api/services', { method: 'POST', body: servicePayload() });
    expect(created.status).toBe(201);
    const payload = (await created.json()) as { data: { service: { id: string; slug: string; name: string } } };
    createdServiceIds.push(payload.data.service.id);

    const duplicate = await adminRequest(admin, '/api/services', {
      method: 'POST',
      body: { ...servicePayload(), slug: payload.data.service.slug },
    });
    expect(duplicate.status).toBe(409);

    const updated = await adminRequest(admin, `/api/services/${payload.data.service.id}`, {
      method: 'PUT',
      body: { name: 'Layanan Uji Baru', startingPrice: 250000 },
    });
    expect(updated.status).toBe(200);
    const updatedPayload = (await updated.json()) as { data: { service: { name: string; startingPrice: number } } };
    expect(updatedPayload.data.service.name).toBe('Layanan Uji Baru');
    expect(updatedPayload.data.service.startingPrice).toBe(250000);

    const missing = await adminRequest(admin, `/api/services/${randomUUID()}`, {
      method: 'PUT',
      body: { name: 'Tidak ada' },
    });
    expect(missing.status).toBe(404);

    const deleted = await adminRequest(admin, `/api/services/${payload.data.service.id}`, { method: 'DELETE' });
    expect(deleted.status).toBe(200);
    createdServiceIds.pop();

    const gone = await adminRequest(admin, `/api/services/${payload.data.service.id}`, { method: 'DELETE' });
    expect(gone.status).toBe(404);
  });

  it('rejects invalid service payloads', async () => {
    const admin = await registerCookie(true);
    const invalid = await adminRequest(admin, '/api/services', {
      method: 'POST',
      body: { ...servicePayload(), slug: 'Slug Salah!', startingPrice: -5 },
    });
    expect(invalid.status).toBe(422);
  });
});
