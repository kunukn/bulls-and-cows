import { paths } from "@/app/paths";
import {
  DAILY_DIFFICULTY,
  dailyDate,
  dailyNumber,
} from "@/features/daily/daily";
import { summarize, useDailyResults } from "@/features/daily/store";
import { DIFFICULTIES } from "@/features/game/logic";
import { useSettings } from "@/features/game/store/settings";
import { formatDate } from "@/utils/format";
import { ArrowLeft, CalendarDays, Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

type Props = {
  number: number;
};

/*
 * Names the day's code where the practice page has its difficulties, at the
 * picker's height so the board doesn't jump. The rules, streak and a way back
 * set it apart from the practice page (0012).
 */
export function DailyHeader({ number }: Props) {
  const { t, i18n } = useTranslation();
  const isMinimalText = useSettings((state) => state.isMinimalText);
  const results = useDailyResults((state) => state.results);
  const { currentStreak } = summarize(results, dailyNumber());
  const { pegs, colors } = DIFFICULTIES[DAILY_DIFFICULTY];
  const numberFormat = new Intl.NumberFormat(i18n.language);
  const title = t("daily.numbered", { number });
  const date = formatDate(dailyDate(number).getTime(), i18n.language);
  const practiceLabel = t("daily.backToPractice");

  return (
    <header className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 rounded-lg bg-card px-3 py-2.5 ring-1 ring-border">
      <CalendarDays aria-hidden className="row-span-2 size-5" />
      <h2
        className="text-sm leading-5 font-semibold"
        title={isMinimalText ? title : undefined}
      >
        {isMinimalText ? (
          <>
            <span aria-hidden className="tabular-nums">
              {numberFormat.format(number)}
            </span>
            <span className="sr-only">{title}</span>
          </>
        ) : (
          title
        )}
      </h2>
      <div className="flex items-center gap-3 text-xs">
        {currentStreak > 0 && (
          <span
            title={t("daily.streak")}
            className="flex items-center gap-1 font-semibold tabular-nums"
          >
            <Flame aria-hidden className="size-4" />
            <span className="sr-only">{t("daily.streak")}</span>
            {numberFormat.format(currentStreak)}
          </span>
        )}
        <Link
          to={paths.play}
          title={isMinimalText ? practiceLabel : undefined}
          className="flex items-center gap-1 rounded-sm font-medium text-subtle transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ArrowLeft aria-hidden className="size-4 rtl:-scale-x-100" />
          <span className={isMinimalText ? "sr-only" : undefined}>
            {practiceLabel}
          </span>
        </Link>
      </div>
      <p className="col-span-2 flex flex-wrap items-center gap-x-1.5 text-xs leading-4 text-muted-foreground">
        <span>{date}</span>
        {!isMinimalText && (
          <>
            <span aria-hidden>·</span>
            <span>{t("difficulty.details", { pegs, colors })}</span>
            <span aria-hidden>·</span>
            <span className="font-medium text-foreground">
              {t("daily.oneTry")}
            </span>
          </>
        )}
      </p>
    </header>
  );
}
