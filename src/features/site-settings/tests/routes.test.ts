import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../../app/server';
import { getDatabase, seed } from '../../../shared/database';
import { csrfHeaders, issueCsrf, mergeResponseCookies } from '../../../shared/security/tests/helpers';
import { setSetting } from '../server/repository';

async function registerSessionCookie(name: string): Promise<string> {
  const bootstrap = await issueCsrf(app);
  const response = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { ...csrfHeaders(bootstrap), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email: `${randomUUID()}@example.com`, password: 'correct horse battery staple' }),
  });
  expect(response.status).toBe(201);
  const cookie = mergeResponseCookies(bootstrap.cookie, response);
  if (!cookie.includes('auth_id=')) throw new Error('Registration did not return a session cookie');
  return cookie;
}

async function registerAdminCookie(): Promise<string> {
  const bootstrap = await issueCsrf(app);
  const response = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { ...csrfHeaders(bootstrap), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Settings Administrator',
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

describe('site-settings routes', () => {
  beforeEach(() => {
    seed();
  });

  it('exposes public contact settings without authentication', async () => {
    setSetting('whatsapp_number', '6280000000000');
    const response = await app.request('/api/site-settings/public');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { whatsappNumber: '6280000000000', consultationMessage: expect.any(String) },
    });
  });

  it('rejects setting updates without a session', async () => {
    const csrf = await issueCsrf(app);
    const response = await app.request('/api/site-settings/whatsapp_number', {
      method: 'PUT',
      headers: { ...csrfHeaders(csrf), 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: '6281111111111' }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ success: false, code: 'UNAUTHORIZED' });
  });

  it('rejects setting updates from non-admin users', async () => {
    const cookie = await registerSessionCookie('Regular User');
    const csrf = await issueCsrf(app, cookie);
    const response = await app.request('/api/site-settings/whatsapp_number', {
      method: 'PUT',
      headers: { ...csrfHeaders(csrf), 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: '6281111111111' }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ success: false, code: 'FORBIDDEN' });
  });

  it('lets admins update settings with validation', async () => {
    const cookie = await registerAdminCookie();

    const invalidCsrf = await issueCsrf(app, cookie);
    const invalid = await app.request('/api/site-settings/whatsapp_number', {
      method: 'PUT',
      headers: { ...csrfHeaders(invalidCsrf), 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: '' }),
    });
    expect(invalid.status).toBe(422);

    const unknownCsrf = await issueCsrf(app, cookie);
    const unknown = await app.request('/api/site-settings/does_not_exist', {
      method: 'PUT',
      headers: { ...csrfHeaders(unknownCsrf), 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 'x' }),
    });
    expect(unknown.status).toBe(404);

    const validCsrf = await issueCsrf(app, cookie);
    const updated = await app.request('/api/site-settings/whatsapp_number', {
      method: 'PUT',
      headers: { ...csrfHeaders(validCsrf), 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: '6289999999999' }),
    });
    expect(updated.status).toBe(200);
    await expect(updated.json()).resolves.toMatchObject({
      success: true,
      data: { key: 'whatsapp_number', value: '6289999999999' },
    });

    const published = await app.request('/api/site-settings/public');
    await expect(published.json()).resolves.toMatchObject({
      success: true,
      data: { whatsappNumber: '6289999999999' },
    });
  });
});
