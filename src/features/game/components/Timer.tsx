import { useGameSelector } from "@/features/game/machine-context";
import { cn } from "@/utils/cn";
import { formatDuration } from "@/utils/format";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  className?: string;
};

export function Timer({ className }: Props) {
  const { t } = useTranslation();
  const startedAt = useGameSelector((snapshot) => snapshot.context.startedAt);
  const finishedAt = useGameSelector((snapshot) => snapshot.context.finishedAt);
  const [now, setNow] = useState(() => Date.now());
  const isRunning = startedAt > 0 && finishedAt === 0;

  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => setNow(Date.now()), 250);

    return () => clearInterval(id);
  }, [isRunning]);

  const elapsed = startedAt === 0 ? 0 : (finishedAt || now) - startedAt;

  return (
    <span
      className={cn("font-mono text-sm text-subtle tabular-nums", className)}
    >
      <span className="sr-only">{t("game.time")} </span>
      {formatDuration(Math.max(0, elapsed))}
    </span>
  );
}
