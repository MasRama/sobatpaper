CREATE TABLE pricing_packages (
  id TEXT PRIMARY KEY NOT NULL,
  group_slug TEXT NOT NULL,
  group_name TEXT NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  unit TEXT,
  note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_pricing_packages_group ON pricing_packages (group_slug, sort_order);
