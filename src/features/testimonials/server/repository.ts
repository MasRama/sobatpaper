import { getDatabase } from '../../../shared/database';
import type { Testimonial } from '../contract';
import { randomUUID } from 'node:crypto';
import type { TestimonialInput, UpdateTestimonialInput } from '../contract';

export function listTestimonials(): Testimonial[] {
  const rows = getDatabase()
    .prepare('SELECT id, display_name, role, content FROM testimonials ORDER BY sort_order ASC, rowid ASC')
    .all() as Array<{ id: string; display_name: string; role: string; content: string }>;
  return rows.map((row) => ({ id: row.id, displayName: row.display_name, role: row.role, content: row.content }));
}

interface TestimonialRow {
  id: string;
  display_name: string;
  role: string;
  content: string;
  sort_order: number;
}

function toTestimonial(row: { id: string; display_name: string; role: string; content: string }): Testimonial {
  return { id: row.id, displayName: row.display_name, role: row.role, content: row.content };
}

export function createTestimonial(input: TestimonialInput): Testimonial {
  const database = getDatabase();
  const now = Date.now();
  const id = randomUUID();
  database
    .prepare(
      'INSERT INTO testimonials (id, display_name, role, content, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run(id, input.displayName, input.role, input.content, input.sortOrder, now, now);
  return { id, displayName: input.displayName, role: input.role, content: input.content };
}

export function updateTestimonial(id: string, input: UpdateTestimonialInput): Testimonial | undefined {
  const database = getDatabase();
  const current = database
    .prepare('SELECT id, display_name, role, content, sort_order FROM testimonials WHERE id = ?')
    .get(id) as TestimonialRow | undefined;
  if (!current) return undefined;
  database
    .prepare('UPDATE testimonials SET display_name = ?, role = ?, content = ?, sort_order = ?, updated_at = ? WHERE id = ?')
    .run(
      input.displayName ?? current.display_name,
      input.role ?? current.role,
      input.content ?? current.content,
      input.sortOrder ?? current.sort_order,
      Date.now(),
      id,
    );
  return toTestimonial({
    id,
    display_name: input.displayName ?? current.display_name,
    role: input.role ?? current.role,
    content: input.content ?? current.content,
  });
}

export function deleteTestimonial(id: string): boolean {
  return getDatabase().prepare('DELETE FROM testimonials WHERE id = ?').run(id).changes > 0;
}
