CREATE TABLE order_sequences (
  year INTEGER PRIMARY KEY NOT NULL,
  last_seq INTEGER NOT NULL
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY NOT NULL,
  number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  service_slug TEXT NOT NULL,
  package_name TEXT,
  education_level TEXT NOT NULL,
  field TEXT NOT NULL,
  institution TEXT NOT NULL,
  topic TEXT NOT NULL,
  method TEXT NOT NULL,
  pages INTEGER NOT NULL DEFAULT 0,
  document_condition TEXT NOT NULL,
  deadline TEXT NOT NULL,
  special_needs TEXT,
  contact_name TEXT NOT NULL,
  contact_whatsapp TEXT NOT NULL,
  estimate_min INTEGER,
  estimate_max INTEGER,
  final_price INTEGER,
  pic_user_id TEXT,
  cancel_reason TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX idx_orders_number ON orders (number);
CREATE INDEX idx_orders_status ON orders (status);
