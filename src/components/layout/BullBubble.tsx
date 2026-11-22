import { paths } from "@/app/paths";
import { BullIcon } from "@/components/icons/BullIcon";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { pickBullLine, type BullLine } from "@/features/game/bullLines";
import { newsworthyHintKeys } from "@/features/game/hints";
import type { Color } from "@/features/game/logic";
import { useGameActorRef } from "@/features/game/machine-context";
import { useHintsSeen } from "@/features/game/store/hintsSeen";
import { useSettings } from "@/features/game/store/settings";
import { cn } from "@/utils/cn";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMatch } from "react-router";

type Props =
  /* The brand bull beside the title. */
  | { variant: "header" }
  /*
   * A see-through button over the bull moulded into the code shield, which
   * draws the bull and its dot itself (it is aria-hidden and ignores clicks).
   */
  | { variant: "shield"; hasNewHint: boolean };

type Placement = {
  side: "top" | "right" | "bottom" | "left";
  align: "start" | "center" | "end";
};

const HEADER_PLACEMENT: Placement = { side: "bottom", align: "start" };

/* Bubble max width (18rem, as in its class) + sideOffset + collisionPadding. */
const SIDE_ROOM_PX = 288 + 8 + 16;

/*
 * The shield bubble must never cover the clue rows below it, which the player
 * needs to follow the hint. Beside the board (outwards: right, or left in
 * RTL) when the viewport has room, else above the shield. Chosen here, not
 * by Radix: its collision flip would swap right for left, onto the board.
 */
function shieldPlacement(trigger: HTMLElement): Placement {
  const rect = trigger.getBoundingClientRect();
  const isRtl = document.documentElement.dir === "rtl";
  const room = isRtl ? rect.left : window.innerWidth - rect.right;

  if (room < SIDE_ROOM_PX) return { side: "top", align: "end" };

  return { side: isRtl ? "left" : "right", align: "center" };
}

/*
 * Tyr, the bull, as a speech bubble (decision 0011). Each click says
 * something new; mid-game that's a fact from the player's own clues. Esc or a
 * click outside closes it.
 */
export function BullBubble(props: Props) {
  const { t } = useTranslation();
  const actor = useGameActorRef();
  const isPlayPage = useMatch({ path: paths.play, end: true }) !== null;
  const isHintsEnabled = useSettings((state) => state.isHintsEnabled);
  const markSeen = useHintsSeen((state) => state.markSeen);
  const [isOpen, setIsOpen] = useState(false);
  const [line, setLine] = useState<BullLine | null>(null);
  const [placement, setPlacement] = useState(HEADER_PLACEMENT);
  const isShield = props.variant === "shield";

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    // Radix would close an open bubble; here a click asks for a new line.
    event.preventDefault();
    // Read at click time: the bubble doesn't need to re-render on every peg.
    const snapshot = actor.getSnapshot();
    const { difficulty, guesses, current, startedAt } = snapshot.context;
    const status = snapshot.value;
    setLine(
      pickBullLine(
        { isPlayPage, status, difficulty, guesses, current, isHintsEnabled },
        line,
      ),
    );
    // Measured per click, so a resized or rotated window gets a fresh choice.
    if (isShield) setPlacement(shieldPlacement(event.currentTarget));
    setIsOpen(true);
    // Asking Tyr, from either bull, counts as having seen what there is.
    if (isPlayPage && status === "playing" && isHintsEnabled) {
      markSeen(startedAt, newsworthyHintKeys(difficulty, guesses));
    }
  }

  const label = isShield
    ? t(props.hasNewHint ? "bull.hintButtonNew" : "bull.hintButton")
    : t("bull.button");

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          onClick={handleClick}
          className={cn(
            "shrink-0 cursor-pointer rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            isShield
              ? "size-full hover:bg-white/10"
              : "text-subtle hover:text-foreground",
          )}
        >
          {!isShield && <BullIcon className="size-7" />}
        </button>
      </PopoverTrigger>
      {/*
       * Focus stays on the bull so Enter or Space asks again. The bubble is
       * mounted fresh on open, too late for its own live region, so the
       * always-mounted one below announces each line.
       */}
      <span aria-live="polite" className="sr-only">
        {isOpen && line && <BullLineText line={line} />}
      </span>
      <PopoverContent
        side={placement.side}
        align={placement.align}
        sideOffset={8}
        collisionPadding={16}
        aria-label={t("bull.says")}
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="w-auto max-w-[min(18rem,calc(100vw-2rem))] px-3 py-2 text-pretty"
      >
        {line && (
          <p>
            <BullLineText line={line} />
          </p>
        )}
        <PopoverArrow width={14} height={7} />
      </PopoverContent>
    </Popover>
  );
}

function BullLineText({ line }: { line: BullLine }) {
  const { t } = useTranslation();
  const colorName = (color: Color) => t(`colors.${color}`);

  if (line.kind === "static") return t(line.key);

  if (line.kind === "noClues") return t("bull.noClues");

  const { hint } = line;
  switch (hint.kind) {
    case "absent":
      return t("bull.hints.absent", { color: colorName(hint.color) });

    case "present":
      return t("bull.hints.present", { colors: hint.colors.map(colorName) });

    case "slotIs":
      return t("bull.hints.slotIs", {
        slot: hint.slot,
        color: colorName(hint.color),
      });

    case "slotIsNot":
      return t("bull.hints.slotIsNot", {
        slot: hint.slot,
        color: colorName(hint.color),
      });

    case "noRepeats":
      return t("bull.hints.noRepeats");

    case "rowHasAbsent":
      return t("bull.hints.rowHasAbsent", { color: colorName(hint.color) });

    case "codesLeft":
      return t("bull.hints.codesLeft", { count: hint.count });

    case "oneLeft":
      return t("bull.hints.oneLeft");
  }
}
