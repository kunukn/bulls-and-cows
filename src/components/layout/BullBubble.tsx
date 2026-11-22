import { paths } from "@/app/paths";
import { BullIcon } from "@/components/icons/BullIcon";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { pickBullLine, type BullLine } from "@/features/game/bullLines";
import type { Color } from "@/features/game/logic";
import { useGameActorRef } from "@/features/game/machine-context";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMatch } from "react-router";

/*
 * The header bull, Tyr, as a speech bubble (decision 0011). Each click says
 * something new; mid-game that's a fact from the player's own clues. Esc or a
 * click outside closes it.
 */
export function BullBubble() {
  const { t } = useTranslation();
  const actor = useGameActorRef();
  const isPlayPage = useMatch({ path: paths.play, end: true }) !== null;
  const [isOpen, setIsOpen] = useState(false);
  const [line, setLine] = useState<BullLine | null>(null);

  function handleClick(event: React.MouseEvent) {
    // Radix would close an open bubble; here a click asks for a new line.
    event.preventDefault();
    // Read at click time: the bubble doesn't need to re-render on every peg.
    const snapshot = actor.getSnapshot();
    const { difficulty, guesses, current } = snapshot.context;
    setLine(
      pickBullLine(
        { isPlayPage, status: snapshot.value, difficulty, guesses, current },
        line,
      ),
    );
    setIsOpen(true);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("bull.button")}
          title={t("bull.button")}
          onClick={handleClick}
          className="shrink-0 cursor-pointer rounded-md text-subtle transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <BullIcon className="size-7" />
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
        side="bottom"
        align="start"
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
