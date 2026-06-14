import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSkillStore } from "../store/useSkillStore";
import SkillCard from "../components/skill/SkillCard";
import { getActiveQuests } from "../lib/operations";
import type { ActiveQuest } from "../types";
import { getLevelTitle } from "../lib/xpCurve";

export default function Dashboard() {
  const { skills, isLoading, loadSkills } = useSkillStore();
  const navigate = useNavigate();
  const [activeQuests, setActiveQuests] = useState<ActiveQuest[]>([]);

  useEffect(() => {
    loadSkills();
    getActiveQuests().then(setActiveQuests);
  }, [loadSkills]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-4 h-4 border border-warm-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
        <p className="font-serif text-2xl text-warm-800 mb-2">Your atlas is empty</p>
        <p className="text-warm-400 text-sm max-w-xs mb-8">
          Choose a skill from our curated library or start with a blank slate.
        </p>
        <button
          onClick={() => navigate("/skill/new")}
          className="px-6 py-2.5 bg-warm-900 hover:bg-warm-800 text-warm-50 rounded-lg text-sm font-medium transition-colors"
        >
          Add your first skill
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Active quests panel */}
      {activeQuests.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-lg font-semibold text-warm-900 mb-3">Active Quests</h2>
          <div className="space-y-1.5">
            {activeQuests.map((quest) => (
              <button
                key={quest.id}
                onClick={() => navigate(`/skill/${quest.skill_id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-warm-200 hover:border-warm-300 rounded-xl transition-colors text-left group"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: quest.skill_color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-warm-800 truncate">{quest.title}</p>
                  <p className="text-xs text-warm-400 mt-0.5">
                    Lvl {quest.level_num} {getLevelTitle(quest.level_num)} · {quest.skill_name}
                  </p>
                </div>
                <span
                  className="text-xs font-medium tabular-nums px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ color: quest.skill_color, backgroundColor: quest.skill_color + "18" }}
                >
                  +{quest.xp_reward} XP
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-warm-900">Your Skills</h1>
          <p className="text-sm text-warm-400 mt-0.5">{skills.length} skill{skills.length !== 1 ? "s" : ""} in progress</p>
        </div>
        <button
          onClick={() => navigate("/skill/new")}
          className="px-4 py-2 bg-warm-900 hover:bg-warm-800 text-warm-50 rounded-lg text-sm font-medium transition-colors"
        >
          + Add Skill
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {skills.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
    </div>
  );
}
