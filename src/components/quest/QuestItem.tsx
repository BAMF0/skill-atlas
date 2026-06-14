import { useState } from "react";
import type { Quest, CompleteQuestResult } from "../../types";
import { completeQuest, deleteQuest, acceptQuest, unacceptQuest } from "../../lib/operations";

interface QuestItemProps {
  quest: Quest;
  skillColor: string;
  onCompleted: (result: CompleteQuestResult) => void;
  onDeleted: () => void;
  onAccepted?: () => void;
  onUnaccepted?: () => void;
}

export default function QuestItem({ quest, skillColor, onCompleted, onDeleted, onAccepted, onUnaccepted }: QuestItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isCompleted = Boolean(quest.is_completed);
  const isActive = Boolean(quest.is_active);
  const canComplete = !isCompleted || Boolean(quest.is_repeatable);
  const isNonRepeatableCompleted = isCompleted && !quest.is_repeatable;

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

  const handleAccept = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await acceptQuest(quest.id);
      onAccepted?.();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbandon = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await unacceptQuest(quest.id);
      onUnaccepted?.();
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
      className={`flex items-center gap-3 py-2.5 px-3 rounded-lg border transition-colors group ${
        isNonRepeatableCompleted
          ? "bg-warm-50 border-warm-100 opacity-60"
          : isActive
          ? "bg-white border-warm-200"
          : "bg-white border-warm-200 hover:border-warm-300"
      }`}
      style={isActive && !isNonRepeatableCompleted ? { borderLeftWidth: 3, borderLeftColor: skillColor } : {}}
    >
      {/* Left action — accept button or complete checkbox */}
      <div className="flex-shrink-0 flex items-center justify-center w-6">
        {isNonRepeatableCompleted ? (
          <span
            className="w-5 h-5 rounded border flex items-center justify-center"
            style={{ borderColor: "#d4cfc9", backgroundColor: "#e8e4df" }}
          >
            <span className="text-warm-500 text-xs leading-none">✓</span>
          </span>
        ) : isActive ? (
          <button
            onClick={handleComplete}
            disabled={isLoading}
            className="w-5 h-5 rounded border flex items-center justify-center transition-all duration-100 active:scale-90 cursor-pointer"
            style={{ borderColor: skillColor }}
          >
            {isLoading ? (
              <span className="w-2 h-2 border border-t-transparent rounded-full animate-spin" style={{ borderColor: skillColor }} />
            ) : null}
          </button>
        ) : (
          <button
            onClick={handleAccept}
            disabled={isLoading}
            title="Accept quest"
            className="w-5 h-5 rounded flex items-center justify-center font-bold text-sm leading-none transition-all duration-100 active:scale-90 select-none"
            style={{
              backgroundColor: skillColor + "22",
              color: skillColor,
              border: `1.5px solid ${skillColor}55`,
            }}
          >
            {isLoading ? (
              <span className="w-2 h-2 border border-t-transparent rounded-full animate-spin" style={{ borderColor: skillColor }} />
            ) : (
              "+"
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm ${
              isNonRepeatableCompleted ? "text-warm-400 line-through" : "text-warm-800"
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
            {isActive && !isNonRepeatableCompleted && (
              <button
                onClick={handleAbandon}
                disabled={isLoading}
                className="opacity-0 group-hover:opacity-100 text-xs text-warm-300 hover:text-warm-500 transition-opacity"
              >
                Abandon
              </button>
            )}
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
