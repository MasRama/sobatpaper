// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../../app/server';
import { getDatabase, seed } from '../../../shared/database';
import { csrfHeaders, issueCsrf, mergeResponseCookies } from '../../../shared/security/tests/helpers';

const createdLeadIds: string[] = [];
const createdOrderIds: string[] = [];

afterEach(() => {
  const database = getDatabase();
  for (const id of createdOrderIds.splice(0)) {
    database.prepare('DELETE FROM orders WHERE id = ?').run(id);
  }
  for (const id of createdLeadIds.splice(0)) {
    database.prepare('DELETE FROM leads WHERE id = ?').run(id);
  }
});

function leadPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'Calon Customer',
    whatsapp: '628123456789',
    need: 'Butuh bantuan analisis data skripsi.',
    serviceSlug: 'analisis-data',
    ...overrides,
  };
}

function orderPayload(): Record<string, unknown> {
  return {
    serviceSlug: 'analisis-data',
    educationLevel: 'S1',
    field: 'Psikologi',
    institution: 'Universitas Contoh',
    topic: 'Konversi lead uji',
    method: 'Kuantitatif',
    pages: 5,
    documentCondition: 'draf',
    deadline: '2030-11-30',
    contactName: 'Calon Customer',
    contactWhatsapp: '628123456789',
    attachmentIds: [],
  };
}

async function postLead(payload: unknown): Promise<Response> {
  const csrf = await issueCsrf(app);
  return app.request('/api/leads', {
    method: 'POST',
    headers: { ...csrfHeaders(csrf), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function registerCookie(asAdmin: boolean): Promise<string> {
  const bootstrap = await issueCsrf(app);
  const response = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { ...csrfHeaders(bootstrap), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: asAdmin ? 'Leads Administrator' : 'Leads Customer',
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

async function adminRequest(cookie: string, path: string, init: { method?: string; body?: unknown } = {}): Promise<Response> {
  const csrf = await issueCsrf(app, cookie);
  return app.request(path, {
    method: init.method ?? 'GET',
    headers: { ...csrfHeaders(csrf), 'Content-Type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

describe('leads routes', () => {
  beforeEach(() => {
    seed();
  });

  it('accepts public leads and rejects malformed ones', async () => {
    const response = await postLead(leadPayload());
    expect(response.status).toBe(201);
    const payload = (await response.json()) as { data: { lead: { id: string; status: string } } };
    createdLeadIds.push(payload.data.lead.id);
    expect(payload.data.lead.status).toBe('baru');

    const invalid = await postLead(leadPayload({ whatsapp: 'abc', need: '' }));
    expect(invalid.status).toBe(422);
    await expect(invalid.json()).resolves.toMatchObject({
      success: false,
      code: 'VALIDATION_ERROR',
      errors: { whatsapp: expect.any(Array), need: expect.any(Array) },
    });
  });

  it('restricts listing and updates to admins', async () => {
    const anonymous = await app.request('/api/leads');
    expect(anonymous.status).toBe(401);

    const customer = await registerCookie(false);
    const forbidden = await adminRequest(customer, '/api/leads');
    expect(forbidden.status).toBe(403);
  });

  it('lists, filters, and updates leads', async () => {
    const admin = await registerCookie(true);
    const created = await postLead(leadPayload());
    const payload = (await created.json()) as { data: { lead: { id: string } } };
    createdLeadIds.push(payload.data.lead.id);

    const listed = await adminRequest(admin, '/api/leads?status=baru&search=Calon%20Customer');
    expect(listed.status).toBe(200);
    const listedPayload = (await listed.json()) as { data: { leads: Array<{ id: string }>; total: number } };
    expect(listedPayload.data.total).toBeGreaterThanOrEqual(1);
    expect(listedPayload.data.leads.some((lead) => lead.id === payload.data.lead.id)).toBe(true);

    const updated = await adminRequest(admin, `/api/leads/${payload.data.lead.id}`, {
      method: 'PATCH',
      body: { status: 'dihubungi', notes: 'Sudah dihubungi via WA.' },
    });
    expect(updated.status).toBe(200);
    const updatedPayload = (await updated.json()) as { data: { lead: { status: string; notes: string } } };
    expect(updatedPayload.data.lead.status).toBe('dihubungi');
    expect(updatedPayload.data.lead.notes).toBe('Sudah dihubungi via WA.');
  });

  it('converts leads into linked orders exactly once', async () => {
    const admin = await registerCookie(true);
    const created = await postLead(leadPayload());
    const payload = (await created.json()) as { data: { lead: { id: string } } };
    createdLeadIds.push(payload.data.lead.id);

    const converted = await adminRequest(admin, `/api/leads/${payload.data.lead.id}/convert`, {
      method: 'POST',
      body: orderPayload(),
    });
    expect(converted.status).toBe(201);
    const convertedPayload = (await converted.json()) as {
      data: { lead: { status: string; convertedOrderId: string }; order: { id: string; number: string } };
    };
    createdOrderIds.push(convertedPayload.data.order.id);
    expect(convertedPayload.data.lead.status).toBe('converted');
    expect(convertedPayload.data.lead.convertedOrderId).toBe(convertedPayload.data.order.id);
    expect(convertedPayload.data.order.number).toMatch(/^SP-\d{4}-\d{5}$/);

    const again = await adminRequest(admin, `/api/leads/${payload.data.lead.id}/convert`, {
      method: 'POST',
      body: orderPayload(),
    });
    expect(again.status).toBe(409);
    await expect(again.json()).resolves.toMatchObject({ success: false, code: 'LEAD_CONVERTED' });

    const locked = await adminRequest(admin, `/api/leads/${payload.data.lead.id}`, {
      method: 'PATCH',
      body: { status: 'cold' },
    });
    expect(locked.status).toBe(409);
  });

  it('rejects convert with an invalid order payload', async () => {
    const admin = await registerCookie(true);
    const created = await postLead(leadPayload());
    const payload = (await created.json()) as { data: { lead: { id: string } } };
    createdLeadIds.push(payload.data.lead.id);

    const converted = await adminRequest(admin, `/api/leads/${payload.data.lead.id}/convert`, {
      method: 'POST',
      body: { serviceSlug: 'skripsi' },
    });
    expect(converted.status).toBe(422);
  });
});
