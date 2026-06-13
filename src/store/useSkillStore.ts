import { create } from "zustand";
import type { Skill } from "../types";
import { getAllSkills } from "../lib/operations";

interface SkillStore {
  skills: Skill[];
  isLoading: boolean;
  initialized: boolean;
  loadSkills: () => Promise<void>;
  upsertSkill: (skill: Skill) => void;
  removeSkill: (id: number) => void;
}

export const useSkillStore = create<SkillStore>((set, get) => ({
  skills: [],
  isLoading: false,
  initialized: false,

  loadSkills: async () => {
    if (get().isLoading || get().initialized) return;
    set({ isLoading: true });
    try {
      const skills = await getAllSkills();
      set({ skills, isLoading: false, initialized: true });
    } catch (err) {
      console.error("Failed to load skills:", err);
      set({ isLoading: false, initialized: true });
    }
  },

  upsertSkill: (skill) => {
    set((state) => {
      const idx = state.skills.findIndex((s) => s.id === skill.id);
      if (idx >= 0) {
        const updated = [...state.skills];
        updated[idx] = skill;
        return { skills: updated };
      }
      return { skills: [...state.skills, skill].sort((a, b) => a.name.localeCompare(b.name)) };
    });
  },

  removeSkill: (id) => {
    set((state) => ({ skills: state.skills.filter((s) => s.id !== id) }));
  },
}));
