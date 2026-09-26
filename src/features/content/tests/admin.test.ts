// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../../app/server';
import { getDatabase, seed } from '../../../shared/database';
import { csrfHeaders, issueCsrf, mergeResponseCookies } from '../../../shared/security/tests/helpers';

const createdFaqIds: string[] = [];

afterEach(() => {
  const database = getDatabase();
  for (const id of createdFaqIds.splice(0)) {
    database.prepare('DELETE FROM faqs WHERE id = ?').run(id);
  }
});

async function registerCookie(asAdmin: boolean): Promise<string> {
  const bootstrap = await issueCsrf(app);
  const response = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { ...csrfHeaders(bootstrap), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: asAdmin ? 'Content Administrator' : 'Content Customer',
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

describe('content admin routes', () => {
  beforeEach(() => {
    seed();
  });

  it('rejects anonymous and non-admin writers', async () => {
    const anonymous = await adminRequest(undefined, '/api/content/faqs', {
      method: 'POST',
      body: { category: 'Uji', question: 'Q?', answer: 'A.' },
    });
    expect(anonymous.status).toBe(401);

    const customer = await registerCookie(false);
    const forbidden = await adminRequest(customer, '/api/content/faqs', {
      method: 'POST',
      body: { category: 'Uji', question: 'Q?', answer: 'A.' },
    });
    expect(forbidden.status).toBe(403);
  });

  it('updates pages and restores the original', async () => {
    const admin = await registerCookie(true);
    const before = await app.request('/api/content/pages/tentang-kami');
    expect(before.status).toBe(200);
    const original = (await before.json()) as { data: { page: { title: string; body: string } } };

    const updated = await adminRequest(admin, '/api/content/pages/tentang-kami', {
      method: 'PUT',
      body: { title: 'Tentang Uji', body: 'Isi uji.' },
    });
    expect(updated.status).toBe(200);
    const payload = (await updated.json()) as { data: { page: { title: string } } };
    expect(payload.data.page.title).toBe('Tentang Uji');

    const restored = await adminRequest(admin, '/api/content/pages/tentang-kami', {
      method: 'PUT',
      body: { title: original.data.page.title, body: original.data.page.body },
    });
    expect(restored.status).toBe(200);

    const missing = await adminRequest(admin, '/api/content/pages/tidak-ada', {
      method: 'PUT',
      body: { title: 'X', body: 'Y' },
    });
    expect(missing.status).toBe(404);
  });

  it('creates, updates, and deletes FAQs', async () => {
    const admin = await registerCookie(true);
    const created = await adminRequest(admin, '/api/content/faqs', {
      method: 'POST',
      body: { category: 'Uji', question: 'Apakah ini uji?', answer: 'Ya, ini uji.' },
    });
    expect(created.status).toBe(201);
    const payload = (await created.json()) as { data: { faq: { id: string } } };
    createdFaqIds.push(payload.data.faq.id);

    const updated = await adminRequest(admin, `/api/content/faqs/${payload.data.faq.id}`, {
      method: 'PUT',
      body: { answer: 'Jawaban baru.' },
    });
    expect(updated.status).toBe(200);

    const deleted = await adminRequest(admin, `/api/content/faqs/${payload.data.faq.id}`, { method: 'DELETE' });
    expect(deleted.status).toBe(200);
    createdFaqIds.pop();

    const invalid = await adminRequest(admin, '/api/content/faqs', {
      method: 'POST',
      body: { category: '', question: '', answer: '' },
    });
    expect(invalid.status).toBe(422);
  });
});
