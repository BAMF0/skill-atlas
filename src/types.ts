export interface Skill {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  color: string;
  icon: string | null;
  current_level: number;
  current_xp: number;
  created_at: string;
}

export interface Level {
  id: number;
  skill_id: number;
  level_num: number;
  title: string;
  xp_required: number;
  description: string | null;
}

export interface Quest {
  id: number;
  skill_id: number;
  level_num: number;
  title: string;
  description: string | null;
  xp_reward: number;
  is_repeatable: number; // 0 | 1 from SQLite
  sort_order: number;
  created_at: string;
  is_completed?: number; // 0 | 1, derived
  completion_count?: number;
}

export interface Resource {
  id: number;
  skill_id: number | null;
  quest_id: number | null;
  title: string;
  author: string | null;
  type: "book" | "article" | "video" | "course" | "website";
  url: string | null;
  level_num: number | null;
  notes: string | null;
  created_at: string;
  skill_name?: string; // from JOIN
}

export interface XpLogEntry {
  id: number;
  skill_id: number;
  quest_id: number | null;
  amount: number;
  source: string;
  note: string | null;
  logged_at: string;
  quest_title?: string; // from JOIN
}

export interface CompleteQuestResult {
  xpGained: number;
  newTotalXp: number;
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  newLevelTitle: string;
}

// Muted, sophisticated color palette — designed for a light/cream UI
export const SKILL_COLORS = [
  "#6B8EAD", // dusty blue
  "#7B9E8B", // sage green
  "#B07878", // dusty rose
  "#B08840", // ochre
  "#8B7B9E", // slate purple
  "#A86B55", // terracotta
  "#708090", // steel
  "#8B8B5A", // olive
  "#5F8A8B", // teal
  "#8B5665", // burgundy
];

export const RESOURCE_TYPES = ["book", "article", "video", "course", "website"] as const;
