import { ACTION_BUTTON_CLASS } from "@/components/actionButton";
import { paletteFor } from "@/features/game/logic";
import {
  useGameActorRef,
  useGameSelector,
} from "@/features/game/machine-context";
import { useSettings } from "@/features/game/store/settings";
import { cn } from "@/utils/cn";
import { CornerDownLeft, Delete } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getPegClass } from "./Peg";
import { PegShape } from "./PegShape";

/*
 * min-w, with the shared min-h, keeps the tap target the same size whether
 * the label shows or is hidden by Minimal text (icon-only would otherwise
 * shrink to ~48×36px).
 */
const actionButtonClass = cn(
  ACTION_BUTTON_CLASS,
  "min-w-24 px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
);

export function Palette() {
  const { t } = useTranslation();
  const actor = useGameActorRef();
  const difficulty = useGameSelector((snapshot) => snapshot.context.difficulty);
  const current = useGameSelector((snapshot) => snapshot.context.current);
  const isRowFull = !current.includes(null);
  const isRowEmpty = current.every((peg) => peg === null);
  // No target once the row is full; tapping a peg picks one to replace.
  const hasTarget = useGameSelector(
    (snapshot) => snapshot.context.target !== null,
  );
  const palette = paletteFor(difficulty);
  const isMinimalText = useSettings((state) => state.isMinimalText);
  const isAutoSubmit = useSettings((state) => state.isAutoSubmit);
  const pegStyle = useSettings((state) => state.pegStyle);
  // Icon-only buttons keep their name for screen readers and as a tooltip.
  const labelClass = isMinimalText ? "sr-only" : undefined;

  return (
    <section
      aria-label={t("game.palette")}
      className="@container flex flex-col gap-3"
    >
      {/*
       * One row, one column per colour: each is at most --peg (2.75rem = 44px
       * tap target) and shrinks only when space runs out, so hard's 8 colours
       * fit a 320px phone without wrapping. The gap takes the leftover width,
       * clamped to 8–20px: wide enough against mis-taps, and it gives way to
       * the pegs before they shrink. The row stays centred. When full-size
       * pegs with 8px gaps don't fit, the row widens by up to 8px per side
       * (--bleed) into the dock's inline padding before the pegs shrink.
       */}
      <div
        style={
          {
            "--colors": palette.length,
            "--bleed":
              "clamp(0px, (var(--colors) * var(--peg) + (var(--colors) - 1) * 0.5rem - 100cqi) / 2, 0.5rem)",
            marginInline: "calc(-1 * var(--bleed))",
            gap: "clamp(0.5rem, (100cqi + 2 * var(--bleed) - var(--colors) * var(--peg)) / (var(--colors) - 1), 1.25rem)",
          } as React.CSSProperties
        }
        className="grid grid-cols-[repeat(var(--colors),minmax(0,var(--peg)))] justify-center [--peg:2.75rem] desk:[--peg:3rem] big:[--peg:3.5rem]"
      >
        {palette.map((color, index) => (
          <button
            key={color}
            type="button"
            disabled={!hasTarget}
            onClick={() =>
              actor.send({
                type: "ADD_PEG",
                color,
                isAutoSubmit: useSettings.getState().isAutoSubmit,
              })
            }
            aria-label={t("game.addColor", {
              color: t(`colors.${color}`),
              key: index + 1,
            })}
            className={cn(
              getPegClass(color, pegStyle),
              "relative grid aspect-square w-full place-items-center rounded-full shadow-[inset_0_-3px_4px_rgb(0_0_0/0.35)] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {pegStyle !== "color" && (
              <PegShape color={color} className="size-3/5" />
            )}
            {/*
             * Keyboard shortcut, in a corner badge so the head stays clear.
             * Hidden on touch screens, like the shortcuts in How it works.
             */}
            <span
              aria-hidden
              className="absolute -end-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-slate-900 text-xs font-bold text-slate-200 ring-1 ring-slate-600 pointer-coarse:hidden"
            >
              {index + 1}
            </span>
          </button>
        ))}
      </div>
      {/* Wide gap: Undo and Check are opposite actions, easy to mis-tap. */}
      <div className="flex justify-center gap-6">
        <button
          type="button"
          disabled={isRowEmpty}
          onClick={() => actor.send({ type: "REMOVE_PEG" })}
          title={isMinimalText ? t("game.undo") : undefined}
          className={cn(actionButtonClass, "bg-secondary hover:bg-control")}
        >
          <Delete className="size-4" />
          <span className={labelClass}>{t("game.undo")}</span>
        </button>
        {/* With Auto check on, a full row is always checked (0008). */}
        {!isAutoSubmit && (
          <button
            type="button"
            disabled={!isRowFull}
            onClick={() => actor.send({ type: "SUBMIT" })}
            title={isMinimalText ? t("game.check") : undefined}
            className={cn(
              actionButtonClass,
              "bg-emerald-600 text-white hover:bg-emerald-500",
            )}
          >
            <span className={labelClass}>{t("game.check")}</span>
            <CornerDownLeft className="size-4" />
          </button>
        )}
      </div>
    </section>
  );
}
