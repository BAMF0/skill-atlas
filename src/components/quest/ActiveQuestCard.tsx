import { useState } from "react";
import type { ActiveQuest, CompleteQuestResult } from "../../types";
import { completeQuest, unacceptQuest } from "../../lib/operations";
import { getLevelTitle } from "../../lib/xpCurve";

interface Props {
  quest: ActiveQuest;
  onCompleted: (result: CompleteQuestResult) => void;
  onAbandoned: () => void;
  onNavigate: (skillId: number) => void;
}

export default function ActiveQuestCard({ quest, onCompleted, onAbandoned, onNavigate }: Props) {
  const [completing, setCompleting] = useState(false);
  const [abandoning, setAbandoning] = useState(false);
  const color = quest.skill_color;

  const handleComplete = async () => {
    if (completing) return;
    setCompleting(true);
    try {
      const result = await completeQuest(quest.id);
      onCompleted(result);
    } catch (err) {
      console.error("Failed to complete quest:", err);
      setCompleting(false);
    }
  };

  const handleAbandon = async () => {
    if (abandoning) return;
    setAbandoning(true);
    try {
      await unacceptQuest(quest.id);
      onAbandoned();
    } catch (err) {
      setAbandoning(false);
    }
  };

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 bg-white border border-warm-200 hover:border-warm-300 rounded-xl transition-colors group"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-warm-800 leading-snug">{quest.title}</p>
          {/* XP + complete button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="text-xs font-medium tabular-nums px-1.5 py-0.5 rounded"
              style={{ color, backgroundColor: color + "18" }}
            >
              +{quest.xp_reward} XP
            </span>
            <button
              onClick={handleComplete}
              disabled={completing}
              title="Complete quest"
              className="w-5 h-5 rounded border flex items-center justify-center transition-all duration-100 active:scale-90 flex-shrink-0 cursor-pointer"
              style={{ borderColor: color }}
            >
              {completing && (
                <span
                  className="w-2 h-2 border border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: color, borderTopColor: "transparent" }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Skill + level — clickable to navigate */}
        <button
          onClick={() => onNavigate(quest.skill_id)}
          className="text-xs text-warm-400 hover:text-warm-600 transition-colors mt-0.5 text-left"
        >
          {quest.skill_name} · Lvl {quest.level_num} {getLevelTitle(quest.level_num)}
        </button>

        {/* Description */}
        {quest.description && (
          <p className="text-xs text-warm-400 mt-1 leading-relaxed line-clamp-2">
            {quest.description}
          </p>
        )}

        {/* Abandon — hover reveal */}
        <div className="flex justify-end mt-1">
          <button
            onClick={handleAbandon}
            disabled={abandoning}
            className="opacity-0 group-hover:opacity-100 text-xs text-warm-300 hover:text-warm-500 transition-opacity"
          >
            Abandon
          </button>
        </div>
      </div>
    </div>
  );
}
