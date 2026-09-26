import { randomUUID } from 'node:crypto';
import { getDatabase } from '../../../shared/database';
import { createApplicationError } from '../../../shared/errors';
import { linkAttachmentsToOrder } from '../../attachments';
import type { CreateOrderInput, Order } from '../contract';

export interface OrderRow {
  id: string;
  number: string;
  status: string;
  service_slug: string;
  deadline: string;
  estimate_min: number | null;
  estimate_max: number | null;
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    number: row.number,
    status: row.status as Order['status'],
    serviceSlug: row.service_slug,
    deadline: row.deadline,
    estimateMin: row.estimate_min,
    estimateMax: row.estimate_max,
  };
}

export function findOrderByNumber(number: string): Order | undefined {
  const row = getDatabase()
    .prepare('SELECT id, number, status, service_slug, deadline, estimate_min, estimate_max FROM orders WHERE number = ?')
    .get(number) as OrderRow | undefined;
  return row ? toOrder(row) : undefined;
}

export function createOrder(input: CreateOrderInput): Order {
  const database = getDatabase();
  return database.transaction(() => {
    if (input.attachmentIds.length > 0) {
      const placeholders = input.attachmentIds.map(() => '?').join(', ');
      const matched = database
        .prepare(`SELECT COUNT(*) AS count FROM attachments WHERE order_id IS NULL AND id IN (${placeholders})`)
        .get(...input.attachmentIds) as { count: number };
      if (matched.count !== input.attachmentIds.length) {
        throw createApplicationError('One or more attachments are invalid or already used', 422, 'ATTACHMENTS_INVALID');
      }
    }

    const year = new Date().getFullYear();
    const sequence = database.prepare('SELECT last_seq FROM order_sequences WHERE year = ?').get(year) as
      | { last_seq: number }
      | undefined;
    const nextSeq = (sequence?.last_seq ?? 0) + 1;
    database
      .prepare(
        `INSERT INTO order_sequences (year, last_seq) VALUES (?, ?)
         ON CONFLICT (year) DO UPDATE SET last_seq = excluded.last_seq`,
      )
      .run(year, nextSeq);
    const number = `SP-${year}-${String(nextSeq).padStart(5, '0')}`;

    const now = Date.now();
    const id = randomUUID();
    database
      .prepare(
        `INSERT INTO orders (id, number, status, service_slug, package_name, education_level, field, institution, topic, method, pages, document_condition, deadline, special_needs, contact_name, contact_whatsapp, estimate_min, estimate_max, created_at, updated_at)
         VALUES (?, ?, 'konsultasi', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        number,
        input.serviceSlug,
        input.packageName ?? null,
        input.educationLevel,
        input.field,
        input.institution,
        input.topic,
        input.method,
        input.pages,
        input.documentCondition,
        input.deadline,
        input.specialNeeds ?? null,
        input.contactName,
        input.contactWhatsapp,
        input.estimateMin ?? null,
        input.estimateMax ?? null,
        now,
        now,
      );

    const linked = linkAttachmentsToOrder(input.attachmentIds, id);
    if (linked !== input.attachmentIds.length) {
      throw createApplicationError('One or more attachments are invalid or already used', 422, 'ATTACHMENTS_INVALID');
    }

    return toOrder({
      id,
      number,
      status: 'konsultasi',
      service_slug: input.serviceSlug,
      deadline: input.deadline,
      estimate_min: input.estimateMin ?? null,
      estimate_max: input.estimateMax ?? null,
    });
  })();
}
