import { getDb } from "./db";
import {
  getLevelTitle,
  levelForXp,
  xpToReachLevel,
  MAX_LEVEL,
  xpPerLevel,
} from "./xpCurve";
import type { SkillTemplate } from "../data/skillLibrary";
import type {
  Skill,
  Level,
  Quest,
  ActiveQuest,
  Resource,
  XpLogEntry,
  CompleteQuestResult,
} from "../types";

// ─── Skills ────────────────────────────────────────────────────────────────

export async function getAllSkills(): Promise<Skill[]> {
  const db = await getDb();
  return db.select<Skill[]>("SELECT * FROM skills ORDER BY name ASC");
}

export async function getSkill(id: number): Promise<Skill | null> {
  const db = await getDb();
  const rows = await db.select<Skill[]>("SELECT * FROM skills WHERE id = ?", [id]);
  return rows[0] ?? null;
}

export async function createSkill(data: {
  name: string;
  description?: string;
  short_description?: string;
  level_roadmap?: string;
  category?: string;
  color: string;
  icon?: string;
}): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    "INSERT INTO skills (name, description, short_description, level_roadmap, category, color, icon) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [data.name, data.description ?? null, data.short_description ?? null, data.level_roadmap ?? null, data.category ?? null, data.color, data.icon ?? null]
  );
  return result.lastInsertId as number;
}

export async function updateSkill(
  id: number,
  data: Partial<Pick<Skill, "name" | "description" | "short_description" | "level_roadmap" | "category" | "color" | "icon">>
): Promise<void> {
  const db = await getDb();
  const fields = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => `${k} = ?`);
  const values = Object.values(data).filter((v) => v !== undefined);
  if (fields.length === 0) return;
  await db.execute(`UPDATE skills SET ${fields.join(", ")} WHERE id = ?`, [...values, id]);
}

export async function deleteSkill(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM skills WHERE id = ?", [id]);
}

export async function addManualXp(
  skillId: number,
  amount: number,
  note?: string
): Promise<CompleteQuestResult> {
  const db = await getDb();
  const [skill] = await db.select<Skill[]>("SELECT * FROM skills WHERE id = ?", [skillId]);
  if (!skill) throw new Error("Skill not found");

  const newXp = skill.current_xp + amount;
  const newLevel = levelForXp(newXp);
  const leveledUp = newLevel > skill.current_level;

  await db.execute(
    "INSERT INTO xp_log (skill_id, amount, source, note) VALUES (?, ?, 'manual', ?)",
    [skillId, amount, note ?? null]
  );
  await db.execute(
    "UPDATE skills SET current_xp = ?, current_level = ? WHERE id = ?",
    [newXp, newLevel, skillId]
  );

  return {
    xpGained: amount,
    newTotalXp: newXp,
    previousLevel: skill.current_level,
    newLevel,
    leveledUp,
    newLevelTitle: getLevelTitle(newLevel),
  };
}

// ─── Levels ────────────────────────────────────────────────────────────────

export async function getLevels(skillId: number): Promise<Level[]> {
  const db = await getDb();
  return db.select<Level[]>(
    "SELECT * FROM levels WHERE skill_id = ? ORDER BY level_num ASC",
    [skillId]
  );
}

export async function updateLevel(
  id: number,
  data: Partial<Pick<Level, "title" | "description">>
): Promise<void> {
  const db = await getDb();
  if (data.title !== undefined) {
    await db.execute("UPDATE levels SET title = ? WHERE id = ?", [data.title, id]);
  }
  if (data.description !== undefined) {
    await db.execute("UPDATE levels SET description = ? WHERE id = ?", [data.description, id]);
  }
}

// ─── Quests ────────────────────────────────────────────────────────────────

export async function getQuests(skillId: number): Promise<Quest[]> {
  const db = await getDb();
  return db.select<Quest[]>(
    `SELECT q.*,
      CASE
        WHEN q.is_repeatable = 0 AND EXISTS(
          SELECT 1 FROM quest_completions WHERE quest_id = q.id
        ) THEN 1 ELSE 0
      END as is_completed,
      (SELECT COUNT(*) FROM quest_completions WHERE quest_id = q.id) as completion_count
     FROM quests q
     WHERE q.skill_id = ?
     ORDER BY q.level_num ASC, q.sort_order ASC, q.created_at ASC`,
    [skillId]
  );
}

export async function createQuest(data: {
  skill_id: number;
  level_num: number;
  title: string;
  description?: string;
  xp_reward: number;
  is_repeatable: boolean;
}): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    "INSERT INTO quests (skill_id, level_num, title, description, xp_reward, is_repeatable) VALUES (?, ?, ?, ?, ?, ?)",
    [
      data.skill_id,
      data.level_num,
      data.title,
      data.description ?? null,
      data.xp_reward,
      data.is_repeatable ? 1 : 0,
    ]
  );
  return result.lastInsertId as number;
}

export async function updateQuest(
  id: number,
  data: Partial<Pick<Quest, "title" | "description" | "xp_reward"> & { is_repeatable: boolean }>
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  if (data.title !== undefined) { fields.push("title = ?"); values.push(data.title); }
  if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description); }
  if (data.xp_reward !== undefined) { fields.push("xp_reward = ?"); values.push(data.xp_reward); }
  if (data.is_repeatable !== undefined) { fields.push("is_repeatable = ?"); values.push(data.is_repeatable ? 1 : 0); }
  if (fields.length === 0) return;
  await db.execute(`UPDATE quests SET ${fields.join(", ")} WHERE id = ?`, [...values, id]);
}

export async function deleteQuest(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM quests WHERE id = ?", [id]);
}

export async function acceptQuest(questId: number): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE quests SET is_active = 1 WHERE id = ?", [questId]);
}

export async function unacceptQuest(questId: number): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE quests SET is_active = 0 WHERE id = ?", [questId]);
}

export async function getActiveQuests(): Promise<ActiveQuest[]> {
  const db = await getDb();
  return db.select<ActiveQuest[]>(
    `SELECT q.*, s.name AS skill_name, s.color AS skill_color
     FROM quests q
     JOIN skills s ON s.id = q.skill_id
     WHERE q.is_active = 1
     ORDER BY s.name, q.level_num, q.sort_order`
  );
}

export async function completeQuest(
  questId: number,
  notes?: string
): Promise<CompleteQuestResult> {
  const db = await getDb();

  const quests = await db.select<Quest[]>("SELECT * FROM quests WHERE id = ?", [questId]);
  const quest = quests[0];
  if (!quest) throw new Error("Quest not found");

  if (!quest.is_repeatable) {
    const existing = await db.select<{ id: number }[]>(
      "SELECT id FROM quest_completions WHERE quest_id = ? LIMIT 1",
      [questId]
    );
    if (existing.length > 0) throw new Error("already_completed");
  }

  const skills = await db.select<Skill[]>("SELECT * FROM skills WHERE id = ?", [quest.skill_id]);
  const skill = skills[0];
  if (!skill) throw new Error("Skill not found");

  const newXp = skill.current_xp + quest.xp_reward;
  const newLevel = Math.min(levelForXp(newXp), MAX_LEVEL);
  const leveledUp = newLevel > skill.current_level;

  await db.execute(
    "INSERT INTO quest_completions (quest_id, notes) VALUES (?, ?)",
    [questId, notes ?? null]
  );
  await db.execute(
    "INSERT INTO xp_log (skill_id, quest_id, amount, source) VALUES (?, ?, ?, 'quest_completion')",
    [quest.skill_id, questId, quest.xp_reward]
  );
  await db.execute(
    "UPDATE skills SET current_xp = ?, current_level = ? WHERE id = ?",
    [newXp, newLevel, quest.skill_id]
  );
  await db.execute("UPDATE quests SET is_active = 0 WHERE id = ?", [questId]);

  return {
    xpGained: quest.xp_reward,
    newTotalXp: newXp,
    previousLevel: skill.current_level,
    newLevel,
    leveledUp,
    newLevelTitle: getLevelTitle(newLevel),
  };
}

export async function uncompleteQuest(questId: number): Promise<void> {
  const db = await getDb();
  // Only for non-repeatable quests — undo the most recent completion
  const completions = await db.select<{ id: number; quest_id: number }[]>(
    "SELECT id, quest_id FROM quest_completions WHERE quest_id = ? ORDER BY completed_at DESC LIMIT 1",
    [questId]
  );
  if (completions.length === 0) return;

  const quests = await db.select<Quest[]>("SELECT * FROM quests WHERE id = ?", [questId]);
  const quest = quests[0];
  if (!quest) return;

  const skills = await db.select<Skill[]>("SELECT * FROM skills WHERE id = ?", [quest.skill_id]);
  const skill = skills[0];
  if (!skill) return;

  const newXp = Math.max(0, skill.current_xp - quest.xp_reward);
  const newLevel = Math.max(1, levelForXp(newXp));

  await db.execute("DELETE FROM quest_completions WHERE id = ?", [completions[0].id]);
  const logEntries = await db.select<{ id: number }[]>(
    "SELECT id FROM xp_log WHERE skill_id = ? AND quest_id = ? AND source = 'quest_completion' ORDER BY logged_at DESC LIMIT 1",
    [quest.skill_id, questId]
  );
  if (logEntries.length > 0) {
    await db.execute("DELETE FROM xp_log WHERE id = ?", [logEntries[0].id]);
  }
  await db.execute(
    "UPDATE skills SET current_xp = ?, current_level = ? WHERE id = ?",
    [newXp, newLevel, quest.skill_id]
  );
}

// ─── Resources ─────────────────────────────────────────────────────────────

export async function getResourcesForSkill(skillId: number): Promise<Resource[]> {
  const db = await getDb();
  return db.select<Resource[]>(
    `SELECT r.* FROM resources r
     WHERE r.skill_id = ?
        OR r.quest_id IN (SELECT id FROM quests WHERE skill_id = ?)
     ORDER BY r.type ASC, r.title ASC`,
    [skillId, skillId]
  );
}

export async function getAllResources(): Promise<Resource[]> {
  const db = await getDb();
  return db.select<Resource[]>(
    `SELECT r.*, s.name as skill_name
     FROM resources r
     LEFT JOIN skills s ON s.id = r.skill_id
     ORDER BY r.type ASC, r.title ASC`
  );
}

export async function createResource(data: {
  skill_id?: number;
  quest_id?: number;
  title: string;
  author?: string;
  type: string;
  url?: string;
  level_num?: number;
  notes?: string;
}): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    "INSERT INTO resources (skill_id, quest_id, title, author, type, url, level_num, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      data.skill_id ?? null,
      data.quest_id ?? null,
      data.title,
      data.author ?? null,
      data.type,
      data.url ?? null,
      data.level_num ?? null,
      data.notes ?? null,
    ]
  );
  return result.lastInsertId as number;
}

export async function deleteResource(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM resources WHERE id = ?", [id]);
}

// ─── XP Log ────────────────────────────────────────────────────────────────

export async function getXpLog(skillId: number): Promise<XpLogEntry[]> {
  const db = await getDb();
  return db.select<XpLogEntry[]>(
    `SELECT x.*, q.title as quest_title
     FROM xp_log x
     LEFT JOIN quests q ON q.id = x.quest_id
     WHERE x.skill_id = ?
     ORDER BY x.logged_at DESC
     LIMIT 50`,
    [skillId]
  );
}

// ─── Template Import ───────────────────────────────────────────────────────

export async function importSkillTemplate(
  skillId: number,
  template: SkillTemplate,
  options: { importQuests?: boolean; importResources?: boolean } = {}
): Promise<void> {
  const { importQuests = true, importResources = true } = options;

  if (importQuests) {
    for (const quest of template.quests) {
      await createQuest({
        skill_id: skillId,
        level_num: quest.level_num,
        title: quest.title,
        description: quest.description,
        xp_reward: quest.xp_reward,
        is_repeatable: quest.is_repeatable,
      });
    }
  }

  if (importResources) {
    for (const resource of template.resources) {
      await createResource({
        skill_id: skillId,
        title: resource.title,
        type: resource.type,
        url: resource.url,
        author: resource.author,
        notes: resource.notes,
      });
    }
  }
}

// re-export for convenience
export { xpPerLevel, xpToReachLevel };
