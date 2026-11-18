import { useGameSelector } from "@/features/game/machine-context";
import { formatDuration } from "@/utils/format";
import { useEffect, useState } from "react";

export function Timer() {
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
    <span className="font-mono text-sm text-slate-300 tabular-nums">
      <span className="sr-only">Time </span>
      {formatDuration(Math.max(0, elapsed))}
    </span>
  );
}
