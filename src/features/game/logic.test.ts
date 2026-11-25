import {
  consistentCodes,
  DIFFICULTIES,
  dodgeSecret,
  generateSecret,
  paletteFor,
  scoreGuess,
  type Color,
} from "./logic";

const codeOf = (letters: string): Color[] => {
  const map: Record<string, Color> = {
    R: "red",
    B: "blue",
    G: "green",
    Y: "yellow",
    P: "purple",
    O: "orange",
    C: "cyan",
  };

  return [...letters].map((letter) => map[letter]);
};

describe("scoreGuess", () => {
  it.each([
    ["RGBY", "RGBY", 4, 0],
    ["RGBY", "YBGR", 0, 4],
    ["RGBY", "POPO", 0, 0],
    ["RRGB", "RRRR", 2, 0],
    ["RRGB", "GRRY", 1, 2],
    ["RGBY", "RRRR", 1, 0],
    ["RRBB", "BBRR", 0, 4],
    ["RGGB", "GGRR", 1, 2],
  ])(
    "secret %s, guess %s → %i black %i white",
    (secret, guess, black, white) => {
      expect(scoreGuess(codeOf(secret), codeOf(guess))).toEqual({
        black,
        white,
      });
    },
  );
});

describe("paletteFor", () => {
  it("orders colours like a rainbow", () => {
    expect(paletteFor("classic")).toEqual([
      "red",
      "orange",
      "yellow",
      "green",
      "cyan",
      "purple",
    ]);
    expect(paletteFor("hard")).toEqual([
      "red",
      "orange",
      "yellow",
      "green",
      "cyan",
      "blue",
      "purple",
      "pink",
    ]);
  });

  it("leaves blue out of six-colour palettes", () => {
    expect(paletteFor("easy")).toEqual(paletteFor("classic"));
    expect(paletteFor("classic")).not.toContain("blue");
  });
});

describe("generateSecret", () => {
  it("uses the configured length and palette", () => {
    const secret = generateSecret("hard");
    const palette = paletteFor("hard");

    expect(secret).toHaveLength(DIFFICULTIES.hard.pegs);
    expect(palette).toEqual(expect.arrayContaining(secret));
  });

  it("never repeats colours on easy", () => {
    for (let run = 0; run < 50; run++) {
      const secret = generateSecret("easy");

      expect(new Set(secret).size).toBe(secret.length);
    }
  });

  it("is deterministic with an injected RNG", () => {
    expect(generateSecret("classic", () => 0)).toEqual(codeOf("RRRR"));
    expect(generateSecret("easy", () => 0)).toEqual(codeOf("ROYG"));
  });
});

describe("dodgeSecret", () => {
  const row = (pegs: string, secret: string) => ({
    pegs: codeOf(pegs),
    ...scoreGuess(codeOf(secret), codeOf(pegs)),
  });
  // Rules out yellow, orange, cyan and purple: only red/green codes are left.
  const redGreenOnly = ["YYYY", "OOOO", "CCCC", "PPPP"].map((pegs) =>
    row(pegs, "RRRR"),
  );

  it("answers with the pins that keep the most codes possible", () => {
    const dodged = dodgeSecret("classic", [], codeOf("ROCP"), codeOf("RORR"));

    // Of the 1,296 codes, 312 score 0 black / 2 white: the largest group.
    expect(scoreGuess(dodged, codeOf("ROCP"))).toEqual({ black: 0, white: 2 });
  });

  it("keeps the current code when it is in the largest group", () => {
    const dodged = dodgeSecret("classic", [], codeOf("ROCP"), codeOf("ORYY"));

    expect(dodged).toEqual(codeOf("ORYY"));
  });

  it("never contradicts the pins already shown", () => {
    const rows = [];
    let secret = codeOf("RRRR");
    for (const pegs of ["RROO", "YYGG", "CPRO", "GYOR", "OGYC"]) {
      secret = dodgeSecret("classic", rows, codeOf(pegs), secret);
      rows.push({ pegs: codeOf(pegs), ...scoreGuess(secret, codeOf(pegs)) });
    }

    expect(consistentCodes("classic", rows)).toContainEqual(secret);
  });

  it("does not give a win while another code is still possible", () => {
    // 16 red/green codes left; guessing red×4 gets 2 black (6 codes).
    const dodged = dodgeSecret(
      "classic",
      redGreenOnly,
      codeOf("RRRR"),
      codeOf("RRRR"),
    );

    expect(scoreGuess(dodged, codeOf("RRRR"))).toEqual({ black: 2, white: 0 });
  });

  it("switches away from the guessed code when a group of the same size exists", () => {
    // Only GRRR and RGRR are left; each group holds one code.
    const rows = [...redGreenOnly, row("RRRR", "GRRR"), row("GGRR", "GRRR")];
    expect(consistentCodes("classic", rows)).toHaveLength(2);

    const dodged = dodgeSecret("classic", rows, codeOf("GRRR"), codeOf("GRRR"));

    expect(dodged).toEqual(codeOf("RGRR"));
  });

  it("gives the win once the guess is the only code left", () => {
    const rows = [...redGreenOnly, row("GGGG", "RRRR")];

    const dodged = dodgeSecret("classic", rows, codeOf("RRRR"), codeOf("RRRR"));

    expect(dodged).toEqual(codeOf("RRRR"));
  });
});
