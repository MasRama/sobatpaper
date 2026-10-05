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
    database.prepare('DELETE FROM order_final_files WHERE order_id = ?').run(id);
    database.prepare('DELETE FROM order_payments WHERE order_id = ?').run(id);
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

  it('lists orders with status, deadline, PIC, and search filters', async () => {
    const admin = await registerCookie(true);
    const id = await createOrderId();
    const database = getDatabase();
    database.prepare('UPDATE orders SET pic_user_id = ? WHERE id = ?').run(admin.userId, id);
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

    const deadline = await adminRequest(admin.cookie, '/api/orders?deadlineFrom=2030-10-01&deadlineTo=2030-10-31');
    expect(deadline.status).toBe(200);
    const deadlinePayload = (await deadline.json()) as { data: { orders: Array<{ id: string }> } };
    expect(deadlinePayload.data.orders.some((order) => order.id === id)).toBe(true);

    const pic = await adminRequest(admin.cookie, `/api/orders?picUserId=${encodeURIComponent(admin.userId)}`);
    expect(pic.status).toBe(200);
    const picPayload = (await pic.json()) as { data: { orders: Array<{ id: string; picUserId: string | null }> } };
    expect(picPayload.data.orders.some((order) => order.id === id && order.picUserId === admin.userId)).toBe(true);

    const invalid = await adminRequest(admin.cookie, '/api/orders?status=bogus');
    expect(invalid.status).toBe(422);
  });

  it('shows order detail with attachments, events, payments, and final files', async () => {
    const admin = await registerCookie(true);
    const id = await createOrderId();
    const response = await adminRequest(admin.cookie, `/api/orders/${id}`);
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      data: { order: { id: string; contactName: string }; attachments: unknown[]; events: unknown[]; payments: unknown[]; finalFiles: unknown[] };
    };
    expect(payload.data.order.id).toBe(id);
    expect(payload.data.attachments).toEqual([]);
    expect(payload.data.events).toEqual([]);
    expect(payload.data.payments).toEqual([]);
    expect(payload.data.finalFiles).toEqual([]);

    const missing = await adminRequest(admin.cookie, `/api/orders/${randomUUID()}`);
    expect(missing.status).toBe(404);
  });

  it('manages payments and final files for admins', async () => {
    const admin = await registerCookie(true);
    const id = await createOrderId();

    const payment = await adminRequest(admin.cookie, `/api/orders/${id}/payments`, {
      method: 'POST',
      body: { amount: 1250000, method: 'transfer', reference: 'TRX-001' },
    });
    expect(payment.status).toBe(201);
    const paymentPayload = (await payment.json()) as { data: { payment: { id: string; amount: number; reference: string | null } } };
    expect(paymentPayload.data.payment).toMatchObject({ amount: 1250000, reference: 'TRX-001' });

    const csrf = await issueCsrf(app, admin.cookie);
    const form = new FormData();
    form.set('file', new Blob([new Uint8Array([0x25, 0x50, 0x44, 0x46])], { type: 'application/pdf' }), 'hasil-final.pdf');
    const uploaded = await app.request(`/api/orders/${id}/final-files`, {
      method: 'POST',
      headers: { ...csrfHeaders(csrf) },
      body: form,
    });
    expect(uploaded.status).toBe(201);
    const uploadPayload = (await uploaded.json()) as { data: { file: { id: string; name: string } } };
    expect(uploadPayload.data.file.name).toBe('hasil-final.pdf');

    const detail = await adminRequest(admin.cookie, `/api/orders/${id}`);
    const detailPayload = (await detail.json()) as { data: { payments: unknown[]; finalFiles: unknown[] } };
    expect(detailPayload.data.payments).toHaveLength(1);
    expect(detailPayload.data.finalFiles).toHaveLength(1);

    const downloaded = await app.request(`/api/orders/${id}/final-files/${uploadPayload.data.file.id}`, {
      headers: { Cookie: admin.cookie },
    });
    expect(downloaded.status).toBe(200);
    expect(downloaded.headers.get('content-disposition')).toContain('hasil-final.pdf');

    const deletePayment = await adminRequest(admin.cookie, `/api/orders/${id}/payments/${paymentPayload.data.payment.id}`, { method: 'DELETE' });
    expect(deletePayment.status).toBe(200);
    const deleteFile = await adminRequest(admin.cookie, `/api/orders/${id}/final-files/${uploadPayload.data.file.id}`, { method: 'DELETE' });
    expect(deleteFile.status).toBe(200);
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

  it('tracks payment success when an order reaches paid', async () => {
    const admin = await registerCookie(true);
    const id = await createOrderId();
    const database = getDatabase();

    for (const status of ['menunggu_dokumen', 'analisis_scope', 'menunggu_pembayaran', 'paid'] as const) {
      const response = await adminRequest(admin.cookie, `/api/orders/${id}`, {
        method: 'PATCH',
        body: status === 'analisis_scope' ? { status, finalPrice: 2750000 } : { status },
      });
      expect(response.status).toBe(200);
    }

    const event = database
      .prepare("SELECT payload FROM analytics_events WHERE name = 'payment_success' ORDER BY created_at DESC LIMIT 1")
      .get() as { payload: string } | undefined;
    expect(event).toBeDefined();
    expect(JSON.parse(event?.payload ?? '{}')).toMatchObject({ service: 'skripsi', amount: 2750000 });

    await adminRequest(admin.cookie, `/api/orders/${id}`, { method: 'PATCH', body: { picUserId: admin.userId } });
    const count = database
      .prepare("SELECT COUNT(*) AS count FROM analytics_events WHERE name = 'payment_success'")
      .get() as { count: number };
    expect(count.count).toBe(1);
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
