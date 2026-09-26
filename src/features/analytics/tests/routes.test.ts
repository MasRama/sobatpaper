// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../../app/server';
import { getDatabase, seed } from '../../../shared/database';
import { csrfHeaders, issueCsrf, mergeResponseCookies } from '../../../shared/security/tests/helpers';

async function track(payload: unknown): Promise<Response> {
  const csrf = await issueCsrf(app);
  return app.request('/api/analytics/events', {
    method: 'POST',
    headers: { ...csrfHeaders(csrf), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function adminCookie(): Promise<string> {
  const bootstrap = await issueCsrf(app);
  const response = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { ...csrfHeaders(bootstrap), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Analytics Administrator',
      email: `${randomUUID()}@example.com`,
      password: 'correct horse battery staple',
    }),
  });
  expect(response.status).toBe(201);
  const payload = (await response.json()) as { data: { user: { id: string } } };
  const database = getDatabase();
  const adminRole = database.prepare('SELECT id FROM roles WHERE slug = ?').get('admin') as { id: string };
  database
    .prepare('INSERT OR IGNORE INTO user_roles (id, user_id, role_id, created_at) VALUES (?, ?, ?, ?)')
    .run(randomUUID(), payload.data.user.id, adminRole.id, Date.now());
  return mergeResponseCookies(bootstrap.cookie, response);
}

describe('analytics routes', () => {
  beforeEach(() => {
    seed();
    getDatabase().prepare('DELETE FROM analytics_events').run();
  });

  it('tracks known events with payloads', async () => {
    const response = await track({ name: 'submit_order', payload: { order_id: 'SP-2026-00001', service: 'skripsi' } });
    expect(response.status).toBe(201);
    const payload = (await response.json()) as { data: { id: string } };
    expect(typeof payload.data.id).toBe('string');

    const row = getDatabase().prepare('SELECT name, payload FROM analytics_events WHERE id = ?').get(payload.data.id) as {
      name: string;
      payload: string;
    };
    expect(row.name).toBe('submit_order');
    expect(JSON.parse(row.payload)).toEqual({ order_id: 'SP-2026-00001', service: 'skripsi' });
  });

  it('rejects unknown events', async () => {
    const response = await track({ name: 'bogus_event', payload: {} });
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({ success: false, code: 'VALIDATION_ERROR' });
  });

  it('restricts the summary to admins', async () => {
    const anonymous = await app.request('/api/analytics/summary');
    expect(anonymous.status).toBe(401);

    await track({ name: 'view_price', payload: {} });
    await track({ name: 'view_price', payload: {} });
    await track({ name: 'click_whatsapp', payload: {} });

    const cookie = await adminCookie();
    const csrf = await issueCsrf(app, cookie);
    const summary = await app.request('/api/analytics/summary', { headers: { ...csrfHeaders(csrf) } });
    expect(summary.status).toBe(200);
    await expect(summary.json()).resolves.toMatchObject({
      success: true,
      data: { counts: { view_price: 2, click_whatsapp: 1 }, total: 3 },
    });
  });
});
