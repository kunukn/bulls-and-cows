import { paths } from "@/app/paths";
import {
  useGameActorRef,
  useGameSelector,
} from "@/features/game/machine-context";
import { DIFFICULTIES } from "@/features/game/logic";
import { elapsedMs } from "@/features/game/machine";
import { useSettings } from "@/features/game/store/settings";
import {
  boardKey,
  qualifies,
  useHighScores,
} from "@/features/highscores/store";
import { cn } from "@/utils/cn";
import { formatDuration } from "@/utils/format";
import { CircleCheck, RotateCcw, Save, Trophy, UserRound } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

/* Sizes the name field as well as limiting it, so the field shows its limit. */
const NAME_MAX_LENGTH = 24;

type OutcomeMessageProps = {
  isWon: boolean;
  /* Lost with guesses left, i.e. the player gave up. */
  hasGivenUp: boolean;
  guesses: number;
  elapsedMs: number;
  isMinimalText: boolean;
};

/* Win/loss line; minimal text keeps the full sentence for screen readers. */
export function OutcomeMessage({
  isWon,
  hasGivenUp,
  guesses,
  elapsedMs,
  isMinimalText,
}: OutcomeMessageProps) {
  const { t } = useTranslation();

  if (!isWon) {
    const message = hasGivenUp ? t("result.gaveUp") : t("result.lost");
    if (!isMinimalText)
      return <p className="text-lg font-semibold">{message}</p>;

    // The revealed secret already shows the loss; announce it only.
    return <p className="sr-only">{message}</p>;
  }

  const time = formatDuration(elapsedMs);
  const message = t("result.won", { count: guesses, time });

  return (
    <p className="flex items-center gap-2 text-lg font-semibold">
      <Trophy className="size-5 shrink-0 text-warning" />
      {isMinimalText ? (
        <>
          <span aria-hidden className="tabular-nums">
            {guesses} · {time}
          </span>
          <span className="sr-only">{message}</span>
        </>
      ) : (
        message
      )}
    </p>
  );
}

export function ResultPanel() {
  const { t } = useTranslation();
  const actor = useGameActorRef();
  const navigate = useNavigate();
  const isWon = useGameSelector((snapshot) => snapshot.matches("won"));
  const context = useGameSelector((snapshot) => snapshot.context);
  const entries = useHighScores(
    (state) => state[boardKey(context.isSwapMode)][context.difficulty],
  );
  const lastName = useHighScores((state) => state.lastName);
  const addEntry = useHighScores((state) => state.addEntry);
  const isMinimalText = useSettings((state) => state.isMinimalText);
  const isHighScoresEnabled = useSettings((state) => state.isHighScoresEnabled);
  const [name, setName] = useState(lastName);
  /*
   * Saving records the score at once, but the route changes a frame later.
   * Until then the panel stays as it was submitted, not in its saved look.
   */
  const [isLeaving, setIsLeaving] = useState(false);

  const run = {
    guesses: context.guesses.length,
    elapsedMs: elapsedMs(context),
  };
  const isRecorded = entries.some((entry) => entry.id === context.startedAt);
  const canRecord =
    isLeaving ||
    (isHighScoresEnabled && isWon && !isRecorded && qualifies(entries, run));
  // Icon-only buttons keep their name for screen readers and as a tooltip.
  const labelClass = isMinimalText ? "sr-only" : undefined;
  /*
   * A name in the field looks like a score about to be kept, so starting
   * over then says what it costs. An empty field promises nothing (0010).
   */
  const isNameUnsaved = canRecord && name.trim() !== "";
  const newGameLabel = isNameUnsaved
    ? t("result.playWithoutSaving")
    : t("result.newGame");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsLeaving(true);
    addEntry(
      context.difficulty,
      { id: context.startedAt, name: trimmedName, ...run },
      context.isSwapMode,
    );
    const mode = context.isSwapMode ? "&mode=swap" : "";
    navigate(`${paths.highScores}?difficulty=${context.difficulty}${mode}`);
  }

  return (
    <section
      aria-live="polite"
      className="flex flex-col items-center gap-3 rounded-2xl bg-card p-4 text-center"
    >
      <OutcomeMessage
        isWon={isWon}
        hasGivenUp={
          !isWon && run.guesses < DIFFICULTIES[context.difficulty].maxGuesses
        }
        guesses={run.guesses}
        elapsedMs={run.elapsedMs}
        isMinimalText={isMinimalText}
      />

      {canRecord && (
        <form
          onSubmit={handleSubmit}
          className="flex w-full items-center justify-center gap-2"
        >
          {isMinimalText && (
            <UserRound
              aria-hidden
              className="size-5 shrink-0 text-muted-foreground"
            />
          )}
          <label htmlFor="highscore-name" className="sr-only">
            {t("result.yourName")}
          </label>
          <input
            id="highscore-name"
            name="name"
            required
            size={NAME_MAX_LENGTH}
            maxLength={NAME_MAX_LENGTH}
            // oxlint-disable-next-line jsx-a11y/autocomplete-valid -- `nickname` is a valid HTML token; the rule's list lacks it
            autoComplete="nickname"
            // oxlint-disable-next-line jsx-a11y/no-autofocus -- focus follows the player's own winning move, so it isn't a surprise
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={isMinimalText ? undefined : t("result.yourName")}
            className="min-w-0 rounded-lg bg-background px-3 py-2 text-foreground ring-1 ring-control outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            title={isMinimalText ? t("result.save") : undefined}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 font-semibold text-slate-900 hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {isMinimalText && <Save aria-hidden className="size-5" />}
            <span className={labelClass}>{t("result.save")}</span>
          </button>
        </form>
      )}
      {isRecorded && !isLeaving && (
        <p className="text-sm text-success">
          {isMinimalText && <CircleCheck aria-hidden className="size-5" />}
          <span className={labelClass}>{t("result.saved")}</span>
        </p>
      )}

      <button
        type="button"
        onClick={() =>
          actor.send({
            type: "NEW_GAME",
            isSwapMode: useSettings.getState().isSwapEnabled,
          })
        }
        title={isMinimalText ? newGameLabel : undefined}
        className={cn(
          "flex items-center gap-1.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          // Both looks match Save score's height, so typing a name moves nothing.
          isNameUnsaved
            ? "px-3 py-2 text-sm/6 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            : "bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-500",
        )}
      >
        {isMinimalText && <RotateCcw aria-hidden className="size-5" />}
        <span className={labelClass}>{newGameLabel}</span>
      </button>
    </section>
  );
}
