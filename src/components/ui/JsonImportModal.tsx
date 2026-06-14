import { useState } from "react";
import Modal from "./Modal";
import { createQuest, createSkill, createMaterial, importSkillTemplate } from "../../lib/operations";
import { useSkillStore } from "../../store/useSkillStore";
import type { CompleteQuestResult } from "../../types";
import { SKILL_COLORS } from "../../types";

// ─── Quest import ────────────────────────────────────────────────────────────

interface QuestJson {
  level_num: number;
  title: string;
  description?: string;
  xp_reward: number;
  is_repeatable: boolean;
}

function validateQuests(raw: unknown): QuestJson[] {
  if (!Array.isArray(raw)) throw new Error("Expected a JSON array");
  return raw.map((item, i) => {
    if (typeof item !== "object" || item === null) throw new Error(`Item ${i + 1} is not an object`);
    const q = item as Record<string, unknown>;
    if (typeof q.title !== "string" || !q.title.trim()) throw new Error(`Item ${i + 1} missing "title"`);
    if (typeof q.level_num !== "number" || q.level_num < 1 || q.level_num > 10)
      throw new Error(`Item ${i + 1} "level_num" must be 1–10`);
    if (typeof q.xp_reward !== "number" || q.xp_reward < 1)
      throw new Error(`Item ${i + 1} "xp_reward" must be a positive number`);
    return {
      level_num: q.level_num,
      title: String(q.title).trim(),
      description: typeof q.description === "string" ? q.description.trim() || undefined : undefined,
      xp_reward: Math.round(q.xp_reward),
      is_repeatable: Boolean(q.is_repeatable),
    };
  });
}

// ─── Skill import ────────────────────────────────────────────────────────────

interface MaterialJson {
  name: string;
  category?: string;
  notes?: string;
  url?: string;
  is_optional?: boolean;
}

interface SkillJson {
  name: string;
  description?: string;
  short_description?: string;
  level_roadmap?: string;
  category?: string;
  color?: string;
  quests?: QuestJson[];
  resources?: {
    title: string;
    type: string;
    url?: string;
    author?: string;
    notes?: string;
  }[];
  materials?: MaterialJson[];
}

function validateSkill(raw: unknown): SkillJson {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw))
    throw new Error("Expected a JSON object");
  const s = raw as Record<string, unknown>;
  if (typeof s.name !== "string" || !s.name.trim()) throw new Error('Missing "name"');
  const quests = Array.isArray(s.quests) ? validateQuests(s.quests) : [];
  const resources = Array.isArray(s.resources)
    ? (s.resources as unknown[]).map((r, i) => {
        if (typeof r !== "object" || r === null) throw new Error(`Resource ${i + 1} invalid`);
        const res = r as Record<string, unknown>;
        if (typeof res.title !== "string") throw new Error(`Resource ${i + 1} missing "title"`);
        return {
          title: String(res.title),
          type: String(res.type ?? "website"),
          url: res.url ? String(res.url) : undefined,
          author: res.author ? String(res.author) : undefined,
          notes: res.notes ? String(res.notes) : undefined,
        };
      })
    : [];
  const materials = Array.isArray(s.materials)
    ? (s.materials as unknown[]).map((m, i) => {
        if (typeof m !== "object" || m === null) throw new Error(`Material ${i + 1} invalid`);
        const mat = m as Record<string, unknown>;
        if (typeof mat.name !== "string" || !mat.name.trim()) throw new Error(`Material ${i + 1} missing "name"`);
        return {
          name: String(mat.name).trim(),
          category: mat.category ? String(mat.category).trim() : undefined,
          notes: mat.notes ? String(mat.notes).trim() : undefined,
          url: mat.url ? String(mat.url) : undefined,
          is_optional: Boolean(mat.is_optional),
        };
      })
    : [];
  return {
    name: String(s.name).trim(),
    description: s.description ? String(s.description).trim() : undefined,
    short_description: s.short_description ? String(s.short_description).trim() : undefined,
    level_roadmap: s.level_roadmap ? String(s.level_roadmap).trim() : undefined,
    category: s.category ? String(s.category).trim() : undefined,
    color: typeof s.color === "string" && s.color.startsWith("#") ? s.color : SKILL_COLORS[0],
    quests,
    resources,
    materials,
  };
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

function questPrompt(skillName: string, levelRange: string) {
  return `Generate quests for a "${skillName}" skill in JSON format. Output only the JSON array, no explanation.

You are generating quests for **levels ${levelRange} only**.

Each quest should be aligned with the skill roadmap and difficulty expectations for those levels.

Schema:

[
{
"level_num": 1,
"title": "Quest title (required)",
"description": "Optional description",
"xp_reward": 50,
"is_repeatable": false
}
]

Rules:

* Only generate quests for the specified level range: ${levelRange}
* Do NOT include quests outside this range
* Generate 20–40 quests per level band (depending on scope)
* Mix of:

  * practice tasks (repeatable)
  * application tasks
  * challenge tasks
  * milestone tasks
* Ensure progression within the band (easier → harder)

XP guidance:

* Level 1 (Novice): 20–60 XP
* Level 2–3 (Beginner/Apprentice): 50–100 XP
* Level 4–5 (Intermediate/Competent): 80–150 XP
* Level 6–7 (Proficient/Advanced): 120–250 XP
* Level 8–9 (Expert/Master): 200–500 XP
* Level 10 (Grandmaster): 400–1000 XP (rare, high-impact milestones)

is_repeatable rules:

* true → habit, drill, practice, repetition-based skill building
* false → projects, milestones, evaluations, one-time achievements

Design rules:

* Quests must match the skill progression defined in the roadmap
* Avoid generic “practice X” unless it is clearly skill-relevant
* Prefer real-world outputs, projects, or measurable outcomes
* Higher levels should emphasize autonomy, complexity, and integration
* Lower levels should emphasize fundamentals and repetition
* Ensure quests feel meaningfully different from each other

Output only valid JSON array.`;
}

function skillPrompt() {
  return `Generate a skill template in JSON format. Output only the JSON object, no explanation.

Design the skill as a complete progression from Level 1 (Novice) to Level 10 (Grandmaster).

Level 10 should represent genuine real-world proficiency. Depending on the skill, reaching Grandmaster may require months or years of practice.

Do not generate any quests yet.

Use this exact schema:

{
"name": "Skill Name",
"short_description": "One to two sentence overview of what the skill is and why it is valuable.",
"level_roadmap": "Level 1 (Novice): Brief description of what a novice can do.\\nLevel 2 (Beginner): ...\\nLevel 3 (Apprentice): ...\\nLevel 4 (Intermediate): ...\\nLevel 5 (Competent): ...\\nLevel 6 (Proficient): ...\\nLevel 7 (Advanced): ...\\nLevel 8 (Expert): ...\\nLevel 9 (Master): ...\\nLevel 10 (Grandmaster): ...",
"category": "Category",
"color": "#6B8EAD",
"quests": [],
"materials": [
{
"name": "Item name",
"category": "equipment",
"notes": "Optional context — what to look for, why it matters",
"url": "Optional purchase or download link",
"is_optional": false
}
],
"resources": [
{
"title": "Resource title",
"type": "book",
"author": "Optional",
"url": "Optional URL",
"notes": "Optional notes"
}
]
}

Requirements:

* short_description: 1–2 sentences — what the skill is and why it matters.
* level_roadmap: cover all 10 levels, one line each, skill-specific (not generic). Each line starts with "Level N (Title): ...".
* Do not generate any quests. Leave the quests array empty.
* Make the roadmap specific to the skill rather than generic.
* Ensure that Level 10 represents genuine mastery.
* Keep level_roadmap detailed enough to guide future quest generation.
* materials: list 5–15 concrete items a learner needs to practice this skill.
  - Use category values: equipment · software · consumables · space · other
  - Mark is_optional: true for nice-to-haves
  - Be specific (e.g. "Classical guitar, nylon-string" not just "guitar")
  - Include a brief notes field explaining what to look for or why it matters

Level titles:

1. Novice
2. Beginner
3. Apprentice
4. Intermediate
5. Competent
6. Proficient
7. Advanced
8. Expert
9. Master
10. Grandmaster

Available colors (muted palette):
#6B8EAD #7B9E8B #B07878 #B08840 #8B7B9E #A86B55 #708090 #8B8B5A #5F8A8B #8B5665

Resource types:
book · article · video · course · website

Include 5–10 high-quality resources that collectively support progression from beginner to advanced.`;
}

// ─── Mode: Quest import ───────────────────────────────────────────────────────

interface QuestImportProps {
  skillId: number;
  skillName: string;
  onClose: () => void;
  onImported: () => void;
}

export function QuestImportModal({ skillId, skillName, onClose, onImported }: QuestImportProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<QuestJson[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [levelFrom, setLevelFrom] = useState(1);
  const [levelTo, setLevelTo] = useState(10);

  const levelRange = levelFrom === levelTo ? String(levelFrom) : `${levelFrom}–${levelTo}`;
  const prompt = questPrompt(skillName, levelRange);

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parseJson = () => {
    setError("");
    setPreview(null);
    try {
      const parsed = validateQuests(JSON.parse(text));
      setPreview(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      for (const q of preview) {
        await createQuest({ skill_id: skillId, ...q });
      }
      onImported();
      onClose();
    } catch (e) {
      setError("Import failed — check the console for details");
    } finally {
      setSaving(false);
    }
  };

  const byLevel = preview
    ? preview.reduce<Record<number, number>>((acc, q) => {
        acc[q.level_num] = (acc[q.level_num] ?? 0) + 1;
        return acc;
      }, {})
    : null;

  return (
    <Modal isOpen onClose={onClose} title="Import Quests" maxWidth="max-w-xl">
      {/* Level range picker */}
      <div className="mb-4 flex items-center gap-3">
        <p className="text-xs font-medium text-warm-500 uppercase tracking-widest">Level range</p>
        <div className="flex items-center gap-2">
          <select
            value={levelFrom}
            onChange={(e) => {
              const v = Number(e.target.value);
              setLevelFrom(v);
              if (v > levelTo) setLevelTo(v);
            }}
            className="bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-2 py-1 text-xs text-warm-800 focus:outline-none focus:border-warm-400"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="text-xs text-warm-400">to</span>
          <select
            value={levelTo}
            onChange={(e) => {
              const v = Number(e.target.value);
              setLevelTo(v);
              if (v < levelFrom) setLevelFrom(v);
            }}
            className="bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-2 py-1 text-xs text-warm-800 focus:outline-none focus:border-warm-400"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* LLM Prompt */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-warm-500 uppercase tracking-widest">LLM Prompt</p>
          <button
            onClick={copyPrompt}
            className="text-xs text-warm-500 hover:text-warm-800 transition-colors"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="text-xs text-warm-500 bg-warm-50 border border-warm-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {prompt}
        </pre>
      </div>

      {/* JSON input */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-warm-500 uppercase tracking-widest">Paste JSON</p>
          {text.trim() && (
            <button
              onClick={parseJson}
              className="text-xs text-warm-600 hover:text-warm-900 font-medium transition-colors"
            >
              Validate →
            </button>
          )}
        </div>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setPreview(null); setError(""); }}
          placeholder='[{"level_num": 1, "title": "...", "xp_reward": 50, "is_repeatable": false}]'
          rows={7}
          className="w-full bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2.5 text-xs font-mono text-warm-800 placeholder-warm-300 focus:outline-none focus:border-warm-400 resize-none"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {/* Preview */}
      {byLevel && (
        <div className="mb-4 p-3 bg-warm-50 border border-warm-200 rounded-lg">
          <p className="text-xs font-medium text-warm-700 mb-2">
            {preview!.length} quests ready to import
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byLevel).sort(([a], [b]) => Number(a) - Number(b)).map(([level, count]) => (
              <span key={level} className="text-xs text-warm-500 bg-warm-50 dark:bg-warm-100 border border-warm-200 rounded px-2 py-0.5">
                Level {level}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button onClick={onClose} className="px-4 py-2 text-sm text-warm-500 hover:text-warm-700">
          Cancel
        </button>
        {!preview && text.trim() && (
          <button
            onClick={parseJson}
            className="px-4 py-2 bg-warm-100 hover:bg-warm-200 text-warm-800 rounded-lg text-sm font-medium transition-colors"
          >
            Validate
          </button>
        )}
        {preview && (
          <button
            onClick={handleImport}
            disabled={saving}
            className="px-5 py-2 bg-warm-900 hover:bg-warm-800 disabled:opacity-40 text-warm-50 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? "Importing…" : `Import ${preview.length} quests`}
          </button>
        )}
      </div>
    </Modal>
  );
}

// ─── Mode: Skill import ───────────────────────────────────────────────────────

interface SkillImportProps {
  onClose: () => void;
  onImported: (skillId: number) => void;
}

export function SkillImportModal({ onClose, onImported }: SkillImportProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<SkillJson | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const prompt = skillPrompt();

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parseJson = () => {
    setError("");
    setPreview(null);
    try {
      setPreview(validateSkill(JSON.parse(text)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      const id = await createSkill({
        name: preview.name,
        description: preview.description,
        short_description: preview.short_description,
        level_roadmap: preview.level_roadmap,
        category: preview.category,
        color: preview.color ?? SKILL_COLORS[0],
      });
      await importSkillTemplate(id, {
        id: preview.name.toLowerCase().replace(/\s+/g, "-"),
        name: preview.name,
        description: preview.description ?? "",
        category: preview.category ?? "",
        icon: "",
        color: preview.color ?? SKILL_COLORS[0],
        quests: preview.quests ?? [],
        resources: (preview.resources ?? []) as any,
      });
      for (const m of preview.materials ?? []) {
        await createMaterial({ skill_id: id, ...m });
      }
      useSkillStore.setState({ initialized: false });
      await useSkillStore.getState().loadSkills();
      onImported(id);
      onClose();
    } catch (e) {
      setError("Import failed — check the console for details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Import Skill from JSON" maxWidth="max-w-xl">
      {/* LLM Prompt */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-warm-500 uppercase tracking-widest">LLM Prompt</p>
          <button
            onClick={copyPrompt}
            className="text-xs text-warm-500 hover:text-warm-800 transition-colors"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="text-xs text-warm-500 bg-warm-50 border border-warm-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {prompt}
        </pre>
      </div>

      {/* JSON input */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-warm-500 uppercase tracking-widest">Paste JSON</p>
          {text.trim() && (
            <button
              onClick={parseJson}
              className="text-xs text-warm-600 hover:text-warm-900 font-medium transition-colors"
            >
              Validate →
            </button>
          )}
        </div>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setPreview(null); setError(""); }}
          placeholder='{"name": "Photography", "description": "...", "quests": [...], "resources": [...]}'
          rows={7}
          className="w-full bg-white dark:bg-warm-100 border border-warm-200 rounded-lg px-3 py-2.5 text-xs font-mono text-warm-800 placeholder-warm-300 focus:outline-none focus:border-warm-400 resize-none"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {/* Preview */}
      {preview && (
        <div className="mb-4 p-3 bg-warm-50 border border-warm-200 rounded-lg space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="w-6 h-6 rounded flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
              style={{ backgroundColor: preview.color }}
            >
              {preview.name.charAt(0)}
            </span>
            <span className="font-serif text-sm font-semibold text-warm-900">{preview.name}</span>
            {preview.category && <span className="text-xs text-warm-400">{preview.category}</span>}
          </div>
          <p className="text-xs text-warm-500">
            {preview.quests?.length ?? 0} quests · {preview.resources?.length ?? 0} resources · {preview.materials?.length ?? 0} materials
          </p>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button onClick={onClose} className="px-4 py-2 text-sm text-warm-500 hover:text-warm-700">
          Cancel
        </button>
        {!preview && text.trim() && (
          <button
            onClick={parseJson}
            className="px-4 py-2 bg-warm-100 hover:bg-warm-200 text-warm-800 rounded-lg text-sm font-medium transition-colors"
          >
            Validate
          </button>
        )}
        {preview && (
          <button
            onClick={handleImport}
            disabled={saving}
            className="px-5 py-2 bg-warm-900 hover:bg-warm-800 disabled:opacity-40 text-warm-50 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? "Importing…" : "Create skill"}
          </button>
        )}
      </div>
    </Modal>
  );
}
