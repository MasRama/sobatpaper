import { getDatabase } from '../../../shared/database';

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
