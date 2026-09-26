// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../../app/server';
import { getDatabase, seed } from '../../../shared/database';
import { csrfHeaders, issueCsrf } from '../../../shared/security/tests/helpers';

const createdOrderIds: string[] = [];
const createdAttachmentIds: string[] = [];

afterEach(() => {
  const database = getDatabase();
  for (const id of createdAttachmentIds.splice(0)) {
    const row = database.prepare('SELECT stored_name FROM attachments WHERE id = ?').get(id) as
      | { stored_name: string }
      | undefined;
    if (row) rmSync(join(process.cwd(), 'storage', 'order-attachments', row.stored_name), { force: true });
    database.prepare('DELETE FROM attachments WHERE id = ?').run(id);
  }
  for (const id of createdOrderIds.splice(0)) {
    database.prepare('DELETE FROM orders WHERE id = ?').run(id);
  }
});

function orderPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    serviceSlug: 'analisis-data',
    educationLevel: 'S2',
    field: 'Pendidikan',
    institution: 'Universitas Contoh',
    topic: 'Pengaruh X terhadap Y',
    method: 'Kuantitatif regresi',
    pages: 0,
    documentCondition: 'lengkap',
    deadline: '2030-09-30',
    contactName: 'Budi Santoso',
    contactWhatsapp: '628123456789',
    attachmentIds: [],
    ...overrides,
  };
}

async function postOrder(payload: unknown): Promise<Response> {
  const csrf = await issueCsrf(app);
  return app.request('/api/orders', {
    method: 'POST',
    headers: { ...csrfHeaders(csrf), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function uploadPdf(filename: string): Promise<string> {
  const csrf = await issueCsrf(app);
  const form = new FormData();
  form.set(
    'file',
    new Blob([Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d])], { type: 'application/pdf' }),
    filename,
  );
  const response = await app.request('/api/attachments', {
    method: 'POST',
    headers: { ...csrfHeaders(csrf) },
    body: form,
  });
  expect(response.status).toBe(201);
  const payload = (await response.json()) as { data: { attachment: { id: string } } };
  createdAttachmentIds.push(payload.data.attachment.id);
  return payload.data.attachment.id;
}

describe('orders routes', () => {
  beforeEach(() => {
    seed();
  });

  it('creates orders with unique sequential numbers', async () => {
    const first = await postOrder(orderPayload());
    const second = await postOrder(orderPayload());

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    const firstBody = (await first.json()) as { data: { order: { id: string; number: string; status: string } } };
    const secondBody = (await second.json()) as { data: { order: { id: string; number: string; status: string } } };
    createdOrderIds.push(firstBody.data.order.id, secondBody.data.order.id);

    expect(firstBody.data.order.number).toMatch(/^SP-\d{4}-\d{5}$/);
    expect(firstBody.data.order.status).toBe('konsultasi');
    expect(secondBody.data.order.number).not.toBe(firstBody.data.order.number);
    const firstSeq = Number(firstBody.data.order.number.slice(-5));
    const secondSeq = Number(secondBody.data.order.number.slice(-5));
    expect(secondSeq).toBe(firstSeq + 1);
  });

  it('links uploaded attachments to the created order', async () => {
    const attachmentId = await uploadPdf('data.pdf');
    const response = await postOrder(orderPayload({ attachmentIds: [attachmentId] }));

    expect(response.status).toBe(201);
    const payload = (await response.json()) as { data: { order: { id: string } } };
    createdOrderIds.push(payload.data.order.id);
    const row = getDatabase().prepare('SELECT order_id FROM attachments WHERE id = ?').get(attachmentId) as {
      order_id: string | null;
    };
    expect(row.order_id).toBe(payload.data.order.id);
  });

  it('rejects unknown or already-linked attachments', async () => {
    const unknown = await postOrder(orderPayload({ attachmentIds: [`tidak-ada-${randomUUID()}`] }));
    expect(unknown.status).toBe(422);
    await expect(unknown.json()).resolves.toMatchObject({ success: false, code: 'ATTACHMENTS_INVALID' });

    const attachmentId = await uploadPdf('sekali.pdf');
    const first = await postOrder(orderPayload({ attachmentIds: [attachmentId] }));
    expect(first.status).toBe(201);
    const firstBody = (await first.json()) as { data: { order: { id: string } } };
    createdOrderIds.push(firstBody.data.order.id);

    const reused = await postOrder(orderPayload({ attachmentIds: [attachmentId] }));
    expect(reused.status).toBe(422);
    await expect(reused.json()).resolves.toMatchObject({ success: false, code: 'ATTACHMENTS_INVALID' });
  });

  it('rejects malformed orders with field diagnostics', async () => {
    const response = await postOrder(
      orderPayload({ contactWhatsapp: 'abc', deadline: '2020-01-01', topic: '' }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      code: 'VALIDATION_ERROR',
      errors: { contactWhatsapp: expect.any(Array), deadline: expect.any(Array), topic: expect.any(Array) },
    });
  });
});
