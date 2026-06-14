import { useState } from "react";
import type { Quest, CompleteQuestResult } from "../../types";
import { createQuest } from "../../lib/operations";
import { getLevelTitle, MAX_LEVEL } from "../../lib/xpCurve";
import QuestItem from "./QuestItem";

interface QuestListProps {
  quests: Quest[];
  skillId: number;
  skillColor: string;
  currentLevel: number;
  onQuestCompleted: (result: CompleteQuestResult) => void;
  onQuestDeleted: () => void;
  onQuestAdded: () => void;
  onQuestAccepted?: () => void;
  onQuestUnaccepted?: () => void;
}

export default function QuestList({
  quests,
  skillId,
  skillColor,
  currentLevel,
  onQuestCompleted,
  onQuestDeleted,
  onQuestAdded,
  onQuestAccepted,
  onQuestUnaccepted,
}: QuestListProps) {
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(
    new Set([currentLevel])
  );
  const [showLocked, setShowLocked] = useState(false);
  const [addingForLevel, setAddingForLevel] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    xp_reward: "50",
    is_repeatable: false,
  });
  const [saving, setSaving] = useState(false);

  const toggleLevel = (levelNum: number) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(levelNum)) next.delete(levelNum);
      else next.add(levelNum);
      return next;
    });
  };

  const handleAddQuest = async (levelNum: number) => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await createQuest({
        skill_id: skillId,
        level_num: levelNum,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        xp_reward: parseInt(form.xp_reward) || 50,
        is_repeatable: form.is_repeatable,
      });
      setForm({ title: "", description: "", xp_reward: "50", is_repeatable: false });
      setAddingForLevel(null);
      onQuestAdded();
    } catch (err) {
      console.error("Failed to add quest:", err);
    } finally {
      setSaving(false);
    }
  };

  const questsByLevel = new Map<number, Quest[]>();
  for (const q of quests) {
    if (!questsByLevel.has(q.level_num)) questsByLevel.set(q.level_num, []);
    questsByLevel.get(q.level_num)!.push(q);
  }

  // Sort quests within each level: active first, then pending, then completed
  for (const [level, levelQuests] of questsByLevel) {
    questsByLevel.set(level, [...levelQuests].sort((a, b) => {
      const rank = (q: Quest) => q.is_active ? 0 : (q.is_completed && !q.is_repeatable) ? 2 : 1;
      return rank(a) - rank(b);
    }));
  }

  // Separate unlocked levels (≤ currentLevel) from locked (> currentLevel)
  const unlockedLevelNums = new Set<number>();
  unlockedLevelNums.add(currentLevel);
  for (const q of quests) {
    if (q.level_num <= currentLevel) unlockedLevelNums.add(q.level_num);
  }
  const sortedUnlocked = Array.from(unlockedLevelNums).sort((a, b) => a - b);

  const lockedLevelNums = new Set<number>();
  for (const q of quests) {
    if (q.level_num > currentLevel) lockedLevelNums.add(q.level_num);
  }
  const sortedLocked = Array.from(lockedLevelNums).sort((a, b) => a - b);

  const firstLockedLevel = currentLevel + 1;
  const lastLockedLevel = MAX_LEVEL;
  const hasLockedContent = lockedLevelNums.size > 0 || currentLevel < MAX_LEVEL;

  if (sortedUnlocked.length === 0 && sortedLocked.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-warm-400 text-sm">No quests yet.</p>
        <p className="text-warm-300 text-xs mt-1">Add your first quest to get started.</p>
      </div>
    );
  }

  const renderLevelSection = (levelNum: number, isLocked: boolean) => {
    const levelTitle = getLevelTitle(levelNum);
    const levelQuests = questsByLevel.get(levelNum) ?? [];
    const isCurrentLevel = levelNum === currentLevel;
    const isExpanded = expandedLevels.has(levelNum);
    const pendingCount = levelQuests.filter((q) => !q.is_completed || q.is_repeatable).length;
    const activeCount = levelQuests.filter((q) => q.is_active).length;

    return (
      <div
        key={levelNum}
        className={`border rounded-xl overflow-hidden ${
          isLocked ? "border-warm-100 opacity-50" : "border-warm-200"
        }`}
      >
        <button
          onClick={() => toggleLevel(levelNum)}
          className="w-full flex items-center justify-between px-4 py-3 bg-warm-50 hover:bg-warm-100 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-medium w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 tabular-nums"
              style={{
                backgroundColor: isLocked ? undefined : skillColor + "18",
                color: isLocked ? undefined : skillColor,
              }}
            >
              {levelNum}
            </span>
            <div>
              <span className="text-sm font-medium text-warm-800">
                {levelTitle}
                {isCurrentLevel && (
                  <span className="ml-2 text-xs font-normal text-warm-400">current</span>
                )}
                {isLocked && (
                  <span className="ml-2 text-xs font-normal text-warm-300">locked</span>
                )}
              </span>
              {!isLocked && (
                <p className="text-xs text-warm-400">
                  {activeCount > 0
                    ? `${activeCount} active · ${pendingCount} available`
                    : pendingCount > 0
                    ? `${pendingCount} quest${pendingCount > 1 ? "s" : ""} available`
                    : ""}
                </p>
              )}
            </div>
          </div>
          <span className="text-warm-400 text-xs">{isExpanded ? "▲" : "▼"}</span>
        </button>

        {isExpanded && (
          <div className="p-3 space-y-1.5 bg-white">
            {levelQuests.length === 0 && addingForLevel !== levelNum && (
              <p className="text-xs text-warm-400 text-center py-3 italic">
                No quests for this level yet
              </p>
            )}
            {levelQuests.map((quest) => (
              <QuestItem
                key={quest.id}
                quest={quest}
                skillColor={skillColor}
                onCompleted={onQuestCompleted}
                onDeleted={onQuestDeleted}
                onAccepted={onQuestAccepted}
                onUnaccepted={onQuestUnaccepted}
              />
            ))}

            {addingForLevel === levelNum ? (
              <div className="border border-warm-200 rounded-lg p-3 bg-warm-50 space-y-2 mt-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Quest title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full bg-white border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddQuest(levelNum);
                    if (e.key === "Escape") setAddingForLevel(null);
                  }}
                />
                <textarea
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-white border border-warm-200 rounded-lg px-3 py-2 text-sm text-warm-900 placeholder-warm-300 focus:outline-none focus:border-warm-400 resize-none"
                />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-warm-500">XP</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={form.xp_reward}
                      onChange={(e) => setForm((f) => ({ ...f, xp_reward: e.target.value }))}
                      className="w-16 bg-white border border-warm-200 rounded px-2 py-1 text-sm text-warm-900 focus:outline-none focus:border-warm-400"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-warm-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_repeatable}
                      onChange={(e) => setForm((f) => ({ ...f, is_repeatable: e.target.checked }))}
                      className="rounded border-warm-300"
                    />
                    Repeatable
                  </label>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setAddingForLevel(null)}
                    className="px-3 py-1.5 text-xs text-warm-500 hover:text-warm-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAddQuest(levelNum)}
                    disabled={saving || !form.title.trim()}
                    className="px-4 py-1.5 bg-warm-900 hover:bg-warm-800 disabled:opacity-40 text-warm-50 rounded-lg text-xs font-medium transition-colors"
                  >
                    {saving ? "Adding…" : "Add"}
                  </button>
                </div>
              </div>
            ) : (
              !isLocked && levelNum <= MAX_LEVEL && (
                <button
                  onClick={() => setAddingForLevel(levelNum)}
                  className="w-full py-2 text-xs text-warm-400 hover:text-warm-600 border border-dashed border-warm-200 hover:border-warm-300 rounded-lg transition-colors"
                >
                  + Add quest
                </button>
              )
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {sortedUnlocked.map((levelNum) => renderLevelSection(levelNum, false))}

      {/* Locked levels — hidden behind a toggle */}
      {hasLockedContent && (
        <button
          onClick={() => setShowLocked((v) => !v)}
          className="w-full py-2.5 text-xs text-warm-300 hover:text-warm-500 border border-dashed border-warm-100 hover:border-warm-200 rounded-xl transition-colors"
        >
          {showLocked
            ? "Hide future levels"
            : `Levels ${firstLockedLevel}–${lastLockedLevel} — unlocked as you progress`}
        </button>
      )}

      {showLocked && (
        <div className="space-y-2">
          {sortedLocked.map((levelNum) => renderLevelSection(levelNum, true))}

          {/* Add quest at a new level */}
          <button
            onClick={() => {
              const nextLevel = Math.min(currentLevel + 1, MAX_LEVEL);
              setExpandedLevels((prev) => new Set([...prev, nextLevel]));
              setAddingForLevel(nextLevel);
            }}
            className="w-full py-2.5 text-xs text-warm-400 hover:text-warm-600 border border-dashed border-warm-200 hover:border-warm-300 rounded-xl transition-colors"
          >
            + Add quest at new level
          </button>
        </div>
      )}

      {/* Add quest at a new level when locked section not shown */}
      {!showLocked && (
        <button
          onClick={() => {
            const nextLevel = Math.min(currentLevel + 1, MAX_LEVEL);
            setExpandedLevels((prev) => new Set([...prev, nextLevel]));
            setAddingForLevel(nextLevel);
            setShowLocked(true);
          }}
          className="w-full py-2.5 text-xs text-warm-400 hover:text-warm-600 border border-dashed border-warm-200 hover:border-warm-300 rounded-xl transition-colors"
        >
          + Add quest at new level
        </button>
      )}
    </div>
  );
}
