import { dailyDate } from "@/features/daily/daily";
import { useSettings } from "@/features/game/store/settings";
import { formatDate } from "@/utils/format";
import { CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  number: number;
};

/* Names the day's code; sits where the practice page has its difficulties. */
export function DailyHeader({ number }: Props) {
  const { t, i18n } = useTranslation();
  const isMinimalText = useSettings((state) => state.isMinimalText);
  const title = t("daily.numbered", { number });

  return (
    <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm">
      <CalendarDays aria-hidden className="size-4 shrink-0 text-subtle" />
      <h2 className="font-semibold" title={isMinimalText ? title : undefined}>
        {isMinimalText ? (
          <>
            <span aria-hidden className="tabular-nums">
              {new Intl.NumberFormat(i18n.language).format(number)}
            </span>
            <span className="sr-only">{title}</span>
          </>
        ) : (
          title
        )}
      </h2>
      <span className="ms-auto text-xs text-muted-foreground">
        {formatDate(dailyDate(number).getTime(), i18n.language)}
      </span>
    </div>
  );
}
