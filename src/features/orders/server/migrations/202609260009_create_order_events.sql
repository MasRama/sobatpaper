CREATE TABLE order_events (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT NOT NULL REFERENCES orders(id),
  actor_user_id TEXT,
  actor_name TEXT,
  kind TEXT NOT NULL,
  from_value TEXT,
  to_value TEXT,
  note TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_order_events_order ON order_events (order_id);
