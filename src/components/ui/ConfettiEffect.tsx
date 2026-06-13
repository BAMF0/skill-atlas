import { useEffect } from "react";
import confetti from "canvas-confetti";

interface ConfettiEffectProps {
  trigger: boolean;
}

export default function ConfettiEffect({ trigger }: ConfettiEffectProps) {
  useEffect(() => {
    if (!trigger) return;
    confetti({
      particleCount: 140,
      spread: 90,
      origin: { y: 0.6 },
      colors: ["#6366f1", "#a855f7", "#ec4899", "#f97316", "#22c55e", "#f59e0b"],
    });
  }, [trigger]);

  return null;
}
