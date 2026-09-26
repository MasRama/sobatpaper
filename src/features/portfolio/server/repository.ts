import { getDatabase } from '../../../shared/database';
import type { PortfolioItem } from '../contract';

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
