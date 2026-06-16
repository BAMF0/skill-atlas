import { invoke } from "@tauri-apps/api/core";
import { getDb } from "./db";
import type { Skill, Quest, Resource, Material, XpLogEntry } from "../types";

// ─── Schema ───────────────────────────────────────────────────────────────────

export interface BackupQuest {
  level_num: number;
  title: string;
  description?: string;
  xp_reward: number;
  is_repeatable: boolean;
  completion_count: number;
}

export interface BackupResource {
  title: string;
  type: string;
  url?: string;
  author?: string;
  notes?: string;
}

export interface BackupMaterial {
  name: string;
  category?: string;
  notes?: string;
  url?: string;
  is_optional: boolean;
}

export interface BackupXpLogEntry {
  amount: number;
  source: string;
  note?: string;
  logged_at: string;
  // Links back to a quest by title (ids aren't stable across import); null for manual XP
  quest_title?: string | null;
}

export interface BackupSkill {
  name: string;
  description?: string;
  short_description?: string;
  level_roadmap?: string;
  category?: string;
  color: string;
  icon?: string;
  is_paused?: boolean;
  current_level: number;
  current_xp: number;
  quests: BackupQuest[];
  resources: BackupResource[];
  materials: BackupMaterial[];
  xpLog: BackupXpLogEntry[];
}

// v1 backups predate short_description, roadmap, icon, paused, materials, and
// full xp history; their readers must tolerate those fields being absent.
export interface BackupFile {
  version: 1 | 2;
  exportedAt: string;
  skills: BackupSkill[];
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function buildBackup(): Promise<BackupFile> {
  const db = await getDb();

  const skills = await db.select<Skill[]>("SELECT * FROM skills ORDER BY name ASC");

  const backupSkills: BackupSkill[] = await Promise.all(
    skills.map(async (skill) => {
      const quests = await db.select<(Quest & { completion_count: number })[]>(
        `SELECT q.*,
          (SELECT COUNT(*) FROM quest_completions WHERE quest_id = q.id) AS completion_count
         FROM quests q WHERE q.skill_id = ? ORDER BY q.level_num ASC, q.sort_order ASC`,
        [skill.id]
      );

      const resources = await db.select<Resource[]>(
        "SELECT * FROM resources WHERE skill_id = ? ORDER BY type ASC, title ASC",
        [skill.id]
      );

      const materials = await db.select<Material[]>(
        "SELECT * FROM skill_materials WHERE skill_id = ? ORDER BY is_optional ASC, category ASC, name ASC",
        [skill.id]
      );

      const xpLog = await db.select<(XpLogEntry & { quest_title: string | null })[]>(
        `SELECT x.*, q.title AS quest_title
         FROM xp_log x
         LEFT JOIN quests q ON q.id = x.quest_id
         WHERE x.skill_id = ?
         ORDER BY x.logged_at ASC`,
        [skill.id]
      );

      return {
        name: skill.name,
        description: skill.description ?? undefined,
        short_description: skill.short_description ?? undefined,
        level_roadmap: skill.level_roadmap ?? undefined,
        category: skill.category ?? undefined,
        color: skill.color,
        icon: skill.icon ?? undefined,
        is_paused: Boolean(skill.is_paused),
        current_level: skill.current_level,
        current_xp: skill.current_xp,
        quests: quests.map((q) => ({
          level_num: q.level_num,
          title: q.title,
          description: q.description ?? undefined,
          xp_reward: q.xp_reward,
          is_repeatable: Boolean(q.is_repeatable),
          completion_count: q.completion_count ?? 0,
        })),
        resources: resources.map((r) => ({
          title: r.title,
          type: r.type,
          url: r.url ?? undefined,
          author: r.author ?? undefined,
          notes: r.notes ?? undefined,
        })),
        materials: materials.map((m) => ({
          name: m.name,
          category: m.category ?? undefined,
          notes: m.notes ?? undefined,
          url: m.url ?? undefined,
          is_optional: Boolean(m.is_optional),
        })),
        xpLog: xpLog.map((x) => ({
          amount: x.amount,
          source: x.source,
          note: x.note ?? undefined,
          logged_at: x.logged_at,
          quest_title: x.quest_title,
        })),
      };
    })
  );

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    skills: backupSkills,
  };
}

export async function exportBackup(): Promise<boolean> {
  const data = await buildBackup();
  const json = JSON.stringify(data, null, 2);
  return invoke<boolean>("save_backup", { content: json });
}

// ─── Import ───────────────────────────────────────────────────────────────────

export async function pickBackupFile(): Promise<BackupFile | null> {
  const content = await invoke<string | null>("load_backup");
  if (!content) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("File is not valid JSON");
  }

  const version = (parsed as any)?.version;
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    (version !== 1 && version !== 2) ||
    !Array.isArray((parsed as any).skills)
  ) {
    throw new Error("File does not look like a Skill Atlas backup (missing version or skills array)");
  }

  return parsed as BackupFile;
}

export type ImportMode = "merge" | "replace";

export async function importBackup(backup: BackupFile, mode: ImportMode): Promise<number> {
  const db = await getDb();

  if (mode === "replace") {
    // Delete all existing data — cascades handle related rows
    await db.execute("DELETE FROM skills");
  }

  let imported = 0;

  for (const s of backup.skills) {
    const result = await db.execute(
      `INSERT INTO skills
         (name, description, short_description, level_roadmap, category, color, icon, is_paused, current_level, current_xp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.name,
        s.description ?? null,
        s.short_description ?? null,
        s.level_roadmap ?? null,
        s.category ?? null,
        s.color,
        s.icon ?? null,
        s.is_paused ? 1 : 0,
        s.current_level,
        s.current_xp,
      ]
    );
    const skillId = result.lastInsertId as number;

    // Map quest title -> new id so xp_log entries can be re-linked
    const questIdByTitle = new Map<string, number>();

    for (const q of s.quests) {
      const qResult = await db.execute(
        "INSERT INTO quests (skill_id, level_num, title, description, xp_reward, is_repeatable) VALUES (?, ?, ?, ?, ?, ?)",
        [skillId, q.level_num, q.title, q.description ?? null, q.xp_reward, q.is_repeatable ? 1 : 0]
      );
      const questId = qResult.lastInsertId as number;
      questIdByTitle.set(q.title, questId);

      // Re-insert completion records so the completed state is preserved
      for (let i = 0; i < q.completion_count; i++) {
        await db.execute(
          "INSERT INTO quest_completions (quest_id) VALUES (?)",
          [questId]
        );
      }
    }

    for (const r of s.resources) {
      await db.execute(
        "INSERT INTO resources (skill_id, title, type, url, author, notes) VALUES (?, ?, ?, ?, ?, ?)",
        [skillId, r.title, r.type, r.url ?? null, r.author ?? null, r.notes ?? null]
      );
    }

    for (const m of s.materials ?? []) {
      await db.execute(
        "INSERT INTO skill_materials (skill_id, name, category, notes, url, is_optional) VALUES (?, ?, ?, ?, ?, ?)",
        [skillId, m.name, m.category ?? null, m.notes ?? null, m.url ?? null, m.is_optional ? 1 : 0]
      );
    }

    // Restore real XP history (v2). For v1 backups, reconstruct a single entry
    // so history isn't entirely blank.
    if (s.xpLog && s.xpLog.length > 0) {
      for (const x of s.xpLog) {
        const questId = x.quest_title ? questIdByTitle.get(x.quest_title) ?? null : null;
        await db.execute(
          "INSERT INTO xp_log (skill_id, quest_id, amount, source, note, logged_at) VALUES (?, ?, ?, ?, ?, ?)",
          [skillId, questId, x.amount, x.source, x.note ?? null, x.logged_at]
        );
      }
    } else if (s.current_xp > 0) {
      await db.execute(
        "INSERT INTO xp_log (skill_id, amount, source, note) VALUES (?, ?, 'manual', ?)",
        [skillId, s.current_xp, "Restored from backup"]
      );
    }

    imported++;
  }

  return imported;
}
