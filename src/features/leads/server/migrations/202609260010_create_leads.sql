CREATE TABLE leads (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  need TEXT NOT NULL,
  service_slug TEXT,
  status TEXT NOT NULL DEFAULT 'baru',
  converted_order_id TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_leads_status ON leads (status);
