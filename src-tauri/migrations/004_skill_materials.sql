CREATE TABLE IF NOT EXISTS skill_materials (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_id    INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT,
  notes       TEXT,
  url         TEXT,
  is_optional INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
