import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./app/App";
import "./i18n"; // Initialise translations before the first render.
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;

    /*
     * An open tab only checks for a new service worker on navigation. Poll
     * hourly so a tab left open still picks up a deploy.
     */
    setInterval(() => void registration.update(), 60 * 60 * 1000);
  },
});

/*
 * Vercel Web Analytics + Speed Insights on tyrko.app only. Elsewhere the flag
 * is the literal `false`, so the bundler drops the import entirely.
 */
if (import.meta.env.VITE_IS_VERCEL_BUILD) {
  void import("@/app/vercelInsights").then(({ injectVercelInsights }) =>
    injectVercelInsights(),
  );
}

/* Opt in with VITE_RAINBOW_DEBUG=1 (.env.local) or `?debug_rainbow=1` in the URL. */
if (
  import.meta.env.VITE_RAINBOW_DEBUG === "1" ||
  location.href.includes("debug_rainbow=1")
) {
  void import("@/debug/debugRainbow").then(({ initDebugRainbow }) =>
    initDebugRainbow(),
  );
}
