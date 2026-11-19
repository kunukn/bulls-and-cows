import { useGameActorRef } from "@/features/game/machine-context";
import {
  LOSE_CLIP,
  loadSounds,
  pickFeedbackTicks,
  pickPegRemovedSound,
  pickPegSound,
  playClip,
  SHIELD_CLIP,
  THUD_CLIP,
  WIN_CLIP,
} from "@/features/game/sound";
import { useSettings } from "@/features/game/store/settings";
import { useEffect } from "react";

/* SecretShield's `duration-500` lift; the clack lands when it stands upright. */
const SHIELD_OPEN_MS = 500;
/* Gap between the shield's clack and the jingle, so they don't blur. */
const JINGLE_GAP_MS = 150;

/* Plays the game's sound effects while the Sound effects setting is on. */
export function useGameSounds(): void {
  const actor = useGameActorRef();
  const isSoundEnabled = useSettings((state) => state.isSoundEnabled);

  useEffect(() => {
    if (!isSoundEnabled) return;

    loadSounds();
    const subscriptions = [
      actor.on("pegPlaced", ({ rowNumber, slot, color }) =>
        playClip(pickPegSound(rowNumber, slot, color)),
      ),
      actor.on("pegRemoved", ({ rowNumber, slot, color }) =>
        playClip(pickPegRemovedSound(rowNumber, slot, color)),
      ),
      actor.on("rowIncomplete", () => playClip({ clip: THUD_CLIP, gain: 0.9 })),
      actor.on("scored", ({ black, white }) => {
        for (const tick of pickFeedbackTicks(black, white)) playClip(tick);
      }),
      actor.on("gameOver", ({ isWon }) => {
        // Reduced motion opens the shield at once, so its clack comes at once.
        const shieldMs = window.matchMedia("(prefers-reduced-motion: reduce)")
          .matches
          ? 0
          : SHIELD_OPEN_MS;
        playClip({ clip: SHIELD_CLIP, gain: 0.7, delayMs: shieldMs });
        playClip({
          clip: isWon ? WIN_CLIP : LOSE_CLIP,
          gain: 0.8,
          delayMs: shieldMs + JINGLE_GAP_MS,
        });
      }),
    ];

    return () => {
      for (const subscription of subscriptions) subscription.unsubscribe();
    };
  }, [actor, isSoundEnabled]);
}
