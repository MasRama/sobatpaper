CREATE TABLE services (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  scope TEXT NOT NULL,
  process TEXT NOT NULL,
  estimated_time TEXT NOT NULL,
  starting_price INTEGER NOT NULL,
  disclaimer TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX idx_services_slug ON services (slug);

CREATE TABLE service_faqs (
  id TEXT PRIMARY KEY NOT NULL,
  service_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE
);

CREATE INDEX idx_service_faqs_service_id ON service_faqs (service_id);
