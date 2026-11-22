import { paths } from "@/app/paths";
import { BullLineText } from "@/components/layout/BullBubble";
import {
  LOST_KEYS,
  QUIP_KEYS,
  TIP_KEYS,
  WON_KEYS,
  type BullLine,
} from "@/features/game/bullLines";
import { isRowHint, type Hint } from "@/features/game/hints";
import { LANGUAGES } from "@/i18n/languages";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { SAMPLE_HINTS } from "./sampleHints";

/*
 * Developer page, unlinked: every line both bulls can say, in the active
 * language, rendered by the bubble's own component. Copy is English only on
 * purpose (see copilot-instructions.md). Switch language in Settings.
 */

type Group = {
  title: string;
  when: string;
  lines: BullLine[];
};

const toStatic = <Key extends Extract<BullLine, { kind: "static" }>["key"]>(
  keys: readonly Key[],
): BullLine[] => keys.map((key) => ({ kind: "static", key }));

const allHints: Hint[] = Object.values(SAMPLE_HINTS).flat();
const toHintLines = (hints: Hint[]): BullLine[] =>
  hints.map((hint) => ({ kind: "hint", hint }));

const HEADER_GROUPS: Group[] = [
  { title: "Quips", when: "Always", lines: toStatic(QUIP_KEYS) },
  { title: "After a win", when: "Play page · won", lines: toStatic(WON_KEYS) },
  {
    title: "After a loss",
    when: "Play page · lost",
    lines: toStatic(LOST_KEYS),
  },
];

const SHIELD_GROUPS: Group[] = [
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

function keyOf(line: BullLine): string {
  if (line.kind === "static") return line.key;

  if (line.kind === "noClues") return "bull.noClues";

  return `bull.hints.${line.hint.kind}`;
}

export function BullLinesPage() {
  const { t, i18n } = useTranslation();
  const language =
    LANGUAGES.find(({ code }) => code === i18n.resolvedLanguage)?.label ??
    i18n.resolvedLanguage;
  const lineCount = [...HEADER_GROUPS, ...SHIELD_GROUPS].reduce(
    (total, group) => total + group.lines.length,
    0,
  );

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
          {lineCount} lines in {language}. Change the language in Settings.
        </p>
      </div>

      <Bull
        title="Header bull"
        labels={[
          ["Button", t("bull.button")],
          ["Bubble", t("bull.says")],
        ]}
        groups={HEADER_GROUPS}
      />
      <Bull
        title="Shield bull"
        labels={[
          ["Button", t("bull.hintButton")],
          ["Button, new fact", t("bull.hintButtonNew")],
          ["Bubble", t("bull.says")],
        ]}
        groups={SHIELD_GROUPS}
      />
    </div>
  );
}

type BullProps = {
  title: string;
  labels: [string, string][];
  groups: Group[];
};

function Bull({ title, labels, groups }: BullProps) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-xl font-bold text-heading">{title}</h3>
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
            <h4 className="font-semibold text-heading">
              {group.title}{" "}
              <span className="text-sm font-normal text-subtle tabular-nums">
                {group.lines.length}
              </span>
            </h4>
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
