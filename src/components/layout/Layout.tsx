import { paths } from "@/app/paths";
import { useSettings } from "@/features/game/store/settings";
import { cn } from "@/utils/cn";
import { BullBubble } from "./BullBubble";
import { HowItWorksPopover } from "./HowItWorksPopover";
import { SettingsSheet } from "./SettingsSheet";
import { Gamepad2, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useMatch } from "react-router";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
    isActive
      ? "bg-secondary text-foreground"
      : "text-subtle hover:bg-card hover:text-foreground",
  );

export function Layout() {
  const { t } = useTranslation();
  const isMinimalText = useSettings((state) => state.isMinimalText);
  // The rules only help while playing, not on the high scores page.
  const isPracticePage = useMatch({ path: paths.play, end: true }) !== null;
  const isDailyPage = useMatch(paths.daily) !== null;
  const isPlayPage = isPracticePage || isDailyPage;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 desk:max-w-lg">
      <header className="flex items-center justify-between gap-2 py-4">
        {/* The bull is a button, so it sits beside the heading, not in its name. */}
        <div className="flex items-center gap-2">
          <BullBubble variant="header" />
          <h1 className="text-lg font-bold tracking-tight whitespace-nowrap text-heading">
            {isMinimalText ? (
              <span className="sr-only">{t("app.title")}</span>
            ) : (
              // Fits beside four header icons at 320px, ~12px to spare.
              <span>{t("app.title")}</span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          {isPlayPage && <HowItWorksPopover isDailyPage={isDailyPage} />}
          <nav className="flex gap-1">
            {/* Icon-only: the layout is 448px max (512px on desktop), too narrow for every language's
                labels next to the title. Text stays for screen readers + tooltip. */}
            <NavLink
              to={paths.play}
              end
              title={t("nav.play")}
              className={navLinkClass}
            >
              <Gamepad2 className="size-5 shrink-0" />
              <span className="sr-only">{t("nav.play")}</span>
            </NavLink>
            <NavLink
              to={paths.highScores}
              title={t("nav.highScores")}
              className={navLinkClass}
            >
              <Trophy className="size-5 shrink-0" />
              <span className="sr-only">{t("nav.highScores")}</span>
            </NavLink>
          </nav>
          <SettingsSheet />
        </div>
      </header>
      {/* No bottom padding: Play's sticky dock pads itself; it would show only at scroll end. */}
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
