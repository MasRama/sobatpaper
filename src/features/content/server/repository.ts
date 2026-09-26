import { getDatabase } from '../../../shared/database';
import type { ContentPage, Faq } from '../contract';
import { randomUUID } from 'node:crypto';
import type { FaqInput, UpdateFaqInput, UpdatePageInput } from '../contract';

export function findPageBySlug(slug: string): ContentPage | undefined {
  const row = getDatabase().prepare('SELECT slug, title, body, updated_at FROM content_pages WHERE slug = ?').get(slug) as
    | { slug: string; title: string; body: string; updated_at: number }
    | undefined;
  if (!row) return undefined;
  return { slug: row.slug, title: row.title, body: row.body, updatedAt: row.updated_at };
}

export function listFaqs(category?: string): Faq[] {
  if (category) {
    return getDatabase()
      .prepare('SELECT id, category, question, answer FROM faqs WHERE category = ? ORDER BY sort_order ASC, rowid ASC')
      .all(category) as Faq[];
  }
  return getDatabase()
    .prepare('SELECT id, category, question, answer FROM faqs ORDER BY sort_order ASC, rowid ASC')
    .all() as Faq[];
}

export function updatePageBySlug(slug: string, input: UpdatePageInput): ContentPage | undefined {
  const database = getDatabase();
  const now = Date.now();
  const changed = database
    .prepare('UPDATE content_pages SET title = ?, body = ?, updated_at = ? WHERE slug = ?')
    .run(input.title, input.body, now, slug).changes;
  if (changed === 0) return undefined;
  return { slug, title: input.title, body: input.body, updatedAt: now };
}

interface FaqRow {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
}

export function createFaq(input: FaqInput): Faq {
  const database = getDatabase();
  const now = Date.now();
  const id = randomUUID();
  database
    .prepare(
      'INSERT INTO faqs (id, category, question, answer, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run(id, input.category, input.question, input.answer, input.sortOrder, now, now);
  return { id, category: input.category, question: input.question, answer: input.answer };
}

export function updateFaq(id: string, input: UpdateFaqInput): Faq | undefined {
  const database = getDatabase();
  const current = database.prepare('SELECT id, category, question, answer, sort_order FROM faqs WHERE id = ?').get(id) as
    | FaqRow
    | undefined;
  if (!current) return undefined;
  database
    .prepare('UPDATE faqs SET category = ?, question = ?, answer = ?, sort_order = ?, updated_at = ? WHERE id = ?')
    .run(
      input.category ?? current.category,
      input.question ?? current.question,
      input.answer ?? current.answer,
      input.sortOrder ?? current.sort_order,
      Date.now(),
      id,
    );
  return {
    id,
    category: input.category ?? current.category,
    question: input.question ?? current.question,
    answer: input.answer ?? current.answer,
  };
}

export function deleteFaq(id: string): boolean {
  return getDatabase().prepare('DELETE FROM faqs WHERE id = ?').run(id).changes > 0;
}
