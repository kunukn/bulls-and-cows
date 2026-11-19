import { useGameActorRef } from "@/features/game/machine-context";
import {
  loadPegSounds,
  pickPegSound,
  playPegSound,
} from "@/features/game/sound";
import { useSettings } from "@/features/game/store/settings";
import { useEffect } from "react";

/* Plays a click per placed peg while the Sound setting is on. */
export function usePegSound(): void {
  const actor = useGameActorRef();
  const isSoundEnabled = useSettings((state) => state.isSoundEnabled);

  useEffect(() => {
    if (!isSoundEnabled) return;

    loadPegSounds();
    const subscription = actor.on("pegPlaced", ({ rowNumber, slot, color }) =>
      playPegSound(pickPegSound(rowNumber, slot, color)),
    );

    return () => subscription.unsubscribe();
  }, [actor, isSoundEnabled]);
}
