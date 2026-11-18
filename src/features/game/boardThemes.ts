/* Board looks; each maps to a `[data-board-theme]` token block in index.css. */
export const BOARD_THEMES = ["neon", "classic", "gunmetal", "wood"] as const;

export type BoardTheme = (typeof BOARD_THEMES)[number];
