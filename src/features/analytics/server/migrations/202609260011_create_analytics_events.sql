CREATE TABLE analytics_events (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_analytics_events_name ON analytics_events (name);
