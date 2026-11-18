import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LanguageSelect } from "@/i18n/LanguageSelect";
import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

/*
 * App settings in a side drawer (shadcn Sheet), modelled on
 * singing-experience's SettingsPanel: one stacked section per setting, so
 * future options (e.g. a sound toggle) slot in below Language.
 */
export function SettingsSheet() {
  const { t } = useTranslation();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={t("common.settings")}
          title={t("common.settings")}
          className="text-slate-300 hover:text-white"
        >
          <Settings className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        closeLabel={t("common.close")}
        className="w-80 border-border"
      >
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">
            {t("common.settings")}
          </SheetTitle>
          {/* Radix wants a description for the dialog; hidden visually. */}
          <SheetDescription className="sr-only">
            {t("common.settings")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="settings-language" className="font-medium">
              {t("common.language")}
            </label>
            <LanguageSelect id="settings-language" />
          </div>
        </div>

        <SheetFooter className="items-end">
          <p className="text-xs leading-none text-muted-foreground">
            {t("common.version")}: {import.meta.env.VITE_APP_VERSION}
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
