/// <reference types="vite/client" />

/* Must be `interface` to merge with Vite's own ImportMetaEnv. */
interface ImportMetaEnv {
  /* Build stamp injected by vite.config.ts, e.g. `Y26-11-18_2127`. */
  readonly VITE_APP_VERSION: string;
}
