import { randomUUID } from 'node:crypto';
import { getDatabase } from '../../../shared/database';
import type { CreatePackageInput, PricingGroup, PricingPackage, UpdatePackageInput } from '../contract';

export interface PricingPackageRow {
  id: string;
  group_slug: string;
  group_name: string;
  name: string;
  price: number;
  unit: string | null;
  note: string | null;
  sort_order: number;
}

function toPackage(row: PricingPackageRow): PricingPackage {
  return {
    id: row.id,
    groupSlug: row.group_slug,
    groupName: row.group_name,
    name: row.name,
    price: row.price,
    unit: row.unit,
    note: row.note,
  };
}

export function listPackagesGrouped(): PricingGroup[] {
  const rows = getDatabase()
    .prepare('SELECT * FROM pricing_packages ORDER BY sort_order ASC, rowid ASC')
    .all() as PricingPackageRow[];
  const groups = new Map<string, PricingGroup>();
  for (const row of rows) {
    const existing = groups.get(row.group_slug);
    if (existing) existing.packages.push(toPackage(row));
    else groups.set(row.group_slug, { slug: row.group_slug, name: row.group_name, packages: [toPackage(row)] });
  }
  return [...groups.values()];
}

export function findPackageById(id: string): PricingPackage | undefined {
  const row = getDatabase().prepare('SELECT * FROM pricing_packages WHERE id = ?').get(id) as
    | PricingPackageRow
    | undefined;
  return row ? toPackage(row) : undefined;
}

export function createPackage(input: CreatePackageInput): PricingPackage {
  const now = Date.now();
  const row: PricingPackageRow = {
    id: randomUUID(),
    group_slug: input.groupSlug,
    group_name: input.groupName,
    name: input.name,
    price: input.price,
    unit: input.unit ?? null,
    note: input.note ?? null,
    sort_order: input.sortOrder ?? 0,
  };
  getDatabase()
    .prepare(
      `INSERT INTO pricing_packages (id, group_slug, group_name, name, price, unit, note, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(row.id, row.group_slug, row.group_name, row.name, row.price, row.unit, row.note, row.sort_order, now, now);
  return toPackage(row);
}

export function updatePackage(id: string, input: UpdatePackageInput): PricingPackage | undefined {
  const fields: string[] = [];
  const values: unknown[] = [];
  const mapping = {
    groupSlug: 'group_slug',
    groupName: 'group_name',
    name: 'name',
    price: 'price',
    unit: 'unit',
    note: 'note',
    sortOrder: 'sort_order',
  } as const;
  for (const [inputKey, column] of Object.entries(mapping)) {
    const value = input[inputKey as keyof UpdatePackageInput];
    if (value !== undefined) {
      fields.push(`${column} = ?`);
      values.push(value);
    }
  }
  if (fields.length === 0) return findPackageById(id);
  fields.push('updated_at = ?');
  values.push(Date.now(), id);
  getDatabase().prepare(`UPDATE pricing_packages SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return findPackageById(id);
}

export function deletePackage(id: string): boolean {
  const result = getDatabase().prepare('DELETE FROM pricing_packages WHERE id = ?').run(id);
  return result.changes > 0;
}
