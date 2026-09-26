import { randomUUID } from 'node:crypto';
import { getDatabase } from '../../../shared/database';
import type { AdminLeadsQuery, CreateLeadInput, Lead, UpdateLeadInput } from '../contract';

export interface LeadRow {
  id: string;
  name: string;
  whatsapp: string;
  need: string;
  service_slug: string | null;
  status: string;
  converted_order_id: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

const COLUMNS = 'id, name, whatsapp, need, service_slug, status, converted_order_id, notes, created_at, updated_at';

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    whatsapp: row.whatsapp,
    need: row.need,
    serviceSlug: row.service_slug,
    status: row.status as Lead['status'],
    convertedOrderId: row.converted_order_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createLead(input: CreateLeadInput): Lead {
  const database = getDatabase();
  const now = Date.now();
  const id = randomUUID();
  database
    .prepare(
      'INSERT INTO leads (id, name, whatsapp, need, service_slug, status, converted_order_id, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .run(id, input.name, input.whatsapp, input.need, input.serviceSlug ?? null, 'baru', null, null, now, now);
  return toLead(database.prepare(`SELECT ${COLUMNS} FROM leads WHERE id = ?`).get(id) as LeadRow);
}

function listConditions(query: AdminLeadsQuery): { where: string; params: Array<string | number> } {
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
  if (query.search) {
    clauses.push('(name LIKE ? ESCAPE \'\\\' OR whatsapp LIKE ? ESCAPE \'\\\' OR need LIKE ? ESCAPE \'\\\')');
    const escaped = query.search.replace(/[\\%_]/g, (char) => `\\${char}`);
    const like = `%${escaped}%`;
    params.push(like, like, like);
  }
  return { where: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

export function listLeads(query: AdminLeadsQuery): { leads: Lead[]; total: number } {
  const database = getDatabase();
  const { where, params } = listConditions(query);
  const total = (database.prepare(`SELECT COUNT(*) AS count FROM leads ${where}`).get(...params) as { count: number })
    .count;
  const rows = database
    .prepare(`SELECT ${COLUMNS} FROM leads ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params, query.limit, query.offset) as LeadRow[];
  return { leads: rows.map(toLead), total };
}

export function findLeadById(id: string): Lead | undefined {
  const row = getDatabase().prepare(`SELECT ${COLUMNS} FROM leads WHERE id = ?`).get(id) as LeadRow | undefined;
  return row ? toLead(row) : undefined;
}

export function updateLead(id: string, input: UpdateLeadInput): Lead | undefined {
  const database = getDatabase();
  const current = database.prepare(`SELECT ${COLUMNS} FROM leads WHERE id = ?`).get(id) as LeadRow | undefined;
  if (!current || current.status === 'converted') return undefined;
  database
    .prepare('UPDATE leads SET status = ?, notes = ?, updated_at = ? WHERE id = ?')
    .run(input.status ?? current.status, input.notes !== undefined ? input.notes : current.notes, Date.now(), id);
  return toLead(database.prepare(`SELECT ${COLUMNS} FROM leads WHERE id = ?`).get(id) as LeadRow);
}

export function markLeadConverted(id: string, orderId: string): Lead | undefined {
  const database = getDatabase();
  const changed = database
    .prepare(`UPDATE leads SET status = 'converted', converted_order_id = ?, updated_at = ? WHERE id = ? AND status != 'converted'`)
    .run(orderId, Date.now(), id).changes;
  if (changed === 0) return undefined;
  return toLead(database.prepare(`SELECT ${COLUMNS} FROM leads WHERE id = ?`).get(id) as LeadRow);
}
