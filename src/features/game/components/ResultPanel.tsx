import { paths } from "@/app/paths";
import {
  useGameActorRef,
  useGameSelector,
} from "@/features/game/machine-context";
import { DIFFICULTIES } from "@/features/game/logic";
import { elapsedMs } from "@/features/game/machine";
import { useSettings } from "@/features/game/store/settings";
import { qualifies, useHighScores } from "@/features/highscores/store";
import { formatDuration } from "@/utils/format";
import { CircleCheck, RotateCcw, Save, Trophy, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

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
  const entries = useHighScores((state) => state.scores[context.difficulty]);
  const lastName = useHighScores((state) => state.lastName);
  const addEntry = useHighScores((state) => state.addEntry);
  const isMinimalText = useSettings((state) => state.isMinimalText);
  const isHighScoresEnabled = useSettings((state) => state.isHighScoresEnabled);

  const run = {
    guesses: context.guesses.length,
    elapsedMs: elapsedMs(context),
  };
  const isRecorded = entries.some((entry) => entry.id === context.startedAt);
  const canRecord =
    isHighScoresEnabled && isWon && !isRecorded && qualifies(entries, run);
  // Icon-only buttons keep their name for screen readers and as a tooltip.
  const labelClass = isMinimalText ? "sr-only" : undefined;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name")).trim();
    if (!name) return;

    addEntry(context.difficulty, {
      id: context.startedAt,
      name,
      ...run,
    });
    navigate(`${paths.highScores}?difficulty=${context.difficulty}`);
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
          className="flex w-full items-center gap-2"
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
            maxLength={20}
            // oxlint-disable-next-line jsx-a11y/autocomplete-valid -- `nickname` is a valid HTML token; the rule's list lacks it
            autoComplete="nickname"
            // oxlint-disable-next-line jsx-a11y/no-autofocus -- focus follows the player's own winning move, so it isn't a surprise
            autoFocus
            defaultValue={lastName}
            placeholder={isMinimalText ? undefined : t("result.yourName")}
            className="min-w-0 flex-1 rounded-lg bg-background px-3 py-2 text-foreground ring-1 ring-control outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            title={isMinimalText ? t("result.save") : undefined}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 font-semibold text-slate-900 hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {isMinimalText && <Save aria-hidden className="size-5" />}
            <span className={labelClass}>{t("result.save")}</span>
          </button>
        </form>
      )}
      {isRecorded && (
        <p className="text-sm text-success">
          {isMinimalText && <CircleCheck aria-hidden className="size-5" />}
          <span className={labelClass}>{t("result.saved")}</span>
        </p>
      )}

      <button
        type="button"
        onClick={() => actor.send({ type: "NEW_GAME" })}
        title={isMinimalText ? t("result.newGame") : undefined}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {isMinimalText && <RotateCcw aria-hidden className="size-5" />}
        <span className={labelClass}>{t("result.newGame")}</span>
      </button>
    </section>
  );
}
