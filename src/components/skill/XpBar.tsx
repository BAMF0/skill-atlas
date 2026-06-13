import { useEffect, useState } from "react";
import { levelProgressPct, xpInCurrentLevel, xpForCurrentLevel } from "../../lib/xpCurve";

interface XpBarProps {
  currentXp: number;
  color: string;
  showLabel?: boolean;
}

export default function XpBar({ currentXp, color, showLabel = false }: XpBarProps) {
  const [displayedPct, setDisplayedPct] = useState(0);

  const targetPct = levelProgressPct(currentXp);
  const inLevel = xpInCurrentLevel(currentXp);
  const forLevel = xpForCurrentLevel(currentXp);
  const isMaxed = forLevel === 0;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setDisplayedPct(targetPct));
    return () => cancelAnimationFrame(raf);
  }, [targetPct]);

  return (
    <div className="w-full">
      <div className="w-full h-0.5 bg-warm-200 rounded-full overflow-hidden">
        <div
          className="xp-bar-fill h-full rounded-full"
          style={{ width: `${displayedPct}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1.5">
          {isMaxed ? (
            <span className="text-xs text-warm-500 font-medium">Max level</span>
          ) : (
            <>
              <span className="text-xs text-warm-400">
                {inLevel.toLocaleString()} / {forLevel.toLocaleString()} XP
              </span>
              <span className="text-xs text-warm-400">{Math.round(displayedPct)}%</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
