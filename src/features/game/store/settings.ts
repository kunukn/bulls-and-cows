import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BoardTheme } from "@/features/game/boardThemes";
import type { Difficulty } from "@/features/game/logic";

type SettingsStore = {
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  boardTheme: BoardTheme;
  setBoardTheme: (boardTheme: BoardTheme) => void;
  /* Display only: the game clock keeps running for high scores either way. */
  isTimerVisible: boolean;
  setTimerVisible: (isTimerVisible: boolean) => void;
  /* Icons instead of words; hidden text stays in aria-label / title. */
  isMinimalText: boolean;
  setMinimalText: (isMinimalText: boolean) => void;
  /* Check the guess as soon as the last peg is placed. */
  isAutoSubmit: boolean;
  setAutoSubmit: (isAutoSubmit: boolean) => void;
  /* Peg placement clicks; off by default. */
  isSoundEnabled: boolean;
  setSoundEnabled: (isSoundEnabled: boolean) => void;
};

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      difficulty: "classic",
      setDifficulty: (difficulty) => set({ difficulty }),
      boardTheme: "neon",
      setBoardTheme: (boardTheme) => set({ boardTheme }),
      // Off for first-time visitors; a saved choice still wins on rehydrate.
      isTimerVisible: false,
      setTimerVisible: (isTimerVisible) => set({ isTimerVisible }),
      isMinimalText: false,
      setMinimalText: (isMinimalText) => set({ isMinimalText }),
      isAutoSubmit: false,
      setAutoSubmit: (isAutoSubmit) => set({ isAutoSubmit }),
      isSoundEnabled: false,
      setSoundEnabled: (isSoundEnabled) => set({ isSoundEnabled }),
    }),
    { name: "bulls-and-cows:settings" },
  ),
);
