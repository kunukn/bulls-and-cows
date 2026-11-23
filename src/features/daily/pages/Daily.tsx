import { DailyMachineProvider } from "@/features/daily/DailyMachineProvider";
import { Play } from "@/features/game/pages/Play";

/* The play page, run on the daily code's own game (0012). */
export function Daily() {
  return (
    <DailyMachineProvider>
      <Play />
    </DailyMachineProvider>
  );
}
