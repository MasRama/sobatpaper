import { getDatabase } from '../../../shared/database';
import type { PortfolioItem } from '../contract';
import { randomUUID } from 'node:crypto';
import type { PortfolioItemInput, UpdatePortfolioItemInput } from '../contract';

export function listPortfolioItems(category?: string): PortfolioItem[] {
  if (category) {
    return getDatabase()
      .prepare('SELECT id, category, title, summary FROM portfolio_items WHERE category = ? ORDER BY sort_order ASC, rowid ASC')
      .all(category) as PortfolioItem[];
  }
  return getDatabase()
    .prepare('SELECT id, category, title, summary FROM portfolio_items ORDER BY sort_order ASC, rowid ASC')
    .all() as PortfolioItem[];
}

interface PortfolioItemRow {
  id: string;
  category: string;
  title: string;
  summary: string;
  sort_order: number;
}

export function createPortfolioItem(input: PortfolioItemInput): PortfolioItem {
  const database = getDatabase();
  const now = Date.now();
  const id = randomUUID();
  database
    .prepare(
      'INSERT INTO portfolio_items (id, category, title, summary, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run(id, input.category, input.title, input.summary, input.sortOrder, now, now);
  return { id, category: input.category, title: input.title, summary: input.summary };
}

export function updatePortfolioItem(id: string, input: UpdatePortfolioItemInput): PortfolioItem | undefined {
  const database = getDatabase();
  const current = database
    .prepare('SELECT id, category, title, summary, sort_order FROM portfolio_items WHERE id = ?')
    .get(id) as PortfolioItemRow | undefined;
  if (!current) return undefined;
  database
    .prepare('UPDATE portfolio_items SET category = ?, title = ?, summary = ?, sort_order = ?, updated_at = ? WHERE id = ?')
    .run(
      input.category ?? current.category,
      input.title ?? current.title,
      input.summary ?? current.summary,
      input.sortOrder ?? current.sort_order,
      Date.now(),
      id,
    );
  return {
    id,
    category: input.category ?? current.category,
    title: input.title ?? current.title,
    summary: input.summary ?? current.summary,
  };
}

export function deletePortfolioItem(id: string): boolean {
  return getDatabase().prepare('DELETE FROM portfolio_items WHERE id = ?').run(id).changes > 0;
}
