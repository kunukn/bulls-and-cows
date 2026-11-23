/* Typed path constants — avoid magic-string drift across navigate() call sites. */
export const paths = {
  play: "/",
  daily: "/daily",
  highScores: "/highscores",
  // Unlinked developer pages; /debug lists the rest.
  debug: "/debug",
  debugBullLines: "/debug/bull-lines",
  debugShare: "/debug/share",
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];
