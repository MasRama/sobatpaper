import { getDatabase } from '../../../shared/database';
import type { ContentPage, Faq } from '../contract';

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
