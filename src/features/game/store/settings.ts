import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Difficulty } from "@/features/game/logic";

type SettingsStore = {
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
};

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      difficulty: "classic",
      setDifficulty: (difficulty) => set({ difficulty }),
    }),
    { name: "bulls-and-cows:settings" },
  ),
);
