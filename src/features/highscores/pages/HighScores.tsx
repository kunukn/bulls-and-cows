import { paths } from "@/app/paths";
import { DifficultyPicker } from "@/components/DifficultyPicker";
import { DIFFICULTY_KEYS, type Difficulty } from "@/features/game/logic";
import {
  useGameActorRef,
  useGameSelector,
} from "@/features/game/machine-context";
import { useSettings } from "@/features/game/store/settings";
import { cn } from "@/utils/cn";
import { formatDate, formatDuration } from "@/utils/format";
import {
  CalendarDays,
  Clock,
  RotateCcw,
  Rows4,
  Trash2,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { useHighScores } from "../store";

function isDifficulty(value: string | null): value is Difficulty {
  return DIFFICULTY_KEYS.includes(value as Difficulty);
}

type HeaderLabelProps = {
  label: string;
  icon: LucideIcon;
  isMinimalText: boolean;
};

/* Column header: the word, or an icon with the word kept for screen readers. */
function HeaderLabel({ label, icon: Icon, isMinimalText }: HeaderLabelProps) {
  if (!isMinimalText) return label;

  return (
    <span title={label} className="inline-flex">
      <Icon aria-hidden className="size-4" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function HighScores() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const fallback = useSettings((state) => state.difficulty);
  const param = searchParams.get("difficulty");
  const difficulty = isDifficulty(param) ? param : fallback;
  const entries = useHighScores((state) => state.scores[difficulty]);
  const clear = useHighScores((state) => state.clear);
  const isMinimalText = useSettings((state) => state.isMinimalText);
  const actor = useGameActorRef();
  const navigate = useNavigate();
  /*
   * Offer a new game only once the current one is over, so the CTA can never
   * throw away a game in progress (the header's Play link resumes that).
   */
  const isGameOver = useGameSelector(
    (snapshot) => snapshot.matches("won") || snapshot.matches("lost"),
  );
  // A score's id is its game's start time, so this marks the run just saved.
  const currentGameId = useGameSelector(
    (snapshot) => snapshot.context.startedAt,
  );

  function handleClear() {
    if (window.confirm(t("highScores.clearConfirm"))) clear();
  }

  function handlePlayAgain() {
    actor.send({ type: "NEW_GAME" });
    navigate(paths.play);
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/*
       * The active trophy tab already says where you are. min-h-9 matches
       * DailyLink's height on Play so the picker doesn't jump between pages.
       */}
      <h2
        className={
          isMinimalText
            ? "sr-only"
            : "flex min-h-9 items-center text-xl font-bold"
        }
      >
        {t("highScores.title")}
      </h2>
      <DifficultyPicker
        name="highscore-difficulty"
        legend={t("highScores.showFor")}
        value={difficulty}
        onChange={(next) =>
          setSearchParams({ difficulty: next }, { replace: true })
        }
      />

      <table className="w-full overflow-hidden rounded-2xl bg-card text-left text-sm">
        <thead className="bg-secondary/60 text-xs tracking-wide text-subtle uppercase">
          <tr>
            <th scope="col" className="px-3 py-2">
              {t("highScores.rank")}
            </th>
            <th scope="col" className="px-3 py-2">
              <HeaderLabel
                label={t("highScores.name")}
                icon={UserRound}
                isMinimalText={isMinimalText}
              />
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              <HeaderLabel
                label={t("highScores.guesses")}
                icon={Rows4}
                isMinimalText={isMinimalText}
              />
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              <HeaderLabel
                label={t("highScores.time")}
                icon={Clock}
                isMinimalText={isMinimalText}
              />
            </th>
            <th
              scope="col"
              className="hidden px-3 py-2 text-right sm:table-cell"
            >
              <HeaderLabel
                label={t("highScores.date")}
                icon={CalendarDays}
                isMinimalText={isMinimalText}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {/*
           * The empty state is a row of the same table, so the card keeps
           * the height and headings of a one-entry board.
           */}
          {entries.length === 0 && (
            <tr className="border-t border-secondary">
              <td
                colSpan={5}
                className="px-3 py-2 text-center text-muted-foreground"
              >
                {/* size-5 matches text-sm's 20px line, so the row height holds. */}
                {isMinimalText && (
                  <Trophy
                    aria-hidden
                    className="mx-auto block size-5 text-faint"
                  />
                )}
                <span className={isMinimalText ? "sr-only" : undefined}>
                  {t("highScores.empty")}
                </span>
              </td>
            </tr>
          )}
          {entries.map((entry, index) => (
            <tr
              key={entry.id}
              aria-current={entry.id === currentGameId ? "true" : undefined}
              className="border-t border-secondary aria-current:bg-warning/15"
            >
              <td className="px-3 py-2 text-muted-foreground tabular-nums">
                {index + 1}
              </td>
              <td className="max-w-32 truncate px-3 py-2 font-medium">
                {entry.name}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {entry.guesses}
              </td>
              <td className="px-3 py-2 text-right font-mono tabular-nums">
                {formatDuration(entry.elapsedMs)}
              </td>
              <td className="hidden px-3 py-2 text-right text-muted-foreground sm:table-cell">
                {formatDate(entry.achievedAt, i18n.language)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isGameOver && (
        <button
          type="button"
          onClick={handlePlayAgain}
          title={isMinimalText ? t("result.newGame") : undefined}
          className="flex items-center gap-1.5 self-center rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {isMinimalText && <RotateCcw aria-hidden className="size-5" />}
          <span className={isMinimalText ? "sr-only" : undefined}>
            {t("result.newGame")}
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={handleClear}
        title={isMinimalText ? t("highScores.clear") : undefined}
        className={cn(
          "self-end text-sm text-muted-foreground underline-offset-2 hover:text-destructive",
          isMinimalText ? "rounded-md p-2" : "hover:underline",
        )}
      >
        {isMinimalText && <Trash2 aria-hidden className="size-5" />}
        <span className={isMinimalText ? "sr-only" : undefined}>
          {t("highScores.clear")}
        </span>
      </button>
    </div>
  );
}
