import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BoardTheme } from "@/features/game/boardThemes";
import type { Difficulty } from "@/features/game/logic";

export const COLOR_SCHEMES = ["dark", "light"] as const;

export type ColorScheme = (typeof COLOR_SCHEMES)[number];

/* How colour pegs are told apart: hue, hue + moulded shape, or shape only (0004). */
export const PEG_STYLES = ["color", "colorShape", "shape"] as const;

export type PegStyle = (typeof PEG_STYLES)[number];

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
  /* Check the guess as soon as the last peg is placed; on by default (0008). */
  isAutoSubmit: boolean;
  setAutoSubmit: (isAutoSubmit: boolean) => void;
  /* Sound effects (pegs, checks, game end); on by default (0002). */
  isSoundEnabled: boolean;
  setSoundEnabled: (isSoundEnabled: boolean) => void;
  /* Pink bull pegs instead of black, for players who find black hard to see. */
  isPinkBull: boolean;
  setPinkBull: (isPinkBull: boolean) => void;
  pegStyle: PegStyle;
  setPegStyle: (pegStyle: PegStyle) => void;
  /* App interface only; board themes and printing ignore it (0006). */
  colorScheme: ColorScheme;
  setColorScheme: (colorScheme: ColorScheme) => void;
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
      isAutoSubmit: true,
      setAutoSubmit: (isAutoSubmit) => set({ isAutoSubmit }),
      isSoundEnabled: true,
      setSoundEnabled: (isSoundEnabled) => set({ isSoundEnabled }),
      isPinkBull: false,
      setPinkBull: (isPinkBull) => set({ isPinkBull }),
      pegStyle: "color",
      setPegStyle: (pegStyle) => set({ pegStyle }),
      colorScheme: "dark",
      setColorScheme: (colorScheme) => set({ colorScheme }),
    }),
    {
      name: "bulls-and-cows:settings",
      /*
       * v1: the Metal board ("gunmetal") was replaced by Felt (0007).
       * v2: the Shapes switch (isPegShapes) became the pegStyle choice (0004).
       */
      version: 2,
      migrate: (persistedState, version) => {
        const { isPegShapes, ...state } = persistedState as SettingsStore & {
          isPegShapes?: boolean;
        };
        const boardTheme: string = state.boardTheme;
        if (version < 1 && boardTheme === "gunmetal") {
          state.boardTheme = "felt";
        }
        if (version < 2) {
          state.pegStyle = isPegShapes ? "colorShape" : "color";
        }

        return state;
      },
    },
  ),
);

// Matches --background per scheme, for the browser toolbar.
const THEME_COLORS: Record<ColorScheme, string> = {
  dark: "#0f172a",
  light: "#f1f5f9",
};

/* Mirror the scheme onto <html> so `light-dark()` tokens in index.css follow it. */
export function applyColorScheme(colorScheme: ColorScheme) {
  document.documentElement.dataset.colorScheme = colorScheme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[colorScheme]);
}

/*
 * persist hydrates synchronously from localStorage, so this runs before the
 * first render and a returning light-mode player sees no dark flash.
 */
applyColorScheme(useSettings.getState().colorScheme);
useSettings.subscribe((state, previous) => {
  if (state.colorScheme !== previous.colorScheme) {
    applyColorScheme(state.colorScheme);
  }
});
