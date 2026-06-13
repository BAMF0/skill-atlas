import { getLevelTitle, MAX_LEVEL } from "../../lib/xpCurve";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md";
}

export default function LevelBadge({ level, size = "md" }: LevelBadgeProps) {
  const title = getLevelTitle(level);
  const isMax = level >= MAX_LEVEL;

  if (size === "sm") {
    return (
      <span className="text-xs text-warm-400 tabular-nums">
        Lv.{level}{isMax && " ✦"}
      </span>
    );
  }

  return (
    <span className="text-sm text-warm-500">
      Lv.{level} · {title}{isMax && " ✦"}
    </span>
  );
}
