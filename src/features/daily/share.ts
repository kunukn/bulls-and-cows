import type { Feedback } from "@/features/game/logic";

const BULL = "⚫";
const COW = "⚪";
const MISS = "◽";

type ShareInput = {
  /* First line, e.g. "Tyr & Ko · Daily code #18 · 4/10". */
  heading: string;
  /*
   * Feedback only, never the pegs: a shared result mustn't give the code
   * away (0012).
   */
  guesses: readonly Feedback[];
  pegs: number;
  url: string;
};

/*
 * One line per guess: bulls, then cows, then misses. The feedback pegs say
 * how many, not which slot, so the line is sorted the way the board shows
 * them rather than laid out per slot like a Wordle grid.
 */
export function shareText({ heading, guesses, pegs, url }: ShareInput): string {
  const lines = guesses.map(
    ({ black, white }) =>
      BULL.repeat(black) +
      COW.repeat(white) +
      MISS.repeat(pegs - black - white),
  );

  return [heading, "", ...lines, "", url].join("\n");
}

export const SHARE_NETWORKS = ["x", "threads", "bluesky"] as const;

export type ShareNetwork = (typeof SHARE_NETWORKS)[number];

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
