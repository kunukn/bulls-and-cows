import { dailyNumber, DAILY_DIFFICULTY } from "@/features/daily/daily";
import {
  DailyResultsOverride,
  type DailyResults,
} from "@/features/daily/store";
import { cryptoRandomInt, scoreGuess, type Color } from "@/features/game/logic";
import { gameMachine } from "@/features/game/machine";
import { GameActorProvider } from "@/features/game/machine-context";
import { Play } from "@/features/game/pages/Play";
import { useEffect, useState } from "react";

/*
 * Developer page, unlinked: a finished daily game with made-up guesses, so
 * the share buttons can be tried without playing (and using up) today's
 * code. Nothing here is saved. Copy is English only on purpose (see
 * copilot-instructions.md).
 */

const COLOR_BY_LETTER: Record<string, Color> = {
  r: "red",
  o: "orange",
  y: "yellow",
  g: "green",
  c: "cyan",
  p: "purple",
};

// "cryc" → cyan, red, yellow, cyan. Classic colours only.
const toPegs = (letters: string): Color[] =>
  [...letters].map((letter) => COLOR_BY_LETTER[letter]);

// Made up, so the page never shows today's real code.
const SECRET = toPegs("cryc");

type Scenario = {
  id: string;
  label: string;
  outcome: "won" | "lost";
  rows: string[];
  elapsedMs: number;
};

const SCENARIOS: Scenario[] = [
  {
    id: "first",
    label: "Won in 1",
    outcome: "won",
    rows: ["cryc"],
    elapsedMs: 42_000,
  },
  {
    id: "very-lucky-two",
    label: "Very lucky 🦄: won in 2, 312 codes left",
    outcome: "won",
    rows: ["rygp", "cryc"],
    elapsedMs: 38_000,
  },
  {
    id: "lucky-three",
    label: "Lucky 🍀: won in 3, 8 codes left",
    outcome: "won",
    rows: ["rroo", "yycc", "cryc"],
    elapsedMs: 71_000,
  },
  {
    id: "four",
    label: "Worked out: won in 4, 1 code left",
    outcome: "won",
    rows: ["rroo", "yycc", "cyrc", "cryc"],
    elapsedMs: 134_000,
  },
  {
    id: "eight",
    label: "Won in 8",
    outcome: "won",
    rows: ["rrgg", "ooyy", "ccpp", "rycc", "cyrc", "crcy", "cryy", "cryc"],
    elapsedMs: 303_000,
  },
  {
    id: "last",
    label: "Won on the last guess",
    outcome: "won",
    rows: [
      "rroo",
      "yygg",
      "ccpp",
      "rycg",
      "yrcc",
      "crcg",
      "cyrc",
      "ccyr",
      "cryg",
      "cryc",
    ],
    elapsedMs: 451_000,
  },
  {
    id: "lost",
    label: "Lost (X/10)",
    outcome: "lost",
    rows: [
      "rroo",
      "yygg",
      "ccpp",
      "rycg",
      "yrcc",
      "crcg",
      "cyrc",
      "ccyr",
      "cryg",
      "crcc",
    ],
    elapsedMs: 490_000,
  },
  {
    id: "revealed",
    label: "Revealed after 3",
    outcome: "lost",
    rows: ["rroo", "yygg", "ccpp"],
    elapsedMs: 65_000,
  },
];

/*
 * The same kind of snapshot loadGame() restores. Numbered as today, so the
 * panel shows the countdown rather than "Play today's code".
 */
function finishedGame({ outcome, rows, elapsedMs }: Scenario) {
  const finishedAt = Date.now();

  return gameMachine.resolveState({
    value: outcome,
    context: {
      difficulty: DAILY_DIFFICULTY,
      secret: SECRET,
      guesses: rows.map((row) => {
        const pegs = toPegs(row);

        return { pegs, ...scoreGuess(SECRET, pegs) };
      }),
      current: SECRET.map(() => null),
      target: 0,
      placed: [],
      startedAt: finishedAt - elapsedMs,
      finishedAt,
      randomInt: cryptoRandomInt,
      dailyNumber: dailyNumber(),
      isSwapMode: false,
    },
  });
}

type StreakChoice = {
  id: string;
  label: string;
  // Days won before today; null keeps this browser's real results.
  daysBefore: number | null;
};

const STREAK_CHOICES: StreakChoice[] = [
  { id: "real", label: "This browser's results", daysBefore: null },
  { id: "one", label: "1 day", daysBefore: 0 },
  { id: "five", label: "5 days", daysBefore: 4 },
  { id: "hundred", label: "100 days", daysBefore: 99 },
];

/*
 * Wins on each of the days before today, then today's game. Read through
 * DailyResultsOverride, never written to the saved results.
 */
function madeUpResults(
  { outcome, rows, elapsedMs }: Scenario,
  daysBefore: number,
): DailyResults {
  const today = dailyNumber();
  const results: DailyResults = {
    [today]: { isWon: outcome === "won", guesses: rows.length, elapsedMs },
  };
  for (let day = today - daysBefore; day < today; day++) {
    // A spread of guess counts, so the chart isn't one bar.
    results[day] = {
      isWon: true,
      guesses: 3 + ((today - day) % 4),
      elapsedMs: 120_000,
    };
  }

  return results;
}

// Captured at load, so the copy-only switch can put the share sheet back.
const SHARE_DESCRIPTOR = Object.getOwnPropertyDescriptor(
  Navigator.prototype,
  "share",
);

function setShareSheetHidden(isHidden: boolean) {
  if (!SHARE_DESCRIPTOR) return;

  if (isHidden) {
    Reflect.deleteProperty(Navigator.prototype, "share");
  } else {
    Object.defineProperty(Navigator.prototype, "share", SHARE_DESCRIPTOR);
  }
}

export function SharePreviewPage() {
  const [scenarioId, setScenarioId] = useState("eight");
  const [streakId, setStreakId] = useState(STREAK_CHOICES[0].id);
  const [isCopyOnly, setIsCopyOnly] = useState(false);
  const scenario =
    SCENARIOS.find(({ id }) => id === scenarioId) ?? SCENARIOS[0];
  const { daysBefore } =
    STREAK_CHOICES.find(({ id }) => id === streakId) ?? STREAK_CHOICES[0];
  const results =
    daysBefore === null ? null : madeUpResults(scenario, daysBefore);

  // Leaving the page brings the share sheet back for the real game.
  useEffect(() => () => setShareSheetHidden(false), []);

  function changeCopyOnly(next: boolean) {
    // Before the re-render: the Share button checks for it while rendering.
    setShareSheetHidden(next);
    setIsCopyOnly(next);
  }

  return (
    <div className="flex flex-col gap-4 pb-12">
      <meta name="robots" content="noindex" />
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-heading">
          Share preview
        </h2>
        <p className="text-sm text-subtle">
          A finished daily game with made-up guesses and a made-up code. Try
          Share, X, Threads and Bluesky without using up today's code. Nothing
          is saved, not even a made-up streak.
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold text-heading">
          Result
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {SCENARIOS.map(({ id, label }) => (
            <label key={id} className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="scenario"
                value={id}
                checked={id === scenarioId}
                onChange={() => setScenarioId(id)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold text-heading">
          Streak, after a win (a loss shows none)
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {STREAK_CHOICES.map(({ id, label }) => (
            <label key={id} className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="streak"
                value={id}
                checked={id === streakId}
                onChange={() => setStreakId(id)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-1.5 text-sm">
        <input
          type="checkbox"
          checked={isCopyOnly}
          disabled={!SHARE_DESCRIPTOR}
          onChange={(event) => changeCopyOnly(event.target.checked)}
        />
        Copy instead of opening the share sheet
        {!SHARE_DESCRIPTOR && (
          <span className="text-subtle">(this browser has none)</span>
        )}
      </label>

      {/* A new key per choice: the provider reads its snapshot once. */}
      <DailyResultsOverride value={results}>
        <GameActorProvider
          key={`${scenario.id}-${isCopyOnly}`}
          options={{ snapshot: finishedGame(scenario) }}
        >
          <Play />
        </GameActorProvider>
      </DailyResultsOverride>
    </div>
  );
}
