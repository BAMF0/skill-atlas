export const MAX_LEVEL = 10;

export const LEVEL_TITLES = [
  "",
  "Novice",
  "Beginner",
  "Apprentice",
  "Intermediate",
  "Competent",
  "Proficient",
  "Advanced",
  "Expert",
  "Master",
  "Grandmaster",
];

// XP needed to go from level n to level n+1
export function xpPerLevel(n: number): number {
  return Math.floor(100 * Math.pow(1.5, n - 1));
}

// Cumulative XP required to reach level `level` from zero
export function xpToReachLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpPerLevel(i);
  }
  return total;
}

// What level a skill is at given its total cumulative XP
export function levelForXp(xp: number): number {
  for (let l = MAX_LEVEL; l >= 2; l--) {
    if (xp >= xpToReachLevel(l)) return l;
  }
  return 1;
}

// XP earned within the current level (resets each level)
export function xpInCurrentLevel(xp: number): number {
  const level = levelForXp(xp);
  return xp - xpToReachLevel(level);
}

// XP needed to complete the current level
export function xpForCurrentLevel(xp: number): number {
  const level = levelForXp(xp);
  if (level >= MAX_LEVEL) return 0;
  return xpPerLevel(level);
}

// Progress percentage (0–100) through the current level
export function levelProgressPct(xp: number): number {
  const level = levelForXp(xp);
  if (level >= MAX_LEVEL) return 100;
  const levelXp = xpForCurrentLevel(xp);
  if (levelXp === 0) return 100;
  return Math.min(100, (xpInCurrentLevel(xp) / levelXp) * 100);
}

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, MAX_LEVEL)] ?? "Grandmaster";
}

// Pre-computed thresholds for display (level -> cumulative XP required)
export function getLevelThresholds(): { level: number; title: string; xp: number }[] {
  return Array.from({ length: MAX_LEVEL }, (_, i) => ({
    level: i + 1,
    title: LEVEL_TITLES[i + 1],
    xp: xpToReachLevel(i + 1),
  }));
}
