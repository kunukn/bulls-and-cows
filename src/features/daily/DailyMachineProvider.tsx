import {
  GameActorProvider,
  useGameActorRef,
} from "@/features/game/machine-context";
import { useEffect, useState } from "react";
import { dailyGameInput, dailyNumber, nextDailyEvent } from "./daily";
import { loadDailyGame, recordDailyResult, saveDailyGame } from "./persistence";

type Props = {
  children: React.ReactNode;
};

/*
 * Runs the daily code as a second game beside the practice one: the same
 * machine, dealt from the date, with its own save. Components inside read
 * this game through the usual game hooks.
 */
export function DailyMachineProvider({ children }: Props) {
  // Read once at mount; a later day arrives through NEXT_DAILY.
  const [today] = useState(() => dailyNumber());

  return (
    <GameActorProvider
      options={{
        input: dailyGameInput(today),
        snapshot: loadDailyGame(today),
      }}
    >
      <DailySync />
      {children}
    </GameActorProvider>
  );
}

function DailySync() {
  const actorRef = useGameActorRef();

  useEffect(() => {
    const subscription = actorRef.subscribe((snapshot) => {
      saveDailyGame(snapshot);
      recordDailyResult(snapshot);
    });

    /*
     * An installed app is resumed, not reloaded, so yesterday's finished
     * board would still be showing. The machine ignores this for a game
     * under way and when the day hasn't changed.
     */
    function startTodayWhenVisible() {
      if (document.visibilityState !== "visible") return;

      actorRef.send(nextDailyEvent(dailyNumber()));
    }

    document.addEventListener("visibilitychange", startTodayWhenVisible);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", startTodayWhenVisible);
    };
  }, [actorRef]);

  return null;
}
