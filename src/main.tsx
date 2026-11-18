import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./i18n"; // Initialise translations before the first render.
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/* Opt in with VITE_RAINBOW_DEBUG=1 (.env.local) or `?debug_rainbow=1` in the URL. */
if (
  import.meta.env.VITE_RAINBOW_DEBUG === "1" ||
  location.href.includes("debug_rainbow=1")
) {
  void import("@/debug/debugRainbow").then(({ initDebugRainbow }) =>
    initDebugRainbow(),
  );
}
