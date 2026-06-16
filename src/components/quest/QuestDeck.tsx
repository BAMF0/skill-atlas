import { useState, useEffect } from "react";
import type { Quest } from "../../types";
import { acceptQuest } from "../../lib/operations";

interface QuestDeckProps {
  quests: Quest[];
  skillColor: string;
  currentLevel: number;
  lastCompletion?: Record<number, string>;
  onAccepted: () => void;
}

// How stale a repeatable quest is, as a 0–0.8 bonus added to its draw score.
// Never-completed repeatable quests count as fully stale; non-repeatable get 0.
function stalenessBonus(quest: Quest, lastCompletion: Record<number, string>): number {
  if (!quest.is_repeatable) return 0;
  const last = lastCompletion[quest.id];
  if (!last) return 0.8;
  const days = (Date.now() - new Date(last).getTime()) / 86_400_000;
  return Math.min(days / 30, 1) * 0.8;
}

// Fair (Fisher–Yates) random draw, biased toward least-recently-practiced
// repeatable quests so practice quests resurface like light spaced repetition.
function samplePool(
  pool: Quest[],
  n: number,
  lastCompletion: Record<number, string> = {}
): number[] {
  return [...pool]
    .map((q) => ({ id: q.id, score: Math.random() + stalenessBonus(q, lastCompletion) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.id);
}

export default function QuestDeck({ quests, skillColor, currentLevel, lastCompletion = {}, onAccepted }: QuestDeckProps) {
  const pool = quests.filter(
    (q) => q.level_num === currentLevel && !q.is_active && !(q.is_completed && !q.is_repeatable)
  );

  const [drawnIds, setDrawnIds] = useState<number[]>(() => samplePool(pool, 3, lastCompletion));
  const [accepting, setAccepting] = useState<number | null>(null);

  // Re-derive drawn cards when pool changes (e.g. after accepting a quest)
  useEffect(() => {
    setDrawnIds((prev) => {
      const stillValid = prev.filter((id) => pool.some((q) => q.id === id));
      if (stillValid.length === prev.length) return prev;
      const remaining = pool.filter((q) => !stillValid.includes(q.id));
      const needed = Math.min(3 - stillValid.length, remaining.length);
      const extras = samplePool(remaining, needed, lastCompletion);
      return [...stillValid, ...extras];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quests]);

  const shown = pool.filter((q) => drawnIds.includes(q.id));
  const canShuffle = pool.length > shown.length;

  const handleShuffle = () => {
    setDrawnIds(samplePool(pool, 3, lastCompletion));
  };

  const handleAccept = async (questId: number) => {
    if (accepting !== null) return;
    setAccepting(questId);
    try {
      await acceptQuest(questId);
      onAccepted();
    } finally {
      setAccepting(null);
    }
  };

  if (pool.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="font-serif text-warm-700 mb-1">All caught up at this level</p>
        <p className="text-sm text-warm-400">Accept active quests or explore future levels below.</p>
      </div>
    );
  }

  return (
    <div className="mb-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {shown.map((quest) => (
          <div
            key={quest.id}
            className="flex flex-col bg-white dark:bg-warm-200 border border-warm-200 rounded-xl overflow-hidden"
            style={{ borderLeftWidth: 3, borderLeftColor: skillColor }}
          >
            <div className="flex-1 p-4">
              {/* XP + repeatable */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-medium tabular-nums px-1.5 py-0.5 rounded"
                  style={{ color: skillColor, backgroundColor: skillColor + "18" }}
                >
                  +{quest.xp_reward} XP
                </span>
                {Boolean(quest.is_repeatable) && (
                  <span className="text-sm text-warm-300" title="Repeatable">↻</span>
                )}
              </div>

              {/* Title */}
              <p className="font-serif text-sm font-semibold text-warm-900 leading-snug mb-2">
                {quest.title}
              </p>

              {/* Description */}
              {quest.description && (
                <p className="text-xs text-warm-400 leading-relaxed line-clamp-3">
                  {quest.description}
                </p>
              )}
            </div>

            {/* Accept button */}
            <div className="px-4 pb-4">
              <button
                onClick={() => handleAccept(quest.id)}
                disabled={accepting !== null}
                className="w-full py-2 rounded-lg text-xs font-medium transition-all duration-100 active:scale-95"
                style={{
                  backgroundColor: skillColor + "18",
                  color: skillColor,
                  border: `1.5px solid ${skillColor}33`,
                }}
              >
                {accepting === quest.id ? (
                  <span className="inline-block w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: skillColor, borderTopColor: "transparent" }} />
                ) : (
                  "Accept"
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {canShuffle && (
        <div className="flex justify-center mt-3">
          <button
            onClick={handleShuffle}
            className="text-xs text-warm-300 hover:text-warm-500 transition-colors flex items-center gap-1"
          >
            <span>↻</span> Show different quests
          </button>
        </div>
      )}
    </div>
  );
}
