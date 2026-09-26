// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../../app/server';
import { getDatabase, seed } from '../../../shared/database';
import { csrfHeaders, issueCsrf, mergeResponseCookies } from '../../../shared/security/tests/helpers';

const createdOrderIds: string[] = [];

afterEach(() => {
  const database = getDatabase();
  for (const id of createdOrderIds.splice(0)) {
    database.prepare('DELETE FROM order_events WHERE order_id = ?').run(id);
    database.prepare('DELETE FROM orders WHERE id = ?').run(id);
  }
});

function orderPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    serviceSlug: 'skripsi',
    educationLevel: 'S1',
    field: 'Manajemen',
    institution: 'Universitas Contoh',
    topic: 'Topik uji admin',
    method: 'Kuantitatif',
    pages: 10,
    documentCondition: 'draf',
    deadline: '2030-10-31',
    contactName: 'Admin Tester',
    contactWhatsapp: '628123456789',
    attachmentIds: [],
    ...overrides,
  };
}

async function registerCookie(asAdmin: boolean): Promise<{ cookie: string; userId: string }> {
  const bootstrap = await issueCsrf(app);
  const response = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { ...csrfHeaders(bootstrap), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: asAdmin ? 'Order Administrator' : 'Regular Customer',
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
  return { cookie: mergeResponseCookies(bootstrap.cookie, response), userId: payload.data.user.id };
}

async function adminRequest(
  cookie: string,
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

async function createOrderId(): Promise<string> {
  const csrf = await issueCsrf(app);
  const response = await app.request('/api/orders', {
    method: 'POST',
    headers: { ...csrfHeaders(csrf), 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload()),
  });
  expect(response.status).toBe(201);
  const payload = (await response.json()) as { data: { order: { id: string } } };
  createdOrderIds.push(payload.data.order.id);
  return payload.data.order.id;
}

describe('orders admin routes', () => {
  beforeEach(() => {
    seed();
  });

  it('rejects anonymous and non-admin readers', async () => {
    const anonymous = await app.request('/api/orders');
    expect(anonymous.status).toBe(401);

    const customer = await registerCookie(false);
    const forbidden = await adminRequest(customer.cookie, '/api/orders');
    expect(forbidden.status).toBe(403);
  });

  it('lists orders with status and search filters', async () => {
    const admin = await registerCookie(true);
    await createOrderId();
    const filtered = await adminRequest(admin.cookie, '/api/orders?status=konsultasi&limit=10');
    expect(filtered.status).toBe(200);
    const payload = (await filtered.json()) as {
      data: { orders: Array<{ status: string; number: string }>; total: number };
    };
    expect(payload.data.total).toBeGreaterThanOrEqual(1);
    expect(payload.data.orders.every((order) => order.status === 'konsultasi')).toBe(true);

    const searched = await adminRequest(admin.cookie, '/api/orders?search=Topik%20uji%20admin');
    expect(searched.status).toBe(200);
    const searchedPayload = (await searched.json()) as { data: { total: number } };
    expect(searchedPayload.data.total).toBeGreaterThanOrEqual(1);

    const invalid = await adminRequest(admin.cookie, '/api/orders?status=bogus');
    expect(invalid.status).toBe(422);
  });

  it('shows order detail with attachments and events', async () => {
    const admin = await registerCookie(true);
    const id = await createOrderId();
    const response = await adminRequest(admin.cookie, `/api/orders/${id}`);
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      data: { order: { id: string; contactName: string }; attachments: unknown[]; events: unknown[] };
    };
    expect(payload.data.order.id).toBe(id);
    expect(payload.data.attachments).toEqual([]);
    expect(payload.data.events).toEqual([]);

    const missing = await adminRequest(admin.cookie, `/api/orders/${randomUUID()}`);
    expect(missing.status).toBe(404);
  });

  it('applies valid transitions and records audit events', async () => {
    const admin = await registerCookie(true);
    const id = await createOrderId();
    const response = await adminRequest(admin.cookie, `/api/orders/${id}`, {
      method: 'PATCH',
      body: { status: 'analisis_scope', finalPrice: 3500000, picUserId: admin.userId },
    });
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      data: { order: { status: string; finalPrice: number; picUserId: string } };
    };
    expect(payload.data.order.status).toBe('analisis_scope');
    expect(payload.data.order.finalPrice).toBe(3500000);
    expect(payload.data.order.picUserId).toBe(admin.userId);

    const events = getDatabase()
      .prepare(
        'SELECT kind, from_value, to_value, actor_name FROM order_events WHERE order_id = ? ORDER BY created_at ASC',
      )
      .all(id) as Array<{
        kind: string;
        from_value: string | null;
        to_value: string | null;
        actor_name: string | null;
      }>;
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ kind: 'status', from_value: 'konsultasi', to_value: 'analisis_scope' });
    expect(events[0]?.actor_name).toBe('Order Administrator');
    expect(events[1]).toMatchObject({ kind: 'final_price', from_value: null, to_value: '3500000' });
  });

  it('rejects invalid transitions, missing cancel reason, and unknown PIC', async () => {
    const admin = await registerCookie(true);
    const id = await createOrderId();

    const skipped = await adminRequest(admin.cookie, `/api/orders/${id}`, {
      method: 'PATCH',
      body: { status: 'completed' },
    });
    expect(skipped.status).toBe(422);
    await expect(skipped.json()).resolves.toMatchObject({ success: false, code: 'INVALID_STATUS_TRANSITION' });

    const noReason = await adminRequest(admin.cookie, `/api/orders/${id}`, {
      method: 'PATCH',
      body: { status: 'cancelled' },
    });
    expect(noReason.status).toBe(422);
    await expect(noReason.json()).resolves.toMatchObject({ success: false, code: 'CANCEL_REASON_REQUIRED' });

    const unknownPic = await adminRequest(admin.cookie, `/api/orders/${id}`, {
      method: 'PATCH',
      body: { picUserId: randomUUID() },
    });
    expect(unknownPic.status).toBe(422);

    const nothing = await adminRequest(admin.cookie, `/api/orders/${id}`, { method: 'PATCH', body: {} });
    expect(nothing.status).toBe(422);
  });
});
