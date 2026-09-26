import { getDatabase } from '../../../shared/database';
import { randomUUID } from 'node:crypto';
import { createApplicationError } from '../../../shared/errors';
import type { CreateServiceInput, ServiceFaqInput, UpdateServiceInput } from '../contract';

export interface ServiceRow {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  scope: string[];
  process: string[];
  estimated_time: string;
  starting_price: number;
  disclaimer: string | null;
  sort_order: number;
}

export interface ServiceFaqRow {
  id: string;
  service_id: string;
  question: string;
  answer: string;
  sort_order: number;
}

interface StoredServiceRow extends Omit<ServiceRow, 'scope' | 'process'> {
  scope: string;
  process: string;
}

function parseStringList(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function toServiceRow(stored: StoredServiceRow): ServiceRow {
  return { ...stored, scope: parseStringList(stored.scope), process: parseStringList(stored.process) };
}

export function listServices(): ServiceRow[] {
  const rows = getDatabase()
    .prepare('SELECT * FROM services ORDER BY sort_order ASC, name ASC')
    .all() as StoredServiceRow[];
  return rows.map(toServiceRow);
}

export function findServiceBySlug(slug: string): ServiceRow | undefined {
  const row = getDatabase().prepare('SELECT * FROM services WHERE slug = ?').get(slug) as
    | StoredServiceRow
    | undefined;
  return row ? toServiceRow(row) : undefined;
}

export function listServiceFaqs(serviceId: string): ServiceFaqRow[] {
  return getDatabase()
    .prepare('SELECT * FROM service_faqs WHERE service_id = ? ORDER BY sort_order ASC, rowid ASC')
    .all(serviceId) as ServiceFaqRow[];
}

export function findServiceById(id: string): ServiceRow | undefined {
  const row = getDatabase().prepare('SELECT * FROM services WHERE id = ?').get(id) as
    | StoredServiceRow
    | undefined;
  return row ? toServiceRow(row) : undefined;
}

function replaceServiceFaqs(serviceId: string, faqs: ServiceFaqInput[], now: number): void {
  const database = getDatabase();
  database.prepare('DELETE FROM service_faqs WHERE service_id = ?').run(serviceId);
  const insert = database.prepare(
    'INSERT INTO service_faqs (id, service_id, question, answer, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  faqs.forEach((faq, index) => {
    insert.run(randomUUID(), serviceId, faq.question, faq.answer, index, now, now);
  });
}

export function createService(input: CreateServiceInput): ServiceRow {
  const database = getDatabase();
  return database.transaction(() => {
    const existing = database.prepare('SELECT id FROM services WHERE slug = ?').get(input.slug) as
      | { id: string }
      | undefined;
    if (existing) {
      throw createApplicationError('Service slug already exists', 409, 'SLUG_CONFLICT');
    }
    const now = Date.now();
    const id = randomUUID();
    database
      .prepare(
        'INSERT INTO services (id, slug, name, tagline, description, scope, process, estimated_time, starting_price, disclaimer, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        id,
        input.slug,
        input.name,
        input.tagline,
        input.description,
        JSON.stringify(input.scope),
        JSON.stringify(input.process),
        input.estimatedTime,
        input.startingPrice,
        input.disclaimer ?? null,
        input.sortOrder,
        now,
        now,
      );
    replaceServiceFaqs(id, input.faqs, now);
    return toServiceRow(database.prepare('SELECT * FROM services WHERE id = ?').get(id) as StoredServiceRow);
  })();
}

export function updateService(id: string, input: UpdateServiceInput): ServiceRow | undefined {
  const database = getDatabase();
  return database.transaction(() => {
    const current = database.prepare('SELECT * FROM services WHERE id = ?').get(id) as StoredServiceRow | undefined;
    if (!current) return undefined;
    const now = Date.now();
    database
      .prepare(
        'UPDATE services SET name = ?, tagline = ?, description = ?, scope = ?, process = ?, estimated_time = ?, starting_price = ?, disclaimer = ?, sort_order = ?, updated_at = ? WHERE id = ?',
      )
      .run(
        input.name ?? current.name,
        input.tagline ?? current.tagline,
        input.description ?? current.description,
        input.scope ? JSON.stringify(input.scope) : current.scope,
        input.process ? JSON.stringify(input.process) : current.process,
        input.estimatedTime ?? current.estimated_time,
        input.startingPrice ?? current.starting_price,
        input.disclaimer !== undefined ? input.disclaimer : current.disclaimer,
        input.sortOrder ?? current.sort_order,
        now,
        id,
      );
    if (input.faqs) replaceServiceFaqs(id, input.faqs, now);
    return toServiceRow(database.prepare('SELECT * FROM services WHERE id = ?').get(id) as StoredServiceRow);
  })();
}

export function deleteService(id: string): boolean {
  const database = getDatabase();
  return database.transaction(() => {
    database.prepare('DELETE FROM service_faqs WHERE service_id = ?').run(id);
    return database.prepare('DELETE FROM services WHERE id = ?').run(id).changes > 0;
  })();
}
