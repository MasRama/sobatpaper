import { randomUUID } from 'node:crypto';
import { getDatabase } from '../../../shared/database';
import type { TrackEventInput } from '../contract';

export function trackEvent(input: TrackEventInput): string {
  const database = getDatabase();
  const id = randomUUID();
  database
    .prepare('INSERT INTO analytics_events (id, name, payload, created_at) VALUES (?, ?, ?, ?)')
    .run(id, input.name, JSON.stringify(input.payload), Date.now());
  return id;
}

export function eventSummary(): { counts: Record<string, number>; total: number } {
  const rows = getDatabase()
    .prepare('SELECT name, COUNT(*) AS count FROM analytics_events GROUP BY name')
    .all() as Array<{ name: string; count: number }>;
  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    counts[row.name] = row.count;
    total += row.count;
  }
  return { counts, total };
}
