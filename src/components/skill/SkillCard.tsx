import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Skill } from "../../types";
import XpBar from "./XpBar";
import LevelBadge from "./LevelBadge";
import { getLevelTitle, MAX_LEVEL } from "../../lib/xpCurve";

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months !== 1 ? "s" : ""} ago`;
}

interface SkillCardProps {
  skill: Skill;
  activeQuestCount?: number;
  lastPracticed?: string;
  onPause?: (id: number) => void;
}

export default function SkillCard({ skill, activeQuestCount = 0, lastPracticed, onPause }: SkillCardProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className="relative group">
      <button
        onClick={() => navigate(`/skill/${skill.id}`)}
        className="w-full text-left bg-white dark:bg-warm-200 border border-warm-200 hover:border-warm-300 hover:shadow-sm rounded-xl p-4 transition-all flex gap-3"
      >
        {/* Left color bar */}
        <div
          className="w-0.5 self-stretch rounded-full flex-shrink-0"
          style={{ backgroundColor: skill.color }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <h3 className="font-serif text-sm font-semibold text-warm-900 truncate group-hover:text-warm-700 transition-colors">
                {skill.name}
              </h3>
              {skill.category && (
                <p className="text-xs text-warm-400 mt-0.5">{skill.category}</p>
              )}
            </div>
            <LevelBadge level={skill.current_level} size="sm" />
          </div>

          <XpBar currentXp={skill.current_xp} color={skill.color} showLabel={false} />

          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-warm-400">
              {skill.current_level >= MAX_LEVEL ? "Mastered" : getLevelTitle(skill.current_level)}
            </p>
            <div className="flex items-center gap-2">
              {lastPracticed && (
                <span className="text-xs text-warm-300">{relativeDate(lastPracticed)}</span>
              )}
              {activeQuestCount > 0 && (
                <span
                  className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                  style={{ color: skill.color, backgroundColor: skill.color + "18" }}
                >
                  {activeQuestCount} active
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* ··· pause menu — hover only, outside the nav button */}
      {onPause && (
        <div
          ref={menuRef}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="w-6 h-6 flex items-center justify-center text-warm-300 hover:text-warm-600 text-xs rounded transition-colors"
          >
            ···
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 bg-white dark:bg-warm-200 border border-warm-200 rounded-lg shadow-sm py-1 z-10 min-w-[110px]">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onPause(skill.id); }}
                className="w-full text-left px-3 py-1.5 text-xs text-warm-600 hover:text-warm-900 hover:bg-warm-50 dark:hover:bg-warm-100 transition-colors"
              >
                Pause skill
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
