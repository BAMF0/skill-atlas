import { invoke } from "@tauri-apps/api/core";
import { getDb } from "./db";
import type { Skill, Quest, Resource } from "../types";

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

export interface BackupSkill {
  name: string;
  description?: string;
  category?: string;
  color: string;
  current_level: number;
  current_xp: number;
  quests: BackupQuest[];
  resources: BackupResource[];
}

export interface BackupFile {
  version: 1;
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

      return {
        name: skill.name,
        description: skill.description ?? undefined,
        category: skill.category ?? undefined,
        color: skill.color,
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
      };
    })
  );

  return {
    version: 1,
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

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    (parsed as any).version !== 1 ||
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
      "INSERT INTO skills (name, description, category, color, current_level, current_xp) VALUES (?, ?, ?, ?, ?, ?)",
      [
        s.name,
        s.description ?? null,
        s.category ?? null,
        s.color,
        s.current_level,
        s.current_xp,
      ]
    );
    const skillId = result.lastInsertId as number;

    for (const q of s.quests) {
      const qResult = await db.execute(
        "INSERT INTO quests (skill_id, level_num, title, description, xp_reward, is_repeatable) VALUES (?, ?, ?, ?, ?, ?)",
        [skillId, q.level_num, q.title, q.description ?? null, q.xp_reward, q.is_repeatable ? 1 : 0]
      );
      const questId = qResult.lastInsertId as number;

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

    // Reconstruct XP log from current_xp so history isn't entirely blank
    if (s.current_xp > 0) {
      await db.execute(
        "INSERT INTO xp_log (skill_id, amount, source, note) VALUES (?, ?, 'manual', ?)",
        [skillId, s.current_xp, "Restored from backup"]
      );
    }

    imported++;
  }

  return imported;
}
