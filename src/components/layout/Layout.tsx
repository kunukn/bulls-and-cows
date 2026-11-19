import { paths } from "@/app/paths";
import { BullIcon } from "@/components/icons/BullIcon";
import { useSettings } from "@/features/game/store/settings";
import { cn } from "@/utils/cn";
import { HowItWorksPopover } from "./HowItWorksPopover";
import { SettingsSheet } from "./SettingsSheet";
import { Gamepad2, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useMatch } from "react-router";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
    isActive
      ? "bg-slate-700 text-white"
      : "text-slate-300 hover:bg-slate-800 hover:text-white",
  );

export function Layout() {
  const { t } = useTranslation();
  const isMinimalText = useSettings((state) => state.isMinimalText);
  // The rules only help while playing, not on the high scores page.
  const isPlayPage = useMatch({ path: paths.play, end: true }) !== null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4">
      <header className="flex items-center justify-between gap-2 py-4">
        <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight whitespace-nowrap">
          <BullIcon className="size-7 shrink-0" />
          {isMinimalText ? (
            <span className="sr-only">{t("app.title")}</span>
          ) : (
            <>
              {/* Below 360px the full name and four header icons don't fit. */}
              <span className="max-[360px]:sr-only">{t("app.title")}</span>
              <span aria-hidden className="min-[360px]:hidden">
                {t("app.shortTitle")}
              </span>
            </>
          )}
        </h1>
        <div className="flex items-center gap-1">
          {isPlayPage && <HowItWorksPopover />}
          <nav className="flex gap-1">
            {/* Icon-only: the layout is 448px max, too narrow for every language's
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
      <main className="flex flex-1 flex-col pb-8">
        <Outlet />
      </main>
    </div>
  );
}
