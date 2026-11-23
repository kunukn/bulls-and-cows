import type { Feedback } from "@/features/game/logic";

export const SHARE_NETWORKS = ["x", "threads", "bluesky"] as const;

export type ShareNetwork = (typeof SHARE_NETWORKS)[number];

type PegSymbols = { bull: string; cow: string; miss: string };

// Emoji are drawn one width apart, so the rows line up as a grid.
const EMOJI_SYMBOLS: PegSymbols = { bull: "⚫", cow: "⚪", miss: "◽" };

/*
 * Threads' compose link turns every emoji into "�" (0012). These text
 * shapes come through, and are one width in its font so the rows still line
 * up; the dotted and small circles aren't.
 */
const TEXT_SYMBOLS: PegSymbols = { bull: "●", cow: "◎", miss: "○" };

const NETWORK_SYMBOLS: Partial<Record<ShareNetwork, PegSymbols>> = {
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
  pegs: number;
  url: string;
  // The site the text is for; left out for the share sheet and clipboard.
  network?: ShareNetwork;
};

/*
 * One line per guess: bulls, then cows, then misses. The feedback pegs say
 * how many, not which slot, so the line is sorted the way the board shows
 * them rather than laid out per slot like a Wordle grid.
 */
export function shareText({
  heading,
  guesses,
  pegs,
  url,
  network,
}: ShareInput): string {
  const { bull, cow, miss } =
    (network && NETWORK_SYMBOLS[network]) ?? EMOJI_SYMBOLS;
  const lines = guesses.map(
    ({ black, white }) =>
      bull.repeat(black) +
      cow.repeat(white) +
      miss.repeat(pegs - black - white),
  );

  return [heading, "", ...lines, "", url].join("\n");
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
