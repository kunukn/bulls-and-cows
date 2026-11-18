/* Typed path constants — avoid magic-string drift across navigate() call sites. */
export const paths = {
  play: "/",
  highScores: "/highscores",
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];
