import { paths } from "@/app/paths";
import { BullIcon } from "@/components/icons/BullIcon";
import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  pickChatLine,
  pickHintLine,
  type BullLine,
} from "@/features/game/bullLines";
import { newsworthyHintKeys } from "@/features/game/hints";
import type { Color } from "@/features/game/logic";
import {
  useGameActorRef,
  useGameSelector,
} from "@/features/game/machine-context";
import { useHintsSeen } from "@/features/game/store/hintsSeen";
import { cn } from "@/utils/cn";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMatch } from "react-router";

type Props =
  /* The brand bull beside the title: it chats, and never gives hints. */
  | { variant: "header" }
  /*
   * The hint bull: a see-through button over the bull moulded into the code
   * shield, which draws the bull and its dot itself (it is aria-hidden and
   * ignores clicks). Board only renders it while a game is in play.
   */
  | { variant: "shield"; hasNewHint: boolean };

type Placement = {
  side: "top" | "right" | "bottom" | "left";
  align: "start" | "center" | "end";
};

const HEADER_PLACEMENT: Placement = { side: "bottom", align: "start" };

const ARROW_WIDTH = 14;
const ARROW_HEIGHT = 7;

// Gap to the anchor; beside the board the bubble's arrow meets the shield's edge.
const SIDE_OFFSET = 8;
const BESIDE_SIDE_OFFSET = 0;

/*
 * Bubble max width (18rem, as in its class) + sideOffset + arrow +
 * collisionPadding. Radix adds the arrow height to sideOffset, so leaving it
 * out lets its flip move a "right" bubble onto the board.
 */
const SIDE_ROOM_PX = 288 + BESIDE_SIDE_OFFSET + ARROW_HEIGHT + 16;

/*
 * The shield bubble must never cover the clue rows below it, which the player
 * needs to follow the hint. Beside the board (outwards: right, or left in
 * RTL) when the viewport has room, else above the shield. Chosen here, not
 * by Radix: its collision flip would swap right for left, onto the board.
 */
function shieldPlacement(trigger: HTMLElement): Placement {
  const rect = trigger.getBoundingClientRect();
  const isRtl = document.documentElement.dir === "rtl";
  // clientWidth, not innerWidth: a classic scrollbar isn't room, as Radix sees it.
  const viewportWidth = document.documentElement.clientWidth;
  const room = isRtl ? rect.left : viewportWidth - rect.right;

  if (room < SIDE_ROOM_PX) return { side: "top", align: "end" };

  return { side: isRtl ? "left" : "right", align: "center" };
}

/*
 * Tyr, the bull, as a speech bubble (decision 0011). Each click says
 * something new: small talk from the header bull, help with the game in play
 * from the shield bull. Esc or a click outside closes it.
 */
export function BullBubble(props: Props) {
  const { t } = useTranslation();
  const actor = useGameActorRef();
  const isPlayPage = useMatch({ path: paths.play, end: true }) !== null;
  const markSeen = useHintsSeen((state) => state.markSeen);
  const [isOpen, setIsOpen] = useState(false);
  const [line, setLine] = useState<BullLine | null>(null);
  const [placement, setPlacement] = useState(HEADER_PLACEMENT);
  const isShield = props.variant === "shield";

  /*
   * A line is about the game it was asked in, so a new game closes the
   * bubble. Only a new game replaces the secret array, which makes its
   * reference the game's identity (startedAt is 0 until the first peg). The
   * secret itself is never read here.
   */
  const secret = useGameSelector((snapshot) => snapshot.context.secret);
  const [lineGame, setLineGame] = useState(secret);
  if (lineGame !== secret) {
    setLineGame(secret);
    setIsOpen(false);
  }

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    // Radix would close an open bubble; here a click asks for a new line.
    event.preventDefault();
    // Read at click time: the bubble doesn't need to re-render on every peg.
    const snapshot = actor.getSnapshot();
    const { difficulty, guesses, current, startedAt } = snapshot.context;
    setIsOpen(true);

    if (!isShield) {
      setLine(pickChatLine({ isPlayPage, status: snapshot.value }, line));

      return;
    }

    setLine(pickHintLine({ difficulty, guesses, current }, line));
    // Measured per click, so a resized or rotated window gets a fresh choice.
    setPlacement(shieldPlacement(event.currentTarget));
    // Asking the hint bull counts as having seen what there is.
    markSeen(startedAt, newsworthyHintKeys(difficulty, guesses));
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
      {isShield && (
        <PopoverAnchor asChild>
          {/*
           * What the shield bubble attaches to: the button's box (Board makes
           * its parent `relative`). Above the shield it slides 8px inwards
           * and 10px down, bubble and arrow together, so the arrow points at
           * the inner horn and the bubble clears the game menu's chevron in
           * the header row.
           */}
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0",
              placement.side === "top" &&
                "-translate-x-2 translate-y-2.5 rtl:translate-x-2",
            )}
          />
        </PopoverAnchor>
      )}
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
        sideOffset={
          placement.side === "right" || placement.side === "left"
            ? BESIDE_SIDE_OFFSET
            : SIDE_OFFSET
        }
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
        <PopoverArrow width={ARROW_WIDTH} height={ARROW_HEIGHT} />
      </PopoverContent>
    </Popover>
  );
}

/* Makes i18next's `list` format say "a, b or c" instead of "a, b and c". */
const OR_LIST = {
  colors: { colors: { type: "disjunction" } },
  slots: { slots: { type: "disjunction" } },
} as const;

/* Also rendered by the bull-lines debug page (src/debug), to show real output. */
export function BullLineText({ line }: { line: BullLine }) {
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

    case "slotIsOneOf":
      return t("bull.hints.slotIsOneOf", {
        slot: hint.slot,
        colors: hint.colors.map(colorName),
        formatParams: OR_LIST.colors,
      });

    case "slotIsNot":
      return t("bull.hints.slotIsNot", {
        slot: hint.slot,
        color: colorName(hint.color),
      });

    case "exactly":
      return t("bull.hints.exactly", {
        count: hint.count,
        color: colorName(hint.color),
      });

    case "atLeast":
      return t("bull.hints.atLeast", {
        count: hint.count,
        color: colorName(hint.color),
      });

    case "atMostOne":
      return t("bull.hints.atMostOne", { color: colorName(hint.color) });

    case "colorInSlots":
      return t("bull.hints.colorInSlots", {
        color: colorName(hint.color),
        // Intl.ListFormat only takes strings.
        slots: hint.slots.map(String),
        formatParams: OR_LIST.slots,
      });

    case "noRepeats":
      return t("bull.hints.noRepeats");

    case "hasRepeat":
      return t("bull.hints.hasRepeat");

    case "rowHasAbsent":
      return t("bull.hints.rowHasAbsent", { color: colorName(hint.color) });

    case "rowSlotWrong":
      return t("bull.hints.rowSlotWrong", {
        slot: hint.slot,
        color: colorName(hint.color),
      });

    case "rowConflict":
      return t("bull.hints.rowConflict", { row: hint.row });

    case "rowNoFit":
      return t("bull.hints.rowNoFit");

    case "rowFits":
      return t("bull.hints.rowFits");

    case "rowFitsSoFar":
      return t("bull.hints.rowFitsSoFar");

    case "codesLeft":
      return t("bull.hints.codesLeft", { count: hint.count });

    case "oneLeft":
      return t("bull.hints.oneLeft");
  }
}
