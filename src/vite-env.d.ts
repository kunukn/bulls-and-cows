/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/* Must be `interface` to merge with Vite's own ImportMetaEnv. */
interface ImportMetaEnv {
  /* Build stamp injected by vite.config.ts, e.g. `Y26-11-18_2127`. */
  readonly VITE_APP_VERSION: string;
  /* True only in builds made on Vercel (tyrko.app), set by vite.config.ts. */
  readonly VITE_IS_VERCEL_BUILD: boolean;
  /* "1" = history routing, "0" = hash routing (GitHub Pages); see vite.config.ts. */
  readonly VITE_USE_HISTORY_ROUTING: "0" | "1";
  /* Mirror builds only: the main site's daily page, e.g. https://www.tyrko.app/daily. */
  readonly VITE_DAILY_URL?: string;
}
