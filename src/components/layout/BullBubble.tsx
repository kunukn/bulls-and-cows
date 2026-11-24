import { paths } from "@/app/paths";
import { BullIcon } from "@/components/icons/BullIcon";
import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DAILY_DIFFICULTY, msUntilNextDaily } from "@/features/daily/daily";
import { summarize, useDailyResults } from "@/features/daily/store";
import {
  pickChatLine,
  pickDailyLine,
  pickHintLine,
  type BullLine,
  type DailyFact,
} from "@/features/game/bullLines";
import { newsworthyHintKeys } from "@/features/game/hints";
import { DIFFICULTIES, type Color } from "@/features/game/logic";
import {
  useGameActorRef,
  useGameSelector,
} from "@/features/game/machine-context";
import { useHintsSeen } from "@/features/game/store/hintsSeen";
import { cn } from "@/utils/cn";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMatch } from "react-router";

type Props =
  /* The brand bull beside the title: it chats, and never gives hints. */
  | { variant: "header" }
  /*
   * The hint bull: a see-through button over the bull moulded into the code
   * shield, which draws the bull and its dot itself (it is aria-hidden and
   * ignores clicks). Board only renders it while a game is in play. On the
   * daily code it gives no hints, only calm words, the day's rules and stats.
   */
  | { variant: "shield"; hasNewHint: boolean };

type Placement = {
  side: "top" | "right" | "bottom" | "left";
  align: "start" | "center" | "end";
};

const HEADER_PLACEMENT: Placement = { side: "bottom", align: "start" };

const ARROW_WIDTH = 14;
const ARROW_HEIGHT = 7;

// Gap between the anchor and the bubble's arrow tip.
const SIDE_OFFSET = 8;
const BESIDE_SIDE_OFFSET = 12;

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
  const isDaily = useGameSelector(
    (snapshot) => snapshot.context.dailyNumber !== null,
  );

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
    const { difficulty, guesses, current, startedAt, dailyNumber } =
      snapshot.context;
    setIsOpen(true);

    if (!isShield) {
      setLine(pickChatLine({ isPlayPage, status: snapshot.value }, line));

      return;
    }

    // Measured per click, so a resized or rotated window gets a fresh choice.
    setPlacement(shieldPlacement(event.currentTarget));

    // One shared code a day: the bull keeps the solving to the player (0012).
    if (dailyNumber !== null) {
      const { results } = useDailyResults.getState();
      const stats = summarize(results, dailyNumber);
      setLine(
        pickDailyLine(
          { dailyNumber, msUntilNext: msUntilNextDaily(), stats },
          line,
        ),
      );

      return;
    }

    setLine(pickHintLine({ difficulty, guesses, current }, line));
    // Asking the hint bull counts as having seen what there is.
    markSeen(startedAt, newsworthyHintKeys(difficulty, guesses));
  }

  let label = t("bull.button");
  if (isShield && isDaily) label = t("bull.dailyButton");
  else if (isShield) {
    label = t(props.hasNewHint ? "bull.hintButtonNew" : "bull.hintButton");
  }

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
          {!isShield && <BullIcon className="size-7" shouldBlink />}
        </button>
      </PopoverTrigger>
      {isShield && (
        <PopoverAnchor asChild>
          {/*
           * What the shield bubble attaches to: the button's box (Board makes
           * its parent `relative`). Translating it moves bubble and arrow
           * together. Above the shield it slides 4px up, so the arrow tip
           * clears the shield's top edge. Beside the board it stays put.
           */}
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0",
              placement.side === "top" && "-translate-y-1",
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
        className="relative w-auto max-w-[min(18rem,calc(100vw-2rem))] py-2 ps-3 pe-8 text-pretty"
      >
        {line && (
          <p>
            <BullLineText line={line} />
          </p>
        )}
        {/* Touch screens have no Esc, and a tap outside isn't obvious. */}
        <PopoverClose
          aria-label={t("common.close")}
          title={t("common.close")}
          className="absolute end-1 top-1 grid size-6 cursor-pointer place-items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <XIcon className="size-3.5" />
        </PopoverClose>

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

  if (line.kind === "daily") return <DailyFactText fact={line.fact} />;

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

/*
 * Rounded to whole hours, or minutes in the last hour. Intl.RelativeTimeFormat
 * gives "in 3 hours" with each language's own plurals.
 */
function formatTimeUntil(ms: number, locale: string): string {
  const format = new Intl.RelativeTimeFormat(locale);
  const hours = Math.round(ms / 3_600_000);
  if (hours >= 1) return format.format(hours, "hour");

  return format.format(Math.max(1, Math.ceil(ms / 60_000)), "minute");
}

function DailyFactText({ fact }: { fact: DailyFact }) {
  const { t, i18n } = useTranslation();

  switch (fact.kind) {
    case "nextCode":
      return t("bull.daily.nextCode", {
        time: formatTimeUntil(fact.msUntilNext, i18n.language),
      });

    case "seed":
      return t("bull.daily.seed", { number: fact.dailyNumber });

    case "rules": {
      const { pegs, colors, maxGuesses } = DIFFICULTIES[DAILY_DIFFICULTY];

      return t("bull.daily.rules", {
        details: t("difficulty.details", { pegs, colors }),
        guesses: maxGuesses,
      });
    }

    case "codeCount":
      return t("bull.facts.codeCount", { codes: fact.codes });

    case "wins":
      return t("bull.stats.wins", { won: fact.won, played: fact.played });

    case "averageWin":
      return t("bull.stats.averageWin", { guesses: fact.guesses });

    case "bestStreak":
      return t("bull.stats.bestStreak", { days: fact.days });
  }
}
