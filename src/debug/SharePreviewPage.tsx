import { dailyNumber, DAILY_DIFFICULTY } from "@/features/daily/daily";
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
    id: "four",
    label: "Won in 4",
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
  const [scenarioId, setScenarioId] = useState(SCENARIOS[2].id);
  const [isCopyOnly, setIsCopyOnly] = useState(false);
  const scenario =
    SCENARIOS.find(({ id }) => id === scenarioId) ?? SCENARIOS[0];

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
          is saved. The stats are this browser's real daily results.
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
      <GameActorProvider
        key={`${scenario.id}-${isCopyOnly}`}
        options={{ snapshot: finishedGame(scenario) }}
      >
        <Play />
      </GameActorProvider>
    </div>
  );
}
