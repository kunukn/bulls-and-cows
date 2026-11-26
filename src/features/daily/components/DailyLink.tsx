import { paths } from "@/app/paths";
import { dailyNumber } from "@/features/daily/daily";
import { useDailyResults } from "@/features/daily/store";
import { useSettings } from "@/features/game/store/settings";
import { getIntlLocale } from "@/i18n/languages";
import { CalendarDays, ChevronRight, CircleCheck, CircleX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

// 36px tall; the High scores heading matches it (min-h-9) to avoid a jump.
const linkClass =
  "flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm font-medium text-subtle transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring";
const endClass =
  "ms-auto flex items-center gap-1.5 text-xs font-normal text-muted-foreground";

/* The way into today's daily code from the practice page (0012). */
export function DailyLink() {
  const { t, i18n } = useTranslation();
  const isMinimalText = useSettings((state) => state.isMinimalText);
  const today = dailyNumber();
  const result = useDailyResults((state) => state.results[today]);
  const title = t("daily.numbered", { number: today });
  const StatusIcon = result?.isWon ? CircleCheck : CircleX;

  return (
    <Link
      to={paths.daily}
      title={isMinimalText ? title : undefined}
      className={linkClass}
    >
      <CalendarDays aria-hidden className="size-4 shrink-0" />
      {isMinimalText ? (
        <>
          <span aria-hidden className="tabular-nums">
            {new Intl.NumberFormat(getIntlLocale(i18n.language)).format(today)}
          </span>
          <span className="sr-only">{title}</span>
        </>
      ) : (
        title
      )}
      <span className={endClass}>
        {result ? (
          <>
            <span className={isMinimalText ? "sr-only" : undefined}>
              {t(result.isWon ? "daily.solved" : "daily.notSolved")}
            </span>
            <StatusIcon
              aria-hidden
              className={result.isWon ? "size-4 text-success" : "size-4"}
            />
          </>
        ) : (
          <ChevronRight aria-hidden className="size-4 rtl:-scale-x-100" />
        )}
      </span>
    </Link>
  );
}
