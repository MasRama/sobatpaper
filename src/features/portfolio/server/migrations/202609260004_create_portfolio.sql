CREATE TABLE portfolio_items (
  id TEXT PRIMARY KEY NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_portfolio_items_category ON portfolio_items (category, sort_order);
