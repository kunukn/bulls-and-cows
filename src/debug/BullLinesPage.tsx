import { paths } from "@/app/paths";
import { BullLineText } from "@/components/layout/BullBubble";
import {
  CALM_KEYS,
  DAILY_KEYS,
  FACT_KEYS,
  LOST_KEYS,
  QUIP_KEYS,
  TIP_KEYS,
  WON_KEYS,
  type BullLine,
  type DailyFact,
} from "@/features/game/bullLines";
import { isRowHint, type Hint } from "@/features/game/hints";
import { LANGUAGES } from "@/i18n/languages";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { SAMPLE_HINTS } from "./sampleHints";

/*
 * Developer page, unlinked: every line both bulls can say, in the active
 * language, rendered by the bubble's own component, grouped by the page the
 * player hears them on. Copy is English only on purpose (see
 * copilot-instructions.md). Switch language in Settings.
 */

type Group = {
  title: string;
  when: string;
  lines: BullLine[];
};

type BullProps = {
  title: string;
  labels: [string, string][];
  groups: Group[];
};

type PageProps = {
  id: string;
  title: string;
  path: string;
  bulls: BullProps[];
};

const toStatic = <Key extends Extract<BullLine, { kind: "static" }>["key"]>(
  keys: readonly Key[],
): BullLine[] => keys.map((key) => ({ kind: "static", key }));

const allHints: Hint[] = Object.values(SAMPLE_HINTS).flat();
const toHintLines = (hints: Hint[]): BullLine[] =>
  hints.map((hint) => ({ kind: "hint", hint }));

const toDailyLines = (facts: DailyFact[]): BullLine[] =>
  facts.map((fact) => ({ kind: "daily", fact }));

const QUIPS: Group = {
  title: "Quips",
  when: "Always",
  lines: toStatic(QUIP_KEYS),
};

const PRACTICE_HEADER_GROUPS: Group[] = [
  QUIPS,
  { title: "After a win", when: "Game won", lines: toStatic(WON_KEYS) },
  { title: "After a loss", when: "Game lost", lines: toStatic(LOST_KEYS) },
];

// pickChatLine only talks about a finished game on the play page itself.
const DAILY_HEADER_GROUPS: Group[] = [QUIPS];

const PRACTICE_SHIELD_GROUPS: Group[] = [
  { title: "Tips", when: "Before the first guess", lines: toStatic(TIP_KEYS) },
  {
    title: "No clues yet",
    when: "No deductions",
    lines: [{ kind: "noClues" }],
  },
  {
    title: "Your row",
    when: "Pegs in the active row",
    lines: toHintLines(allHints.filter(isRowHint)),
  },
  {
    title: "The board",
    when: "After a guess",
    lines: toHintLines(allHints.filter((hint) => !isRowHint(hint))),
  },
];

// Sample numbers: the real ones come from the clock and the player's results.
const DAILY_SHIELD_GROUPS: Group[] = [
  { title: "Calm", when: "Always", lines: toStatic(CALM_KEYS) },
  {
    title: "How it works",
    when: "Always",
    lines: [
      ...toStatic(DAILY_KEYS),
      ...toDailyLines([
        { kind: "nextCode", msUntilNext: 3.4 * 3_600_000 },
        { kind: "nextCode", msUntilNext: 25 * 60_000 },
        { kind: "seed", dailyNumber: 12 },
        { kind: "rules" },
      ]),
    ],
  },
  {
    title: "Facts",
    when: "Always",
    lines: [
      ...toStatic(FACT_KEYS),
      ...toDailyLines([{ kind: "codeCount", codes: 1296 }]),
    ],
  },
  {
    title: "Your stats",
    when: "After a finished daily code",
    lines: toDailyLines([
      { kind: "wins", won: 7, played: 9 },
      { kind: "averageWin", guesses: 31 / 7 },
      { kind: "bestStreak", days: 4 },
    ]),
  },
];

const DAILY_FACT_KEYS: Record<DailyFact["kind"], string> = {
  nextCode: "bull.daily.nextCode",
  seed: "bull.daily.seed",
  rules: "bull.daily.rules",
  codeCount: "bull.facts.codeCount",
  wins: "bull.stats.wins",
  averageWin: "bull.stats.averageWin",
  bestStreak: "bull.stats.bestStreak",
};

function keyOf(line: BullLine): string {
  if (line.kind === "static") return line.key;

  if (line.kind === "noClues") return "bull.noClues";

  if (line.kind === "daily") return DAILY_FACT_KEYS[line.fact.kind];

  return `bull.hints.${line.hint.kind}`;
}

export function BullLinesPage() {
  const { t, i18n } = useTranslation();
  const language =
    LANGUAGES.find(({ code }) => code === i18n.resolvedLanguage)?.label ??
    i18n.resolvedLanguage;
  const pages: PageProps[] = [
    {
      id: "practice",
      title: "Practice game",
      path: paths.play,
      bulls: [
        {
          title: "Header bull",
          labels: [
            ["Button", t("bull.button")],
            ["Bubble", t("bull.says")],
          ],
          groups: PRACTICE_HEADER_GROUPS,
        },
        {
          title: "Shield bull",
          labels: [
            ["Button", t("bull.hintButton")],
            ["Button, new fact", t("bull.hintButtonNew")],
            ["Bubble", t("bull.says")],
          ],
          groups: PRACTICE_SHIELD_GROUPS,
        },
      ],
    },
    {
      id: "daily",
      title: "Daily code",
      path: paths.daily,
      bulls: [
        {
          title: "Header bull",
          labels: [
            ["Button", t("bull.button")],
            ["Bubble", t("bull.says")],
          ],
          groups: DAILY_HEADER_GROUPS,
        },
        {
          title: "Shield bull",
          labels: [
            ["Button", t("bull.dailyButton")],
            ["Bubble", t("bull.says")],
          ],
          groups: DAILY_SHIELD_GROUPS,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">
      <meta name="robots" content="noindex" />
      <div className="flex flex-col gap-1">
        <Link
          to={paths.debug}
          className="text-sm text-subtle underline underline-offset-4 hover:text-foreground"
        >
          All debug pages
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-heading">
          Bull lines
        </h2>
        <p className="text-sm text-subtle">
          Lines in {language}, by the page they're said on. Change the language
          in Settings.
        </p>
        <nav className="flex gap-4 text-sm lg:hidden">
          {pages.map((page) => (
            <a
              key={page.id}
              href={`#${page.id}`}
              className="underline underline-offset-4 hover:text-foreground"
            >
              {page.title}
            </a>
          ))}
        </nav>
      </div>

      {/*
       * Wide screens: one column per page. Filled column by column, one row
       * per block (title, then each bull), so each bull lines up with its
       * counterpart on the other page.
       */}
      <div className="flex flex-col gap-8 lg:grid lg:grid-flow-col lg:grid-cols-2 lg:grid-rows-[repeat(3,auto)] lg:gap-x-10">
        {pages.map((page) => (
          <Page key={page.id} {...page} />
        ))}
      </div>
    </div>
  );
}

const countLines = (groups: Group[]) =>
  groups.reduce((total, group) => total + group.lines.length, 0);

function Page({ id, title, path, bulls }: PageProps) {
  const lineCount = bulls.reduce(
    (total, bull) => total + countLines(bull.groups),
    0,
  );

  return (
    // Its blocks join the parent's grid on wide screens (`contents`).
    <section className="flex flex-col gap-6 lg:contents">
      <div
        id={id}
        className="flex scroll-mt-4 flex-col gap-1 border-t border-border pt-6"
      >
        <h3 className="text-2xl font-bold text-heading">{title}</h3>
        <p className="text-sm text-subtle">
          <Link
            to={path}
            className="font-mono underline underline-offset-4 hover:text-foreground"
          >
            {path}
          </Link>{" "}
          · {lineCount} lines
        </p>
      </div>
      {bulls.map((bull) => (
        <Bull key={bull.title} {...bull} />
      ))}
    </section>
  );
}

function Bull({ title, labels, groups }: BullProps) {
  return (
    <section className="flex flex-col gap-4">
      <h4 className="text-xl font-bold text-heading">
        {title}{" "}
        <span className="text-sm font-normal text-subtle tabular-nums">
          {countLines(groups)}
        </span>
      </h4>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 rounded-lg bg-card p-3 text-sm">
        {labels.map(([where, text]) => (
          <div key={where} className="contents">
            <dt className="text-subtle">{where}</dt>
            <dd className="font-medium">{text}</dd>
          </div>
        ))}
      </dl>
      {groups.map((group) => (
        <section key={group.title} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h5 className="font-semibold text-heading">
              {group.title}{" "}
              <span className="text-sm font-normal text-subtle tabular-nums">
                {group.lines.length}
              </span>
            </h5>
            <span className="text-xs text-subtle">{group.when}</span>
          </div>
          <ol className="divide-y divide-border rounded-lg bg-card">
            {group.lines.map((line, index) => (
              <li key={index} className="flex flex-col gap-0.5 px-3 py-2">
                <span>
                  <BullLineText line={line} />
                </span>
                <code className="text-xs break-all text-subtle" dir="ltr">
                  {keyOf(line)}
                </code>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </section>
  );
}
