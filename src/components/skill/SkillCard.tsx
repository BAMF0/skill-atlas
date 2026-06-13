import { useNavigate } from "react-router-dom";
import type { Skill } from "../../types";
import XpBar from "./XpBar";
import LevelBadge from "./LevelBadge";
import { getLevelTitle, MAX_LEVEL } from "../../lib/xpCurve";

interface SkillCardProps {
  skill: Skill;
}

export default function SkillCard({ skill }: SkillCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/skill/${skill.id}`)}
      className="w-full text-left bg-white border border-warm-200 hover:border-warm-300 hover:shadow-sm rounded-xl p-4 transition-all group flex gap-3"
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

        <p className="text-xs text-warm-400 mt-2">
          {skill.current_level >= MAX_LEVEL
            ? "Mastered"
            : getLevelTitle(skill.current_level)}
        </p>
      </div>
    </button>
  );
}
