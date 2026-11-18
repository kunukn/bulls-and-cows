import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Difficulty } from "@/features/game/logic";

type SettingsStore = {
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  /* Display only: the game clock keeps running for high scores either way. */
  isTimerVisible: boolean;
  setTimerVisible: (isTimerVisible: boolean) => void;
};

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      difficulty: "classic",
      setDifficulty: (difficulty) => set({ difficulty }),
      isTimerVisible: true,
      setTimerVisible: (isTimerVisible) => set({ isTimerVisible }),
    }),
    { name: "bulls-and-cows:settings" },
  ),
);
