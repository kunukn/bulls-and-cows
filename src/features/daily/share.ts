import {
  consistentCodes,
  isScoredLike,
  type Difficulty,
  type Feedback,
  type ScoredRow,
} from "@/features/game/logic";

export const SHARE_NETWORKS = ["x", "threads", "bluesky"] as const;

export type ShareNetwork = (typeof SHARE_NETWORKS)[number];

/*
 * `streak` goes before the days won in a row; `lucky` and `veryLucky` mark
 * a lucky win. Null writes the translated word instead.
 */
type ShareSymbols = {
  bull: string;
  cow: string;
  miss: string;
  streak: string | null;
  lucky: string | null;
  veryLucky: string | null;
};

// Emoji are drawn one width apart, so the rows line up as a grid.
const EMOJI_SYMBOLS: ShareSymbols = {
  bull: "⚫",
  cow: "⚪",
  miss: "◽",
  streak: "🔥",
  lucky: "🍀",
  veryLucky: "🦄",
};

/*
 * Threads' compose link turns every emoji into "�" (0012). These text
 * shapes come through, and are one width in its font so the rows still line
 * up; the dotted and small circles aren't.
 */
const TEXT_SYMBOLS: ShareSymbols = {
  bull: "●",
  cow: "◎",
  miss: "○",
  streak: null,
  lucky: null,
  veryLucky: null,
};

const NETWORK_SYMBOLS: Partial<Record<ShareNetwork, ShareSymbols>> = {
  threads: TEXT_SYMBOLS,
};

export type ShareInput = {
  /* First line, e.g. "Tyr & Ko · Daily code #18 · 4/10". */
  heading: string;
  /*
   * Feedback only, never the pegs: a shared result mustn't give the code
   * away (0012).
   */
  guesses: readonly Feedback[];
  // Codes still possible after each guess, from countCodesLeft.
  codesLeft: readonly number[];
  pegs: number;
  // Days won in a row; added to the heading when there is one.
  streak: number;
  // The translated word for it, e.g. "Streak", where emoji can't go.
  streakLabel: string;
  /*
   * The translated word for a lucky win of either kind, e.g. "Lucky", where
   * emoji can't go.
   */
  luckyLabel: string;
  url: string;
  // The site the text is for; left out for the share sheet and clipboard.
  network?: ShareNetwork;
};

/*
 * How many codes still fit the pins after each guess (0012). It follows from
 * the pins alone, so sharing it gives nothing away that the circles don't.
 */
export function countCodesLeft(
  difficulty: Difficulty,
  guesses: readonly ScoredRow[],
): number[] {
  let codes = consistentCodes(difficulty, []);

  return guesses.map((guess) => {
    codes = codes.filter((code) => isScoredLike(code, guess));

    return codes.length;
  });
}

/*
 * Codes still fitting the pins before the winning guess (0012). From 5 its
 * chance was 1 in 5 or worse, about 1 win in 9; from 25, 1 in 25 or worse,
 * about 1 win in 50.
 */
const LUCKY_MIN_CODES = 5;
const VERY_LUCKY_MIN_CODES = 25;

/*
 * The mark after a winning row, or null when the win was worked out. Every
 * code fits before the first guess, so a win there is very lucky.
 */
function luckMark(
  codesBefore: number,
  symbols: ShareSymbols,
  luckyLabel: string,
): string | null {
  if (codesBefore >= VERY_LUCKY_MIN_CODES)
    return symbols.veryLucky ?? luckyLabel;

  if (codesBefore >= LUCKY_MIN_CODES) return symbols.lucky ?? luckyLabel;

  return null;
}

/*
 * One line per guess: bulls, then cows, then misses. The feedback pegs say
 * how many, not which slot, so the line is sorted the way the board shows
 * them rather than laid out per slot like a Wordle grid. Then the codes left,
 * except on the winning row, where it's always 1; a lucky win gets a clover
 * or a unicorn there instead. No arrow before the count: these lines have no
 * letters to set their direction, and an arrow wouldn't mirror in Arabic.
 */
export function shareText({
  heading,
  guesses,
  codesLeft,
  pegs,
  streak,
  streakLabel,
  luckyLabel,
  url,
  network,
}: ShareInput): string {
  const symbols = (network && NETWORK_SYMBOLS[network]) ?? EMOJI_SYMBOLS;
  const { bull, cow, miss } = symbols;
  const streakText = `${symbols.streak ?? `${streakLabel} `}${streak}`;
  const fullHeading = streak > 0 ? `${heading} · ${streakText}` : heading;
  const lines = guesses.map(({ black, white }, index) => {
    const circles =
      bull.repeat(black) +
      cow.repeat(white) +
      miss.repeat(pegs - black - white);
    if (black === pegs) {
      const before = index === 0 ? Infinity : (codesLeft[index - 1] ?? 0);
      const mark = luckMark(before, symbols, luckyLabel);

      return mark === null ? circles : `${circles} ${mark}`;
    }

    const left = codesLeft[index];

    return left === undefined ? circles : `${circles} ${left}`;
  });

  return [fullHeading, "", ...lines, "", url].join("\n");
}

/* Each site's documented "compose a post" link; the player still confirms. */
const COMPOSE_URLS: Record<ShareNetwork, string> = {
  x: "https://x.com/intent/post",
  threads: "https://www.threads.com/intent/post",
  bluesky: "https://bsky.app/intent/compose",
};

/*
 * A link that opens the site's post box with the whole result filled in.
 * encodeURIComponent, not URLSearchParams: the latter writes spaces as "+",
 * which not every site's composer turns back into a space.
 */
export function composeUrl(network: ShareNetwork, text: string): string {
  return `${COMPOSE_URLS[network]}?text=${encodeURIComponent(text)}`;
}
