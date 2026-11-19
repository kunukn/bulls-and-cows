import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useGameActorRef } from "@/features/game/machine-context";
import { useSettings } from "@/features/game/store/settings";
import { Flag } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Quiet text button shared by the actions in the info row above the board.
export const INFO_ROW_BUTTON_CLASS =
  "-my-1.5 flex h-8 items-center whitespace-nowrap gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring";

/*
 * Lives in the info row above the board, away from Check, so a missed tap on
 * the main action can't land on it.
 */
export function GiveUpButton() {
  const { t } = useTranslation();
  const actor = useGameActorRef();
  const isMinimalText = useSettings((state) => state.isMinimalText);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title={isMinimalText ? t("game.giveUp") : undefined}
        className={INFO_ROW_BUTTON_CLASS}
      >
        <Flag className="size-3.5" />
        <span className={isMinimalText ? "sr-only" : undefined}>
          {t("game.giveUp")}
        </span>
      </button>
      <ConfirmDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title={t("game.giveUpConfirm")}
        description={t("game.giveUpDescription")}
        confirmLabel={t("game.giveUp")}
        onConfirm={() => actor.send({ type: "GIVE_UP" })}
      />
    </>
  );
}
