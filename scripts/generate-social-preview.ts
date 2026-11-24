/*
 * Regenerates public/social-preview.png, the 1280×640 card that link shares
 * show (og:image / twitter:image in index.html), from the real app: it starts
 * Vite, plays a few guesses of an Easy game in headless Chromium, screenshots
 * the app column at desktop size and lays it into the card beside the title.
 * Run it after a visible change to the header, board or shield.
 *
 *   pnpm social-preview
 *
 * The secret is random, so each run shows different colours, but the clues
 * always tell the same story: five guesses getting closer, row 6 waiting.
 */
import { chromium, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { createServer } from "vite";
import {
  BULL_PATHS,
  BULL_STROKE_WIDTH,
  BULL_VIEWBOX,
  TILE_COLOR,
} from "../src/components/icons/bullMark.ts";
import {
  DIFFICULTIES,
  paletteFor,
  scoreGuess,
  type Color,
} from "../src/features/game/logic.ts";

const OUTPUT = "public/social-preview.png";
const CARD = { width: 1280, height: 640 };

/* Where the app sits in the card, and how much of it shows. */
const APP_FRAME = { x: 700, y: 44, width: 505 };
const APP_HEIGHT = CARD.height - APP_FRAME.y;

/* Desktop size (the `desk` variant needs ≥1024×800) for the larger pegs. */
const APP_VIEWPORT = { width: 1280, height: 1000 };

const DIFFICULTY = "easy";

/* Bulls and cows per guess, closing in on the code; none of them wins. */
const CLUE_STORY = [
  { black: 0, white: 2 },
  { black: 1, white: 1 },
  { black: 1, white: 2 },
  { black: 2, white: 1 },
  { black: 2, white: 2 },
];

/* Small seeded PRNG (mulberry32), so the guesses vary but runs are stable. */
function createRandom(seed: number) {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/* Every guess the difficulty allows: no repeats on Easy. */
function listGuesses(palette: Color[], length: number): Color[][] {
  if (length === 0) return [[]];

  const guesses: Color[][] = [];
  for (const color of palette) {
    const rest = palette.filter((other) => other !== color);
    for (const tail of listGuesses(rest, length - 1)) {
      guesses.push([color, ...tail]);
    }
  }

  return guesses;
}

/* One guess per clue in CLUE_STORY, picked from a shuffled list for variety. */
function pickGuesses(secret: Color[]): Color[][] {
  const { pegs } = DIFFICULTIES[DIFFICULTY];
  const random = createRandom(7);
  const candidates = listGuesses(paletteFor(DIFFICULTY), pegs)
    .map((guess) => ({ guess, order: random() }))
    .toSorted((a, b) => a.order - b.order)
    .map(({ guess }) => guess);

  return CLUE_STORY.map(({ black, white }) => {
    const match = candidates.find((guess) => {
      const feedback = scoreGuess(secret, guess);

      return feedback.black === black && feedback.white === white;
    });
    if (!match) throw new Error(`No guess scores ${black}B ${white}W`);

    return match;
  });
}

async function playGuesses(page: Page) {
  await page.getByRole("radio", { name: /^Easy/ }).check();

  const palette = paletteFor(DIFFICULTY);
  // The game is saved on its first event, with its secret (as in e2e).
  await page.keyboard.press("1");
  await page.keyboard.press("Backspace");
  const secret = await page.evaluate<Color[]>(
    () => JSON.parse(localStorage.getItem("app:game") ?? "{}").context.secret,
  );

  for (const guess of pickGuesses(secret)) {
    for (const color of guess) {
      await page.keyboard.press(String(palette.indexOf(color) + 1));
    }
    await page.keyboard.press("Enter");
  }
}

async function captureApp(page: Page): Promise<Buffer> {
  await playGuesses(page);
  await page.mouse.move(0, 0);
  await page.evaluate(() => window.scrollTo(0, 0));

  const column = page.locator("header").locator("..");
  const box = await column.boundingBox();
  if (!box) throw new Error("App column not found");

  const scale = APP_FRAME.width / box.width;

  return page.screenshot({
    clip: {
      x: box.x,
      y: box.y,
      width: box.width,
      height: APP_HEIGHT / scale,
    },
  });
}

function bullSvg(size: number): string {
  const paths = BULL_PATHS.map((d) => `<path d="${d}"/>`).join("");

  return `<svg width="${size}" height="${size}" viewBox="${BULL_VIEWBOX}" fill="none" stroke="#f1f5f9" stroke-width="${BULL_STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

/* The card's own copy: marketing for link previews, English only. */
function cardHtml(appImage: Buffer): string {
  const chips = [
    "Mastermind-style",
    "3 difficulties",
    "7 languages",
    "Free · no sign-up",
  ]
    .map((chip) => `<span class="chip">${chip}</span>`)
    .join("");

  return `<!doctype html>
<html><head><style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: ${CARD.width}px; height: ${CARD.height}px; overflow: hidden;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    color: #f1f5f9;
    background:
      radial-gradient(600px 400px at 10% 0%, rgb(34 211 238 / 0.10), transparent 70%),
      radial-gradient(500px 300px at 15% 100%, rgb(168 85 247 / 0.12), transparent 70%),
      linear-gradient(rgb(34 211 238 / 0.06) 1px, transparent 1px) 0 0 / 48px 48px,
      linear-gradient(90deg, rgb(34 211 238 / 0.06) 1px, transparent 1px) 0 0 / 48px 48px,
      #0b1120;
    position: relative;
  }
  .text { position: absolute; left: 84px; top: 132px; width: 580px; }
  .brand { display: flex; align-items: center; gap: 20px; }
  .tile {
    width: 84px; height: 84px; border-radius: 20px; background: ${TILE_COLOR};
    display: grid; place-items: center;
    border: 1px solid rgb(148 163 184 / 0.25);
    box-shadow: 0 0 32px rgb(34 211 238 / 0.25);
  }
  h1 { font-size: 76px; font-weight: 800; letter-spacing: -0.035em; line-height: 1; }
  .tagline { margin-top: 36px; font-size: 36px; font-weight: 700; line-height: 1.28; letter-spacing: -0.01em; }
  .accent { color: #22d3ee; }
  .legend { margin-top: 28px; display: flex; gap: 28px; font-size: 20px; color: #cbd5e1; }
  .legend span { display: flex; align-items: center; gap: 10px; }
  .peg { width: 22px; height: 22px; border-radius: 50%; }
  .bull { background: radial-gradient(circle at 35% 30%, #64748b, #0f172a 70%); box-shadow: 0 0 0 1px rgb(255 255 255 / 0.3); }
  .cow { background: radial-gradient(circle at 35% 30%, #fff, #cbd5e1 75%); }
  .chips { margin-top: 26px; display: flex; flex-wrap: wrap; gap: 8px; }
  .chip {
    padding: 6px 14px; border-radius: 999px; font-size: 16px; color: #e2e8f0;
    background: rgb(30 41 59 / 0.7); border: 1px solid rgb(71 85 105 / 0.6);
  }
  .url { margin-top: 30px; font-size: 24px; font-weight: 700; color: #22d3ee; }
  .app {
    position: absolute; left: ${APP_FRAME.x}px; top: ${APP_FRAME.y}px;
    width: ${APP_FRAME.width}px; height: ${APP_HEIGHT}px; overflow: hidden;
    border-radius: 16px 16px 0 0; border: 1px solid rgb(71 85 105 / 0.5);
    border-bottom: 0; box-shadow: 0 24px 64px rgb(0 0 0 / 0.5);
  }
  .app img { display: block; width: 100%; }
</style></head><body>
  <div class="text">
    <div class="brand"><div class="tile">${bullSvg(56)}</div><h1>Tyr &amp; Ko</h1></div>
    <p class="tagline">Crack the secret <span class="accent">colour code</span><br>before you run out of guesses.</p>
    <div class="legend"><span><i class="peg bull"></i>Bull: right spot</span><span><i class="peg cow"></i>Cow: wrong spot</span></div>
    <div class="chips">${chips}</div>
    <p class="url">tyrko.app</p>
  </div>
  <div class="app"><img src="data:image/png;base64,${appImage.toString("base64")}"></div>
</body></html>`;
}

const server = await createServer({
  logLevel: "error",
  server: { port: 5199, strictPort: false },
});
await server.listen();
const url = server.resolvedUrls?.local[0];
const browser = await chromium.launch();

try {
  if (!url) throw new Error("Vite didn't report a URL");

  /*
   * Reduced motion: every animation shows its end state, so no peg is caught
   * mid-drop and the header bull isn't caught mid-blink.
   */
  const appPage = await browser.newPage({
    viewport: APP_VIEWPORT,
    deviceScaleFactor: 2,
    locale: "en-US",
    reducedMotion: "reduce",
  });
  await appPage.goto(url);
  const appImage = await captureApp(appPage);

  const cardPage = await browser.newPage({ viewport: CARD });
  await cardPage.setContent(cardHtml(appImage));
  await cardPage.evaluate(() => document.fonts.ready);
  writeFileSync(OUTPUT, await cardPage.screenshot());
  console.log(`Wrote ${OUTPUT}`);
} finally {
  await browser.close();
  await server.close();
}
