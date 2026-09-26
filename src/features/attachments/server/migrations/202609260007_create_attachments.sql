CREATE TABLE attachments (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_attachments_order_id ON attachments (order_id);
