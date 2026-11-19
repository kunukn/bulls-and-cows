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
  /* Sound effects (pegs, checks, game end); on by default (0006). */
  isSoundEnabled: boolean;
  setSoundEnabled: (isSoundEnabled: boolean) => void;
  /* Pink bull pegs instead of black, for players who find black hard to see. */
  isPinkBull: boolean;
  setPinkBull: (isPinkBull: boolean) => void;
  /* A shape on each colour peg, for players who find colours hard to tell apart. */
  isPegShapes: boolean;
  setPegShapes: (isPegShapes: boolean) => void;
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
      isSoundEnabled: true,
      setSoundEnabled: (isSoundEnabled) => set({ isSoundEnabled }),
      isPinkBull: false,
      setPinkBull: (isPinkBull) => set({ isPinkBull }),
      isPegShapes: false,
      setPegShapes: (isPegShapes) => set({ isPegShapes }),
    }),
    { name: "bulls-and-cows:settings" },
  ),
);
