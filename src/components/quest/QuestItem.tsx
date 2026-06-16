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
  const [showDesc, setShowDesc] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const isCompleted = Boolean(quest.is_completed);
  const isActive = Boolean(quest.is_active);
  const canComplete = !isCompleted || Boolean(quest.is_repeatable);
  const isNonRepeatableCompleted = isCompleted && !quest.is_repeatable;
  const hasDesc = Boolean(quest.description);

  const handleCompleteClick = () => {
    if (!canComplete || isLoading) return;
    setShowNotes(true);
  };

  const handleCompleteSubmit = async () => {
    if (!canComplete || isLoading) return;
    setIsLoading(true);
    setShowNotes(false);
    try {
      const result = await completeQuest(quest.id, notes.trim() || undefined);
      setNotes("");
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

  // Wrapper that expands tap area to ~44px without changing layout
  const ActionBtn = ({ children, onClick, disabled, title }: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    title?: string;
  }) => (
    <div className="flex items-center justify-center w-11 h-11 -m-3 flex-shrink-0">
      <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className="w-5 h-5 rounded border flex items-center justify-center transition-all duration-100 active:scale-90 cursor-pointer"
        style={{ borderColor: skillColor }}
      >
        {children}
      </button>
    </div>
  );

  return (
    <div
      className={`flex items-start gap-3 py-2.5 px-3 rounded-lg border transition-colors group ${
        isNonRepeatableCompleted
          ? "bg-warm-50 border-warm-100 opacity-60"
          : isActive
          ? "bg-white dark:bg-warm-200 border-warm-200"
          : "bg-white dark:bg-warm-200 border-warm-200 hover:border-warm-300"
      }`}
      style={isActive && !isNonRepeatableCompleted ? { borderLeftWidth: 3, borderLeftColor: skillColor } : {}}
    >
      {/* Left action — accept button or complete checkbox */}
      <div className="flex-shrink-0 flex items-center justify-center w-6 mt-0.5">
        {isNonRepeatableCompleted ? (
          <span
            className="w-5 h-5 rounded border flex items-center justify-center"
            style={{ borderColor: "#d4cfc9", backgroundColor: "#e8e4df" }}
          >
            <span className="text-warm-500 text-xs leading-none">✓</span>
          </span>
        ) : isActive ? (
          <div className="flex items-center justify-center w-11 h-11 -m-3 flex-shrink-0">
            <button
              onClick={handleCompleteClick}
              disabled={isLoading}
              title="Complete quest"
              className="w-5 h-5 rounded border flex items-center justify-center transition-all duration-100 active:scale-90 cursor-pointer"
              style={{ borderColor: skillColor }}
            >
              {isLoading ? (
                <span className="w-2 h-2 border border-t-transparent rounded-full animate-spin" style={{ borderColor: skillColor }} />
              ) : null}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center w-11 h-11 -m-3 flex-shrink-0">
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
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          {/* Title row — clickable to toggle description */}
          <button
            onClick={() => hasDesc && setShowDesc((v) => !v)}
            className={`flex items-center gap-1 text-left flex-1 min-w-0 ${hasDesc ? "cursor-pointer" : "cursor-default"} ${
              isNonRepeatableCompleted ? "text-warm-400 line-through" : "text-warm-800"
            }`}
          >
            <span className="text-sm">{quest.title}</span>
            {hasDesc && (
              <span className="text-warm-300 text-xs flex-shrink-0 ml-0.5">
                {showDesc ? "▾" : "▸"}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {quest.is_repeatable ? (
              <span className="text-sm text-warm-300" title="Repeatable">↻</span>
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
                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-xs text-warm-300 hover:text-warm-500 transition-opacity"
              >
                Abandon
              </button>
            )}
            {/* Delete — hover-only on desktop, hidden on mobile to reduce accidental taps */}
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 text-warm-300 hover:text-red-400 text-xs transition-opacity ml-0.5 px-1"
            >
              ✕
            </button>
          </div>
        </div>

        {showDesc && quest.description && (
          <p className="text-xs text-warm-400 mt-1 leading-relaxed">{quest.description}</p>
        )}

        {showNotes && (
          <div className="mt-2 flex gap-2 items-start">
            <textarea
              autoFocus
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleCompleteSubmit(); } if (e.key === "Escape") { setShowNotes(false); setNotes(""); } }}
              placeholder="What did you learn? (optional)"
              rows={2}
              className="flex-1 text-xs bg-warm-50 dark:bg-warm-100 border border-warm-200 rounded-lg px-2.5 py-1.5 text-warm-800 placeholder-warm-300 focus:outline-none focus:border-warm-400 resize-none"
            />
            <button
              onClick={handleCompleteSubmit}
              className="px-2.5 py-1.5 text-xs font-medium text-warm-50 rounded-lg transition-colors flex-shrink-0"
              style={{ backgroundColor: skillColor }}
            >
              Done
            </button>
          </div>
        )}

        {quest.is_repeatable && quest.completion_count && quest.completion_count > 0 ? (
          <p className="text-xs text-warm-400 mt-1">×{quest.completion_count} completed</p>
        ) : null}
      </div>
    </div>
  );
}
