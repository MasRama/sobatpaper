import { randomUUID } from 'node:crypto';
import { getDatabase } from '../../../shared/database';

export interface AttachmentRow {
  id: string;
  order_id: string | null;
  original_name: string;
  stored_name: string;
  mime_type: string;
  size: number;
}
export function createAttachmentRow(data: {
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
}): AttachmentRow {
  const row: AttachmentRow = {
    id: randomUUID(),
    order_id: null,
    original_name: data.originalName,
    stored_name: data.storedName,
    mime_type: data.mimeType,
    size: data.size,
  };
  getDatabase()
    .prepare(
      `INSERT INTO attachments (id, order_id, original_name, stored_name, mime_type, size, created_at)
       VALUES (?, NULL, ?, ?, ?, ?, ?)`,
    )
    .run(row.id, row.original_name, row.stored_name, row.mime_type, row.size, Date.now());
  return row;
}

export function findAttachmentById(id: string): AttachmentRow | undefined {
  return getDatabase().prepare('SELECT * FROM attachments WHERE id = ?').get(id) as AttachmentRow | undefined;
}

/** Links only currently-unlinked attachments; returns how many were linked. */
export function linkAttachmentsToOrder(ids: string[], orderId: string): number {
  if (ids.length === 0) return 0;
  const placeholders = ids.map(() => '?').join(', ');
  const result = getDatabase()
    .prepare(`UPDATE attachments SET order_id = ? WHERE order_id IS NULL AND id IN (${placeholders})`)
    .run(orderId, ...ids);
  return Number(result.changes);
}

export function listAttachmentsByOrder(orderId: string): AttachmentRow[] {
  return getDatabase().prepare('SELECT * FROM attachments WHERE order_id = ? ORDER BY created_at ASC').all(orderId) as AttachmentRow[];
}
