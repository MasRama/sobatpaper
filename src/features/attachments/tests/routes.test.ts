// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../../app/server';
import { getDatabase, seed } from '../../../shared/database';
import { csrfHeaders, issueCsrf, mergeResponseCookies } from '../../../shared/security/tests/helpers';
import { ATTACHMENT_MAX_FILE_SIZE } from '../contract';

const createdIds: string[] = [];

afterEach(() => {
  const database = getDatabase();
  for (const id of createdIds.splice(0)) {
    const row = database.prepare('SELECT stored_name FROM attachments WHERE id = ?').get(id) as
      | { stored_name: string }
      | undefined;
    if (row) rmSync(join(process.cwd(), 'storage', 'order-attachments', row.stored_name), { force: true });
    database.prepare('DELETE FROM attachments WHERE id = ?').run(id);
  }
});
async function uploadFile(content: Uint8Array | string, filename: string, mimeType: string): Promise<Response> {
  const csrf = await issueCsrf(app);
  const form = new FormData();
  const part = typeof content === 'string' ? content : Buffer.from(content);
  form.set('file', new Blob([part], { type: mimeType }), filename);
  return app.request('/api/attachments', {
    method: 'POST',
    headers: { ...csrfHeaders(csrf) },
    body: form,
  });
}

async function registerAdminCookie(): Promise<string> {
  const bootstrap = await issueCsrf(app);
  const response = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { ...csrfHeaders(bootstrap), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Attachment Administrator',
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

describe('attachments routes', () => {
  beforeEach(() => {
    seed();
  });

  it('accepts an allowed file with matching content', async () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const response = await uploadFile(bytes, 'naskah.pdf', 'application/pdf');

    expect(response.status).toBe(201);
    const payload = (await response.json()) as { data: { attachment: { id: string; name: string; size: number } } };
    expect(payload.data.attachment.name).toBe('naskah.pdf');
    createdIds.push(payload.data.attachment.id);
  });

  it('rejects disallowed extensions, oversized files, and mismatched content', async () => {
    const exe = await uploadFile('MZ', 'tool.exe', 'application/octet-stream');
    expect(exe.status).toBe(422);
    await expect(exe.json()).resolves.toMatchObject({ success: false, code: 'FILE_TYPE_NOT_ALLOWED' });

    const big = new Uint8Array(ATTACHMENT_MAX_FILE_SIZE + 1).fill(0x25);
    const oversized = await uploadFile(big, 'huge.pdf', 'application/pdf');
    expect(oversized.status).toBe(413);

    const fake = await uploadFile('bukan pdf sama sekali', 'palsu.pdf', 'application/pdf');
    expect(fake.status).toBe(422);
    await expect(fake.json()).resolves.toMatchObject({ success: false, code: 'FILE_CONTENT_MISMATCH' });
  });

  it('serves stored files to admins only', async () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const uploaded = await uploadFile(bytes, 'rahasia.pdf', 'application/pdf');
    const payload = (await uploaded.json()) as { data: { attachment: { id: string } } };
    const id = payload.data.attachment.id;
    createdIds.push(id);

    const guest = await app.request(`/api/attachments/${id}`);
    expect(guest.status).toBe(401);

    const cookie = await registerAdminCookie();
    const served = await app.request(`/api/attachments/${id}`, { headers: { Cookie: cookie } });
    expect(served.status).toBe(200);
    expect(served.headers.get('content-type')).toContain('application/pdf');
    expect(served.headers.get('content-disposition')).toContain('rahasia.pdf');
    expect(new Uint8Array(await served.arrayBuffer())).toEqual(bytes);

    const missing = await app.request('/api/attachments/tidak-ada', { headers: { Cookie: cookie } });
    expect(missing.status).toBe(404);
  });
});
