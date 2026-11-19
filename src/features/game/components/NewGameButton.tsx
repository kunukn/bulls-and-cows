import { useSettings } from "@/features/game/store/settings";
import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { INFO_ROW_BUTTON_CLASS } from "./GiveUpButton";

type NewGameButtonProps = {
  onClick: () => void;
};

/*
 * Restarts at the current difficulty without revealing the code. The caller
 * owns the abandon dialog, shared with switching difficulty mid-game.
 */
export function NewGameButton({ onClick }: NewGameButtonProps) {
  const { t } = useTranslation();
  const isMinimalText = useSettings((state) => state.isMinimalText);

  return (
    <button
      type="button"
      onClick={onClick}
      title={isMinimalText ? t("result.newGame") : undefined}
      className={INFO_ROW_BUTTON_CLASS}
    >
      <RotateCcw className="size-3.5" />
      <span className={isMinimalText ? "sr-only" : undefined}>
        {t("result.newGame")}
      </span>
    </button>
  );
}
