import { createActorContext } from "@xstate/react";
import { useEffect } from "react";
import { gameMachine } from "./machine";
import { loadGame, saveGame } from "./persistence";
import { useSettings } from "./store/settings";

const GameContext = createActorContext(gameMachine);

export const useGameSelector = GameContext.useSelector;
export const useGameActorRef = GameContext.useActorRef;

type Props = {
  children: React.ReactNode;
};

export function GameMachineProvider({ children }: Props) {
  // Read once at mount — the persisted difficulty seeds the first game only.
  const difficulty = useSettings.getState().difficulty;

  /*
   * A saved game survives a page refresh. The clock is wall-time based
   * (`startedAt`), so time spent away from the page still counts.
   */
  return (
    <GameContext.Provider
      options={{ input: { difficulty }, snapshot: loadGame() }}
    >
      <GamePersister />
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
