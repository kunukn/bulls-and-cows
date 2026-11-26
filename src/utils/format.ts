import { getIntlLocale } from "@/i18n/languages";

/* 83_400 → "1:23" */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
}

/* 15_153_000 → "4:12:33" */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
    2,
    "0",
  );
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

/* Medium date in the UI language, e.g. "18 Nov 2026" / "18. Nov. 2026". */
export function formatDate(epochMs: number, language: string): string {
  return new Intl.DateTimeFormat(getIntlLocale(language), {
    dateStyle: "medium",
  }).format(epochMs);
}
