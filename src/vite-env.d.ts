/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/* Must be `interface` to merge with Vite's own ImportMetaEnv. */
interface ImportMetaEnv {
  /* Build stamp injected by vite.config.ts, e.g. `Y26-11-18_2127`. */
  readonly VITE_APP_VERSION: string;
  /* True only in builds made on Vercel (tyrko.app), set by vite.config.ts. */
  readonly VITE_IS_VERCEL_BUILD: boolean;
}
