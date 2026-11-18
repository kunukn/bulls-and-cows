/* 83_400 → "1:23" */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
}

/* Medium date in the UI language, e.g. "18 Nov 2026" / "18. Nov. 2026". */
export function formatDate(epochMs: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    epochMs,
  );
}
