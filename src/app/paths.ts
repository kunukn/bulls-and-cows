/* Typed path constants — avoid magic-string drift across navigate() call sites. */
export const paths = {
  play: "/",
  highScores: "/highscores",
  // Unlinked developer page: every line the bull can say.
  debugBullLines: "/debug/bull-lines",
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];
