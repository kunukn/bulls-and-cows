import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./app/App";
import { i18nReady } from "./i18n";
import "./index.css";

/*
 * The first render waits for the player's language, so it never paints in
 * English by mistake. Until then index.html's spinner fills #root; rendering
 * replaces it.
 */
void i18nReady.then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});

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
 * Speed Insights samples 1 page view in 20: Hobby includes 10,000 data points
 * per 30 days, which a few hundred visitors a day would use up.
 */
if (import.meta.env.VITE_IS_VERCEL_BUILD) {
  void import("@vercel/analytics").then(({ inject }) => inject());
  void import("@vercel/speed-insights").then(({ injectSpeedInsights }) =>
    injectSpeedInsights({ sampleRate: 0.05 }),
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
