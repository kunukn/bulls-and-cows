import { createActorContext } from "@xstate/react";
import { useEffect } from "react";
import { gameMachine } from "./machine";
import { loadGame, saveGame } from "./persistence";
import { useSettings } from "./store/settings";

const GameContext = createActorContext(gameMachine);

/* For a second game with its own input and save, like the daily code. */
export const GameActorProvider = GameContext.Provider;
export const useGameSelector = GameContext.useSelector;
export const useGameActorRef = GameContext.useActorRef;

type Props = {
  children: React.ReactNode;
};

export function GameMachineProvider({ children }: Props) {
  // Read once at mount — the persisted settings seed the first game only.
  const { difficulty, isSwapEnabled } = useSettings.getState();

  /*
   * A saved game survives a page refresh. The clock is wall-time based
   * (`startedAt`), so time spent away from the page still counts.
   */
  return (
    <GameContext.Provider
      options={{
        input: { difficulty, isSwapMode: isSwapEnabled },
        snapshot: loadGame(),
      }}
    >
      <GamePersister />
      <SwapModeSync />
      {children}
    </GameContext.Provider>
  );
}

function GamePersister() {
  const actorRef = useGameActorRef();

  useEffect(() => {
    const subscription = actorRef.subscribe(saveGame);

    return () => subscription.unsubscribe();
  }, [actorRef]);

  return null;
}

/*
 * The swap switch also changes the game on screen until its first guess is
 * checked; the machine ignores it after that, and in a daily game (0013).
 */
function SwapModeSync() {
  const actorRef = useGameActorRef();

  useEffect(
    () =>
      useSettings.subscribe((state, previous) => {
        if (state.isSwapEnabled === previous.isSwapEnabled) return;

        actorRef.send({
          type: "SET_SWAP_MODE",
          isSwapMode: state.isSwapEnabled,
        });
      }),
    [actorRef],
  );

  return null;
}
