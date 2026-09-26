// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../../app/server';
import { getDatabase, seed } from '../../../shared/database';
import { csrfHeaders, issueCsrf, mergeResponseCookies } from '../../../shared/security/tests/helpers';

const createdIds: string[] = [];

afterEach(() => {
  const database = getDatabase();
  for (const id of createdIds.splice(0)) {
    database.prepare('DELETE FROM testimonials WHERE id = ?').run(id);
  }
});

async function registerCookie(asAdmin: boolean): Promise<string> {
  const bootstrap = await issueCsrf(app);
  const response = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { ...csrfHeaders(bootstrap), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: asAdmin ? 'Testimonial Administrator' : 'Testimonial Customer',
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

describe('testimonials admin routes', () => {
  beforeEach(() => {
    seed();
  });

  it('rejects anonymous and non-admin writers', async () => {
    const body = { displayName: 'Uji', role: 'Mahasiswa S2', content: 'Bagus.' };
    const anonymous = await adminRequest(undefined, '/api/testimonials', { method: 'POST', body });
    expect(anonymous.status).toBe(401);

    const customer = await registerCookie(false);
    const forbidden = await adminRequest(customer, '/api/testimonials', { method: 'POST', body });
    expect(forbidden.status).toBe(403);
  });

  it('creates, updates, and deletes testimonials', async () => {
    const admin = await registerCookie(true);
    const created = await adminRequest(admin, '/api/testimonials', {
      method: 'POST',
      body: { displayName: 'A***', role: 'Mahasiswa S2', content: 'Sangat membantu.' },
    });
    expect(created.status).toBe(201);
    const payload = (await created.json()) as { data: { testimonial: { id: string } } };
    createdIds.push(payload.data.testimonial.id);

    const updated = await adminRequest(admin, `/api/testimonials/${payload.data.testimonial.id}`, {
      method: 'PUT',
      body: { content: 'Sangat membantu sekali.' },
    });
    expect(updated.status).toBe(200);
    const updatedPayload = (await updated.json()) as { data: { testimonial: { content: string } } };
    expect(updatedPayload.data.testimonial.content).toBe('Sangat membantu sekali.');

    const missing = await adminRequest(admin, `/api/testimonials/${randomUUID()}`, {
      method: 'PUT',
      body: { content: 'X' },
    });
    expect(missing.status).toBe(404);

    const deleted = await adminRequest(admin, `/api/testimonials/${payload.data.testimonial.id}`, {
      method: 'DELETE',
    });
    expect(deleted.status).toBe(200);
    createdIds.pop();
  });
});
