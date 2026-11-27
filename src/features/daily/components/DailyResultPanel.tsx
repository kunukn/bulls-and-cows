import { paths } from "@/app/paths";
import {
  DAILY_DIFFICULTY,
  dailyNumber,
  msUntilNextDaily,
  nextDailyEvent,
  SHARE_DAILY_URL,
} from "@/features/daily/daily";
import { BlueskyIcon } from "@/components/icons/BlueskyIcon";
import { ThreadsIcon } from "@/components/icons/ThreadsIcon";
import { XIcon } from "@/components/icons/XIcon";
import {
  composeUrl,
  countCodesLeft,
  shareText,
  type ShareInput,
  type ShareNetwork,
} from "@/features/daily/share";
import { summarize, useShownDailyResults } from "@/features/daily/store";
import { OutcomeMessage } from "@/features/game/components/ResultPanel";
import { DIFFICULTIES } from "@/features/game/logic";
import { elapsedMs } from "@/features/game/machine";
import {
  useGameActorRef,
  useGameSelector,
} from "@/features/game/machine-context";
import { useSettings } from "@/features/game/store/settings";
import { getIntlLocale } from "@/i18n/languages";
import { ACTION_BUTTON_CLASS } from "@/components/actionButton";
import { cn } from "@/utils/cn";
import { formatCountdown } from "@/utils/format";
import {
  Award,
  CalendarCheck,
  CalendarDays,
  Check,
  Flame,
  Gamepad2,
  Hourglass,
  Share2,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

const SECONDARY_BUTTON_CLASS = cn(
  ACTION_BUTTON_CLASS,
  "bg-secondary px-3 py-2 text-sm font-semibold text-foreground hover:bg-control",
);

// How long the button reads "Copied" before it goes back to "Share".
const COPIED_MS = 2000;

type ShareButtonProps = {
  text: string;
  isMinimalText: boolean;
};

/*
 * The device's share sheet where there is one (phones, most desktops), the
 * clipboard otherwise. Hidden when the browser offers neither, e.g. on a
 * page served over plain http.
 */
function ShareButton({ text, isMinimalText }: ShareButtonProps) {
  const { t } = useTranslation();
  const [isCopied, setCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return;

    const id = setTimeout(() => setCopied(false), COPIED_MS);

    return () => clearTimeout(id);
  }, [isCopied]);

  if (!("share" in navigator) && !("clipboard" in navigator)) return null;

  async function handleShare() {
    if ("share" in navigator) {
      try {
        await navigator.share({ text });

        return;
      } catch (error) {
        // The player closed the share sheet; that's an answer, not a failure.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // The clipboard was refused too; there's nowhere left to put the text.
    }
  }

  const label = isCopied ? t("daily.copied") : t("daily.share");
  const Icon = isCopied ? Check : Share2;

  return (
    <>
      <button
        type="button"
        onClick={() => void handleShare()}
        title={isMinimalText ? label : undefined}
        className={SECONDARY_BUTTON_CLASS}
      >
        {isMinimalText && <Icon aria-hidden className="size-5" />}
        <span className={isMinimalText ? "sr-only" : undefined}>{label}</span>
      </button>
      <span aria-live="polite" className="sr-only">
        {isCopied ? t("daily.copied") : ""}
      </span>
    </>
  );
}

type PostSite = {
  network: ShareNetwork;
  // Brand names stay as they are in every language.
  name: string;
  icon: ComponentType<{ className?: string }>;
};

const POST_SITES: PostSite[] = [
  { network: "x", name: "X", icon: XIcon },
  { network: "threads", name: "Threads", icon: ThreadsIcon },
  { network: "bluesky", name: "Bluesky", icon: BlueskyIcon },
];

type PostLinksProps = {
  // Each site gets its own text: Threads can't take emoji (0012).
  shareInput: ShareInput;
  isMinimalText: boolean;
};

/*
 * One tap to a filled-in post on the sites players share to most (0012).
 * Plain links, so they work without a share sheet or clipboard, and open the
 * site's app on phones where it's installed.
 */
function PostLinks({ shareInput, isMinimalText }: PostLinksProps) {
  const { t } = useTranslation();

  return (
    <div className="grid w-full grid-cols-3 gap-2">
      {POST_SITES.map(({ network, name, icon: Icon }) => {
        const label = t("daily.postOn", { network: name });

        return (
          <a
            key={network}
            href={composeUrl(network, shareText({ ...shareInput, network }))}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={isMinimalText ? label : undefined}
            className={SECONDARY_BUTTON_CLASS}
          >
            <Icon className="size-4 shrink-0" />
            <span className={isMinimalText ? "sr-only" : undefined}>
              {name}
            </span>
          </a>
        );
      })}
    </div>
  );
}

type StatProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  isMinimalText: boolean;
};

/* One number with its name; minimal text swaps the name for an icon. */
function Stat({ label, value, icon: Icon, isMinimalText }: StatProps) {
  return (
    // Reversed for the eye, number first; justify-end keeps the numbers level.
    <div className="flex flex-col-reverse items-center justify-end gap-0.5">
      <dt
        title={isMinimalText ? label : undefined}
        className="text-xs leading-tight text-balance text-muted-foreground"
      >
        {isMinimalText && <Icon aria-hidden className="size-4" />}
        <span className={isMinimalText ? "sr-only" : undefined}>{label}</span>
      </dt>
      <dd className="text-xl leading-tight font-semibold tabular-nums">
        {value}
      </dd>
    </div>
  );
}

type DistributionProps = {
  /* Wins per guess count: index 0 is a win on the first guess. */
  distribution: number[];
  /* Guess count of the game on the board, when it was won. */
  highlightedGuesses: number | null;
  isMinimalText: boolean;
};

/* Column chart of wins by guess count; the game just won stands out. */
function Distribution({
  distribution,
  highlightedGuesses,
  isMinimalText,
}: DistributionProps) {
  const { t, i18n } = useTranslation();
  const numberFormat = new Intl.NumberFormat(getIntlLocale(i18n.language));
  const mostWins = Math.max(...distribution, 1);
  const caption = t("daily.distribution");

  return (
    <figure className="flex w-full flex-col gap-1">
      <figcaption
        className={isMinimalText ? "sr-only" : "text-xs text-muted-foreground"}
      >
        {caption}
      </figcaption>
      <ol
        aria-label={caption}
        title={isMinimalText ? caption : undefined}
        className="flex h-12 items-stretch"
      >
        {distribution.map((wins, index) => {
          const guesses = index + 1;
          const isHighlighted = guesses === highlightedGuesses;
          const reading = `${numberFormat.format(guesses)}: ${numberFormat.format(wins)}`;

          return (
            <li
              key={index}
              title={reading}
              className="flex flex-1 flex-col justify-end gap-0.5"
            >
              <span className="sr-only">{reading}</span>
              {/* An empty column keeps a sliver, so the row reads as a baseline. */}
              <span
                aria-hidden
                style={{ height: `${(wins / mostWins) * 100}%` }}
                className={cn(
                  "mx-1 min-h-0.5 rounded-t-sm",
                  isHighlighted ? "bg-foreground" : "bg-faint",
                )}
              />
              <span
                aria-hidden
                className={cn(
                  "text-[0.625rem] leading-none tabular-nums",
                  isHighlighted
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {numberFormat.format(guesses)}
              </span>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

/* Shown in place of the palette once the daily game is over (0012). */
export function DailyResultPanel() {
  const { t, i18n } = useTranslation();
  const actor = useGameActorRef();
  const isWon = useGameSelector((snapshot) => snapshot.matches("won"));
  const context = useGameSelector((snapshot) => snapshot.context);
  const results = useShownDailyResults();
  const isMinimalText = useSettings((state) => state.isMinimalText);
  const [now, setNow] = useState(() => new Date());
  /*
   * Expensive compute: filters all 1,296 codes per guess, and the panel
   * re-renders every second for the countdown.
   */
  const codesLeft = useMemo(
    () => countCodesLeft(DAILY_DIFFICULTY, context.guesses),
    [context.guesses],
  );

  // Drives the countdown, and notices midnight while the panel is open.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);

    return () => clearInterval(id);
  }, []);

  const today = dailyNumber(now);
  const isNextReady =
    context.dailyNumber !== null && today > context.dailyNumber;
  const summary = summarize(results, today);
  const guesses = context.guesses.length;
  const { pegs, maxGuesses } = DIFFICULTIES[DAILY_DIFFICULTY];
  const numberFormat = new Intl.NumberFormat(getIntlLocale(i18n.language));
  // "X" for a loss, as in other daily games; a loss has no guess count to show.
  const score = `${isWon ? numberFormat.format(guesses) : "X"}/${numberFormat.format(maxGuesses)}`;
  const shareInput: ShareInput = {
    heading: t("daily.shareHeading", {
      app: t("app.title"),
      number: context.dailyNumber ?? today,
      score,
    }),
    guesses: context.guesses,
    codesLeft,
    pegs,
    streak: summary.currentStreak,
    streakLabel: t("daily.streak"),
    url: SHARE_DAILY_URL,
  };
  const percentFormat = new Intl.NumberFormat(getIntlLocale(i18n.language), {
    style: "percent",
  });
  const winRate = summary.played === 0 ? 0 : summary.won / summary.played;
  const countdown = formatCountdown(msUntilNextDaily(now));
  // Icon-only buttons keep their name for screen readers and as a tooltip.
  const labelClass = isMinimalText ? "sr-only" : undefined;

  return (
    <section className="flex flex-col items-center gap-3 rounded-2xl bg-card p-4 text-center">
      {/* Only the outcome is announced; the countdown would talk every second. */}
      <div aria-live="polite">
        <OutcomeMessage
          isWon={isWon}
          hasGivenUp={!isWon && guesses < maxGuesses}
          guesses={guesses}
          elapsedMs={elapsedMs(context)}
          isMinimalText={isMinimalText}
        />
      </div>

      <dl className="grid w-full grid-cols-4 gap-2">
        <Stat
          label={t("daily.played")}
          value={numberFormat.format(summary.played)}
          icon={CalendarCheck}
          isMinimalText={isMinimalText}
        />
        <Stat
          label={t("daily.winRate")}
          value={percentFormat.format(winRate)}
          icon={Trophy}
          isMinimalText={isMinimalText}
        />
        <Stat
          label={t("daily.streak")}
          value={numberFormat.format(summary.currentStreak)}
          icon={Flame}
          isMinimalText={isMinimalText}
        />
        <Stat
          label={t("daily.bestStreak")}
          value={numberFormat.format(summary.bestStreak)}
          icon={Award}
          isMinimalText={isMinimalText}
        />
      </dl>

      <Distribution
        distribution={summary.distribution}
        highlightedGuesses={isWon ? guesses : null}
        isMinimalText={isMinimalText}
      />

      <PostLinks shareInput={shareInput} isMinimalText={isMinimalText} />

      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        {isNextReady ? (
          <button
            type="button"
            onClick={() => actor.send(nextDailyEvent(today))}
            title={isMinimalText ? t("daily.playToday") : undefined}
            className={cn(
              ACTION_BUTTON_CLASS,
              "bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500",
            )}
          >
            {isMinimalText && <CalendarDays aria-hidden className="size-5" />}
            <span className={labelClass}>{t("daily.playToday")}</span>
          </button>
        ) : (
          <p
            role="timer"
            title={
              isMinimalText ? t("daily.nextIn", { time: countdown }) : undefined
            }
            className="flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums"
          >
            {isMinimalText ? (
              <>
                <Hourglass aria-hidden className="size-4" />
                <span aria-hidden>{countdown}</span>
                <span className="sr-only">
                  {t("daily.nextIn", { time: countdown })}
                </span>
              </>
            ) : (
              t("daily.nextIn", { time: countdown })
            )}
          </p>
        )}
        <div className="ms-auto flex gap-2">
          <ShareButton
            text={shareText(shareInput)}
            isMinimalText={isMinimalText}
          />
          <Link
            to={paths.play}
            title={isMinimalText ? t("daily.practice") : undefined}
            className={SECONDARY_BUTTON_CLASS}
          >
            {isMinimalText && <Gamepad2 aria-hidden className="size-5" />}
            <span className={labelClass}>{t("daily.practice")}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
