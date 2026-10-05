CREATE TABLE IF NOT EXISTS saves (
  token_hash TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS create_limits (
  bucket TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  count INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS create_limits_day ON create_limits(day);
