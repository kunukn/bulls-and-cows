import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";

/*
 * The app uses hash routing (`/#/highscores`), and Web Analytics groups page
 * views by path, so every page would count as `/`. Move the hash route into
 * the path, keeping query params from both parts (e.g. `utm_*` before the
 * hash, `difficulty` inside it).
 */
export function toPathUrl(url: string): string {
  const original = new URL(url);
  if (!original.hash.startsWith("#/")) return url;

  const basePath = original.pathname.replace(/\/$/, "");
  const result = new URL(basePath + original.hash.slice(1), original.origin);
  for (const [key, value] of original.searchParams) {
    result.searchParams.append(key, value);
  }

  return result.href;
}

/* Loads Vercel Web Analytics and Speed Insights (cookieless). */
export function injectVercelInsights(): void {
  inject({ beforeSend: (event) => ({ ...event, url: toPathUrl(event.url) }) });
  injectSpeedInsights();
}
