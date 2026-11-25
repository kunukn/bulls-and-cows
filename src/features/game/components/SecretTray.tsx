import { BullBubble } from "@/components/layout/BullBubble";
import type { Color } from "@/features/game/logic";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import {
  FEEDBACK_COLUMN,
  NUMBER_COLUMN,
  PEGS_COLUMN,
  ROW_LAYOUT,
} from "./rowLayout";
import { Peg } from "./Peg";
import { SecretShield } from "./SecretShield";

type Props = {
  pegs: number;
  secret: readonly Color[];
  isPlaying: boolean;
  hasShieldBull: boolean;
  hasNewHint: boolean;
  isDaily: boolean;
};

/** The secret code's tray at the top of the board, under its shield. */
export function SecretTray({
  pegs,
  secret,
  isPlaying,
  hasShieldBull,
  hasNewHint,
  isDaily,
}: Props) {
  const { t } = useTranslation();

  return (
    <div
      aria-label={isPlaying ? t("game.secretHidden") : t("game.secret")}
      className={cn(
        ROW_LAYOUT,
        // group/tray: the shield's bull pad follows the Hint button's state.
        "group/tray relative mb-3 rounded-lg bg-board-tray py-2",
      )}
    >
      <span aria-hidden className={NUMBER_COLUMN} />
      <div className={PEGS_COLUMN}>
        {/* Empty holes while playing, so the code never reaches the DOM. */}
        {isPlaying
          ? Array.from({ length: pegs }, (_, index) => (
              <Peg key={index} color={null} />
            ))
          : secret.map((color, index) => (
              <span key={index} className="contents">
                <Peg color={color} />
                <span className="sr-only">{t(`colors.${color}`)}</span>
              </span>
            ))}
      </div>
      {/* Above the shield (z-10), so the moulded bull it covers is clickable. */}
      <span className={cn(FEEDBACK_COLUMN, "relative z-10 self-stretch")}>
        {hasShieldBull && (
          <BullBubble variant="shield" hasNewHint={hasNewHint} />
        )}
      </span>
      <SecretShield
        pegs={pegs}
        isOpen={!isPlaying}
        hasBull={hasShieldBull}
        hasNewHint={hasNewHint}
        isDaily={isDaily}
      />
    </div>
  );
}
