import { randomUUID } from 'node:crypto';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { getDatabase } from '../../../shared/database';
import { createApplicationError } from '../../../shared/errors';
import { linkAttachmentsToOrder } from '../../attachments';
import type {
  AdminOrdersQuery,
  CreateOrderInput,
  CreateOrderPaymentInput,
  Order,
  OrderDetail,
  OrderEvent,
  OrderFinalFile,
  OrderPayment,
  OrderStatus,
  UpdateOrderInput,
} from '../contract';
import { isValidOrderTransition } from '../contract';

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

export interface OrderDetailRow extends OrderRow {
  package_name: string | null;
  education_level: string;
  field: string;
  institution: string;
  topic: string;
  method: string;
  pages: number;
  document_condition: string;
  special_needs: string | null;
  contact_name: string;
  contact_whatsapp: string;
  final_price: number | null;
  pic_user_id: string | null;
  cancel_reason: string | null;
  created_at: number;
  updated_at: number;
}

export interface OrderEventRow {
  id: string;
  order_id: string;
  actor_user_id: string | null;
  actor_name: string | null;
  kind: string;
  from_value: string | null;
  to_value: string | null;
  note: string | null;
  created_at: number;
}

interface OrderPaymentRow {
  id: string;
  order_id: string;
  amount: number;
  method: string;
  reference: string | null;
  paid_at: number;
  created_by_user_id: string | null;
  created_by_name: string | null;
  created_at: number;
}

interface OrderFinalFileRow {
  id: string;
  order_id: string;
  original_name: string;
  stored_name: string;
  mime_type: string;
  size: number;
  uploaded_by_user_id: string | null;
  uploaded_by_name: string | null;
  created_at: number;
}

const DETAIL_COLUMNS = `id, number, status, service_slug, package_name, education_level, field, institution, topic, method, pages, document_condition, deadline, special_needs, contact_name, contact_whatsapp, estimate_min, estimate_max, final_price, pic_user_id, cancel_reason, created_at, updated_at`;

function toOrderDetail(row: OrderDetailRow): OrderDetail {
  return {
    id: row.id,
    number: row.number,
    status: row.status as OrderDetail['status'],
    serviceSlug: row.service_slug,
    packageName: row.package_name,
    educationLevel: row.education_level,
    field: row.field,
    institution: row.institution,
    topic: row.topic,
    method: row.method,
    pages: row.pages,
    documentCondition: row.document_condition,
    deadline: row.deadline,
    specialNeeds: row.special_needs,
    contactName: row.contact_name,
    contactWhatsapp: row.contact_whatsapp,
    estimateMin: row.estimate_min,
    estimateMax: row.estimate_max,
    finalPrice: row.final_price,
    picUserId: row.pic_user_id,
    cancelReason: row.cancel_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toOrderEvent(row: OrderEventRow): OrderEvent {
  return {
    id: row.id,
    orderId: row.order_id,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    kind: row.kind as OrderEvent['kind'],
    fromValue: row.from_value,
    toValue: row.to_value,
    note: row.note,
    createdAt: row.created_at,
  };
}

function toOrderPayment(row: OrderPaymentRow): OrderPayment {
  return {
    id: row.id,
    orderId: row.order_id,
    amount: row.amount,
    method: row.method,
    reference: row.reference,
    paidAt: row.paid_at,
    createdByUserId: row.created_by_user_id,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  };
}

function toOrderFinalFile(row: OrderFinalFileRow): OrderFinalFile {
  return {
    id: row.id,
    orderId: row.order_id,
    name: row.original_name,
    size: row.size,
    uploadedByName: row.uploaded_by_name,
    createdAt: row.created_at,
  };
}

function listConditions(query: AdminOrdersQuery): { where: string; params: Array<string | number> } {
  const clauses: string[] = [];
  const params: Array<string | number> = [];
  if (query.status) {
    clauses.push('status = ?');
    params.push(query.status);
  }
  if (query.serviceSlug) {
    clauses.push('service_slug = ?');
    params.push(query.serviceSlug);
  }
  if (query.picUserId) {
    clauses.push('pic_user_id = ?');
    params.push(query.picUserId);
  }
  if (query.deadlineFrom) {
    clauses.push('deadline >= ?');
    params.push(query.deadlineFrom);
  }
  if (query.deadlineTo) {
    clauses.push('deadline <= ?');
    params.push(query.deadlineTo);
  }
  if (query.search) {
    clauses.push('(number LIKE ? ESCAPE \'\\\' OR contact_name LIKE ? ESCAPE \'\\\' OR topic LIKE ? ESCAPE \'\\\')');
    const escaped = query.search.replace(/[\\%_]/g, (char) => `\\${char}`);
    const like = `%${escaped}%`;
    params.push(like, like, like);
  }
  return { where: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

export function listOrders(query: AdminOrdersQuery): { orders: OrderDetail[]; total: number } {
  const database = getDatabase();
  const { where, params } = listConditions(query);
  const total = (database.prepare(`SELECT COUNT(*) AS count FROM orders ${where}`).get(...params) as { count: number }).count;
  const rows = database
    .prepare(`SELECT ${DETAIL_COLUMNS} FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, query.limit, query.offset) as OrderDetailRow[];
  return { orders: rows.map(toOrderDetail), total };
}

export function findOrderDetailById(id: string): OrderDetail | undefined {
  const row = getDatabase().prepare(`SELECT ${DETAIL_COLUMNS} FROM orders WHERE id = ?`).get(id) as OrderDetailRow | undefined;
  return row ? toOrderDetail(row) : undefined;
}

export function listOrderEvents(orderId: string): OrderEvent[] {
  const rows = getDatabase()
    .prepare('SELECT id, order_id, actor_user_id, actor_name, kind, from_value, to_value, note, created_at FROM order_events WHERE order_id = ? ORDER BY created_at ASC')
    .all(orderId) as OrderEventRow[];
  return rows.map(toOrderEvent);
}

export function listOrderPayments(orderId: string): OrderPayment[] {
  const rows = getDatabase()
    .prepare(
      'SELECT id, order_id, amount, method, reference, paid_at, created_by_user_id, created_by_name, created_at FROM order_payments WHERE order_id = ? ORDER BY paid_at DESC, created_at DESC',
    )
    .all(orderId) as OrderPaymentRow[];
  return rows.map(toOrderPayment);
}

export function createOrderPayment(
  orderId: string,
  input: CreateOrderPaymentInput,
  actor: OrderUpdateActor,
): OrderPayment {
  const database = getDatabase();
  const order = database.prepare('SELECT id FROM orders WHERE id = ?').get(orderId) as { id: string } | undefined;
  if (!order) throw createApplicationError('Order not found', 404, 'NOT_FOUND');
  const now = Date.now();
  const row: OrderPaymentRow = {
    id: randomUUID(),
    order_id: orderId,
    amount: input.amount,
    method: input.method.trim(),
    reference: input.reference?.trim() || null,
    paid_at: input.paidAt ?? now,
    created_by_user_id: actor.id,
    created_by_name: actor.name,
    created_at: now,
  };
  database
    .prepare(
      'INSERT INTO order_payments (id, order_id, amount, method, reference, paid_at, created_by_user_id, created_by_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .run(
      row.id,
      row.order_id,
      row.amount,
      row.method,
      row.reference,
      row.paid_at,
      row.created_by_user_id,
      row.created_by_name,
      row.created_at,
    );
  return toOrderPayment(row);
}

export function deleteOrderPayment(orderId: string, paymentId: string): boolean {
  const result = getDatabase().prepare('DELETE FROM order_payments WHERE id = ? AND order_id = ?').run(paymentId, orderId);
  return Number(result.changes) > 0;
}

export function listOrderFinalFiles(orderId: string): OrderFinalFile[] {
  const rows = getDatabase()
    .prepare(
      'SELECT id, order_id, original_name, stored_name, mime_type, size, uploaded_by_user_id, uploaded_by_name, created_at FROM order_final_files WHERE order_id = ? ORDER BY created_at DESC',
    )
    .all(orderId) as OrderFinalFileRow[];
  return rows.map(toOrderFinalFile);
}

export function createOrderFinalFile(data: {
  orderId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  actor: OrderUpdateActor;
}): OrderFinalFile {
  const database = getDatabase();
  const order = database.prepare('SELECT id FROM orders WHERE id = ?').get(data.orderId) as { id: string } | undefined;
  if (!order) throw createApplicationError('Order not found', 404, 'NOT_FOUND');
  const row: OrderFinalFileRow = {
    id: randomUUID(),
    order_id: data.orderId,
    original_name: data.originalName,
    stored_name: data.storedName,
    mime_type: data.mimeType,
    size: data.size,
    uploaded_by_user_id: data.actor.id,
    uploaded_by_name: data.actor.name,
    created_at: Date.now(),
  };
  database
    .prepare(
      'INSERT INTO order_final_files (id, order_id, original_name, stored_name, mime_type, size, uploaded_by_user_id, uploaded_by_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .run(
      row.id,
      row.order_id,
      row.original_name,
      row.stored_name,
      row.mime_type,
      row.size,
      row.uploaded_by_user_id,
      row.uploaded_by_name,
      row.created_at,
    );
  return toOrderFinalFile(row);
}

export function findOrderFinalFile(orderId: string, fileId: string): OrderFinalFileRow | undefined {
  return getDatabase()
    .prepare(
      'SELECT id, order_id, original_name, stored_name, mime_type, size, uploaded_by_user_id, uploaded_by_name, created_at FROM order_final_files WHERE id = ? AND order_id = ?',
    )
    .get(fileId, orderId) as OrderFinalFileRow | undefined;
}

export function deleteOrderFinalFile(orderId: string, fileId: string): boolean {
  const database = getDatabase();
  const row = findOrderFinalFile(orderId, fileId);
  if (!row) return false;
  const result = database.prepare('DELETE FROM order_final_files WHERE id = ? AND order_id = ?').run(fileId, orderId);
  if (Number(result.changes) === 0) return false;
  const path = join(process.cwd(), 'storage', 'order-attachments', row.stored_name);
  if (existsSync(path)) unlinkSync(path);
  return true;
}

export interface OrderUpdateActor {
  id: string;
  name: string;
}

export function updateOrder(id: string, patch: UpdateOrderInput, actor: OrderUpdateActor): OrderDetail {
  const database = getDatabase();
  return database.transaction(() => {
    const current = database.prepare(`SELECT ${DETAIL_COLUMNS} FROM orders WHERE id = ?`).get(id) as OrderDetailRow | undefined;
    if (!current) {
      throw createApplicationError('Order not found', 404, 'NOT_FOUND');
    }
    const nextStatus = (patch.status ?? current.status) as OrderStatus;
    if (!isValidOrderTransition(current.status as OrderStatus, nextStatus)) {
      throw createApplicationError(
        `Cannot move order from ${current.status} to ${nextStatus}`,
        422,
        'INVALID_STATUS_TRANSITION',
      );
    }
    if (nextStatus === 'cancelled' && current.status !== 'cancelled' && !patch.cancelReason?.trim()) {
      throw createApplicationError('Cancel reason is required', 422, 'CANCEL_REASON_REQUIRED');
    }
    const nextFinalPrice = patch.finalPrice !== undefined ? patch.finalPrice : current.final_price;
    const nextPic = patch.picUserId !== undefined ? patch.picUserId : current.pic_user_id;
    const now = Date.now();
    database
      .prepare('UPDATE orders SET status = ?, final_price = ?, pic_user_id = ?, cancel_reason = ?, updated_at = ? WHERE id = ?')
      .run(nextStatus, nextFinalPrice, nextPic, patch.cancelReason?.trim() || (nextStatus === 'cancelled' ? current.cancel_reason : null), now, id);
    const events: Array<{ kind: string; from: string | null; to: string | null; note: string | null }> = [];
    if (nextStatus !== current.status) {
      events.push({
        kind: 'status',
        from: current.status,
        to: nextStatus,
        note: nextStatus === 'cancelled' ? (patch.cancelReason?.trim() ?? current.cancel_reason) : null,
      });
    }
    if (nextFinalPrice !== current.final_price) {
      events.push({
        kind: 'final_price',
        from: current.final_price === null ? null : String(current.final_price),
        to: nextFinalPrice === null ? null : String(nextFinalPrice),
        note: null,
      });
    }
    const insertEvent = database.prepare(
      'INSERT INTO order_events (id, order_id, actor_user_id, actor_name, kind, from_value, to_value, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    );
    for (const event of events) {
      insertEvent.run(randomUUID(), id, actor.id, actor.name, event.kind, event.from, event.to, event.note, now);
    }
    const updated = database.prepare(`SELECT ${DETAIL_COLUMNS} FROM orders WHERE id = ?`).get(id) as OrderDetailRow;
    return toOrderDetail(updated);
  })();
}
