import { paletteFor } from "@/features/game/logic";
import {
  useGameActorRef,
  useGameSelector,
} from "@/features/game/machine-context";
import { useSettings } from "@/features/game/store/settings";
import { cn } from "@/utils/cn";
import { CornerDownLeft, Delete } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PEG_CLASS } from "./Peg";
import { PegShape } from "./PegShape";

const actionButtonClass =
  "flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40";

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
  const isPegShapes = useSettings((state) => state.isPegShapes);
  // Icon-only buttons keep their name for screen readers and as a tooltip.
  const labelClass = isMinimalText ? "sr-only" : undefined;

  return (
    <section aria-label={t("game.palette")} className="flex flex-col gap-3">
      {/*
       * One row, one column per colour: each is at most 2.75rem (44px tap
       * target) and shrinks only when space runs out, so hard's 8 colours fit
       * a 320px phone without wrapping.
       */}
      <div
        style={{ "--colors": palette.length } as React.CSSProperties}
        className="grid grid-cols-[repeat(var(--colors),minmax(0,2.75rem))] justify-center gap-2 max-sm:gap-1.5 desk:grid-cols-[repeat(var(--colors),minmax(0,3rem))]"
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
              PEG_CLASS[color],
              "relative grid aspect-square w-full place-items-center rounded-full shadow-[inset_0_-3px_4px_rgb(0_0_0/0.35)] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {isPegShapes && <PegShape color={color} className="size-3/5" />}
            {/* Keyboard shortcut, in a corner badge so the head stays clear. */}
            <span
              aria-hidden
              className="absolute -end-1 -top-1 grid size-4 place-items-center rounded-full bg-slate-900 text-[0.625rem] font-bold text-slate-200 ring-1 ring-slate-600"
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
      </div>
    </section>
  );
}
