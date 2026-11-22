import { BullIcon } from "@/components/icons/BullIcon";
import { cn } from "@/utils/cn";
import {
  FEEDBACK_COLUMN,
  NUMBER_COLUMN,
  PEG_SIZE,
  PEGS_COLUMN,
  ROW_LAYOUT,
} from "./rowLayout";

type Props = {
  pegs: number;
  isOpen: boolean;
  /* The bull moulded into the shield's end; Board lays the Hint button over it. */
  hasBull: boolean;
  /* Shows the bull's marker: a guess has proved something not yet shown. */
  hasNewHint: boolean;
};

/*
 * The hinged plastic shield over the secret code. It lifts on its top edge
 * towards the viewer, like the shield on a physical board (see
 * docs/product/decisions/0001-physical-board-motion.md). The plate has a
 * real edge face, so when it stands upright it shows its thickness instead
 * of vanishing. The long perspective is a normal viewing distance: a short
 * one magnifies the raised edge until it overhangs the board's sides.
 * A transition, not a keyframe animation, so a new game closes
 * it again and a restored finished game shows it open without replaying.
 */
export function SecretShield({ pegs, isOpen, hasBull, hasNewHint }: Props) {
  return (
    <div
      aria-hidden
      data-open={isOpen}
      className="pointer-events-none absolute inset-0 origin-top [transform:perspective(2400px)_rotateX(0)] transition-transform duration-500 ease-in-out transform-3d data-[open=true]:[transform:perspective(2400px)_rotateX(90deg)] motion-reduce:transition-none"
    >
      <div
        className={cn(
          ROW_LAYOUT,
          "size-full rounded-lg py-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.15),0_2px_4px_var(--board-shield-drop)] board-shield",
        )}
      >
        <span className={NUMBER_COLUMN} />
        <div className={PEGS_COLUMN}>
          {Array.from({ length: pegs }, (_, index) => (
            <span
              key={index}
              className={cn(
                PEG_SIZE,
                "grid place-items-center rounded-full bg-board-shield-cap text-sm font-bold text-board-shield-label shadow-[inset_0_-2px_3px_rgb(0_0_0/0.25)]",
              )}
            >
              ?
            </span>
          ))}
        </div>
        <span className={cn(FEEDBACK_COLUMN, "grid place-items-center")}>
          {hasBull && (
            <span className="relative">
              {/*
               * Embossed: the label colour plus a highlight under each ridge.
               * A size down from the header's brand bull (size-7), so the two
               * don't read as the same button and help stays in the background.
               */}
              <BullIcon className="size-6 text-board-shield-label drop-shadow-[0_1px_0_rgb(255_255_255/0.2)]" />
              {/*
               * A quiet marker for a new fact, in the bull's own colour with
               * no glow: it informs without asking to be clicked. It fades
               * rather than pops, for the same reason.
               */}
              <span
                data-lit={hasNewHint}
                className="absolute -end-1 -top-1 size-2 rounded-full bg-board-shield-label opacity-0 transition-opacity duration-300 data-[lit=true]:opacity-100 motion-reduce:transition-none"
              />
            </span>
          )}
        </span>
      </div>
      {/* Front edge: hangs from the free edge down to the board. */}
      <div className="absolute inset-x-0 top-full h-1.5 origin-top [transform:rotateX(-90deg)] rounded-b-sm bg-board-shield-edge" />
    </div>
  );
}
