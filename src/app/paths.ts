/* Typed path constants — avoid magic-string drift across navigate() call sites. */
export const paths = {
  play: "/",
  daily: "/daily",
  highScores: "/highscores",
  /*
   * Unlinked developer pages; /_debug lists the rest. A leading "/_" marks
   * a private page: it is left out of sitemap.xml.
   */
  debug: "/_debug",
  debugBullLines: "/_debug/bull-lines",
  debugShare: "/_debug/share",
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];
