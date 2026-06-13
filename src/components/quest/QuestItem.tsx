import { useState } from "react";
import type { Quest, CompleteQuestResult } from "../../types";
import { completeQuest, deleteQuest } from "../../lib/operations";

interface QuestItemProps {
  quest: Quest;
  skillColor: string;
  onCompleted: (result: CompleteQuestResult) => void;
  onDeleted: () => void;
}

export default function QuestItem({ quest, skillColor, onCompleted, onDeleted }: QuestItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isCompleted = Boolean(quest.is_completed);
  const canComplete = !isCompleted || Boolean(quest.is_repeatable);

  const handleComplete = async () => {
    if (!canComplete || isLoading) return;
    setIsLoading(true);
    try {
      const result = await completeQuest(quest.id);
      onCompleted(result);
    } catch (err) {
      console.error("Failed to complete quest:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete quest "${quest.title}"?`)) return;
    await deleteQuest(quest.id);
    onDeleted();
  };

  return (
    <div
      className={`flex items-start gap-3 py-2.5 px-3 rounded-lg border transition-colors group ${
        isCompleted && !quest.is_repeatable
          ? "bg-warm-50 border-warm-100 opacity-60"
          : "bg-white border-warm-200 hover:border-warm-300"
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={handleComplete}
        disabled={!canComplete || isLoading}
        className={`flex-shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-colors ${
          isCompleted && !quest.is_repeatable
            ? "border-warm-300 bg-warm-200 cursor-default"
            : canComplete
            ? "border-warm-300 hover:border-opacity-80 cursor-pointer"
            : "border-warm-200 cursor-not-allowed"
        }`}
        style={canComplete && !(isCompleted && !quest.is_repeatable) ? { borderColor: skillColor } : {}}
      >
        {isLoading ? (
          <span className="w-2 h-2 border border-warm-400 border-t-transparent rounded-full animate-spin" />
        ) : isCompleted && !quest.is_repeatable ? (
          <span className="text-warm-500 text-xs leading-none">✓</span>
        ) : null}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`text-sm ${
              isCompleted && !quest.is_repeatable
                ? "text-warm-400 line-through"
                : "text-warm-800"
            }`}
          >
            {quest.title}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {quest.is_repeatable ? (
              <span className="text-xs text-warm-400 italic">repeatable</span>
            ) : null}
            <span
              className="text-xs font-medium tabular-nums px-1.5 py-0.5 rounded"
              style={{ color: skillColor, backgroundColor: skillColor + "18" }}
            >
              +{quest.xp_reward}
            </span>
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 text-warm-300 hover:text-red-400 text-xs transition-opacity ml-0.5"
            >
              ✕
            </button>
          </div>
        </div>
        {quest.description && (
          <p className="text-xs text-warm-400 mt-0.5 leading-relaxed">{quest.description}</p>
        )}
        {quest.is_repeatable && quest.completion_count && quest.completion_count > 0 ? (
          <p className="text-xs text-warm-400 mt-1">×{quest.completion_count} completed</p>
        ) : null}
      </div>
    </div>
  );
}
