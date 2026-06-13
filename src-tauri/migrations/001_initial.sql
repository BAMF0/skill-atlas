CREATE TABLE IF NOT EXISTS skills (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  description   TEXT,
  category      TEXT,
  color         TEXT NOT NULL DEFAULT '#6366f1',
  icon          TEXT,
  current_level INTEGER NOT NULL DEFAULT 1,
  current_xp    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS levels (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_id     INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level_num    INTEGER NOT NULL,
  title        TEXT NOT NULL,
  xp_required  INTEGER NOT NULL,
  description  TEXT,
  UNIQUE(skill_id, level_num)
);

CREATE TABLE IF NOT EXISTS quests (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_id      INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level_num     INTEGER NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  xp_reward     INTEGER NOT NULL DEFAULT 50,
  is_repeatable INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quest_completions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  quest_id     INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  notes        TEXT
);

CREATE TABLE IF NOT EXISTS resources (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_id   INTEGER REFERENCES skills(id) ON DELETE CASCADE,
  quest_id   INTEGER REFERENCES quests(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  author     TEXT,
  type       TEXT NOT NULL DEFAULT 'book',
  url        TEXT,
  level_num  INTEGER,
  notes      TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS xp_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_id  INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  quest_id  INTEGER REFERENCES quests(id),
  amount    INTEGER NOT NULL,
  source    TEXT NOT NULL DEFAULT 'quest_completion',
  note      TEXT,
  logged_at TEXT NOT NULL DEFAULT (datetime('now'))
);
