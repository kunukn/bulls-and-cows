import { newsworthyHintKeys } from "@/features/game/hints";
import { useGameSelector } from "@/features/game/machine-context";
import { useHintsSeen } from "@/features/game/store/hintsSeen";
import { useMemo } from "react";

/* Stable, so the seen-hints selector doesn't hand back a new array each call. */
const NOTHING_SEEN: readonly string[] = [];

/**
 * Whether the current game has a newsworthy hint the player hasn't opened
 * yet: drives the dot on the shield bull. Always false when `isEnabled` is.
 */
export function useHasNewHint(isEnabled: boolean): boolean {
  const difficulty = useGameSelector((snapshot) => snapshot.context.difficulty);
  const guesses = useGameSelector((snapshot) => snapshot.context.guesses);
  const startedAt = useGameSelector((snapshot) => snapshot.context.startedAt);
  // Deducing takes up to ~20 ms on Hard; redo it only when a guess is scored.
  const hintKeys = useMemo(
    () => (isEnabled ? newsworthyHintKeys(difficulty, guesses) : []),
    [isEnabled, difficulty, guesses],
  );
  const seen = useHintsSeen((state) =>
    state.gameId === startedAt ? state.keys : NOTHING_SEEN,
  );

  return hintKeys.some((key) => !seen.includes(key));
}
