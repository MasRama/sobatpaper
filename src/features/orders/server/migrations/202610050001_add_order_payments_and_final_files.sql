CREATE TABLE order_payments (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  method TEXT NOT NULL,
  reference TEXT,
  paid_at INTEGER NOT NULL,
  created_by_user_id TEXT,
  created_by_name TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_order_payments_order ON order_payments (order_id, paid_at DESC);

CREATE TABLE order_final_files (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  uploaded_by_user_id TEXT,
  uploaded_by_name TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_order_final_files_order ON order_final_files (order_id, created_at DESC);
