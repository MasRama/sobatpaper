import { getDatabase } from '../../../shared/database';
import type { Testimonial } from '../contract';

export function listTestimonials(): Testimonial[] {
  const rows = getDatabase()
    .prepare('SELECT id, display_name, role, content FROM testimonials ORDER BY sort_order ASC, rowid ASC')
    .all() as Array<{ id: string; display_name: string; role: string; content: string }>;
  return rows.map((row) => ({ id: row.id, displayName: row.display_name, role: row.role, content: row.content }));
}
