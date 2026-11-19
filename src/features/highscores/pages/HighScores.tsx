import { DifficultyPicker } from "@/components/DifficultyPicker";
import { DIFFICULTY_KEYS, type Difficulty } from "@/features/game/logic";
import { useSettings } from "@/features/game/store/settings";
import { cn } from "@/utils/cn";
import { formatDate, formatDuration } from "@/utils/format";
import {
  CalendarDays,
  Clock,
  Rows4,
  Trash2,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
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

  function handleClear() {
    if (window.confirm(t("highScores.clearConfirm"))) clear();
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* The active trophy tab already says where you are. */}
      <h2 className={isMinimalText ? "sr-only" : "text-xl font-bold"}>
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

      {entries.length === 0 ? (
        <p className="flex justify-center rounded-2xl bg-card p-6 text-center text-muted-foreground">
          {isMinimalText && (
            <Trophy aria-hidden className="size-10 text-faint" />
          )}
          <span className={isMinimalText ? "sr-only" : undefined}>
            {t("highScores.empty")}
          </span>
        </p>
      ) : (
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
            {entries.map((entry, index) => (
              <tr key={entry.id} className="border-t border-secondary">
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
