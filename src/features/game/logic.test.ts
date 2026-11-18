import {
  DIFFICULTIES,
  generateSecret,
  paletteFor,
  scoreGuess,
  type Color,
} from './logic'

const codeOf = (letters: string): Color[] => {
  const map: Record<string, Color> = {
    R: 'red',
    B: 'blue',
    G: 'green',
    Y: 'yellow',
    P: 'purple',
    O: 'orange',
  }

  return [...letters].map((letter) => map[letter])
}

describe('scoreGuess', () => {
  it.each([
    ['RGBY', 'RGBY', 4, 0],
    ['RGBY', 'YBGR', 0, 4],
    ['RGBY', 'POPO', 0, 0],
    ['RRGB', 'RRRR', 2, 0],
    ['RRGB', 'GRRY', 1, 2],
    ['RGBY', 'RRRR', 1, 0],
    ['RRBB', 'BBRR', 0, 4],
    ['RGGB', 'GGRR', 1, 2],
  ])(
    'secret %s, guess %s → %i black %i white',
    (secret, guess, black, white) => {
      expect(scoreGuess(codeOf(secret), codeOf(guess))).toEqual({
        black,
        white,
      })
    },
  )
})

describe('generateSecret', () => {
  it('uses the configured length and palette', () => {
    const secret = generateSecret('hard')
    const palette = paletteFor('hard')

    expect(secret).toHaveLength(DIFFICULTIES.hard.pegs)
    secret.forEach((color) => expect(palette).toContain(color))
  })

  it('never repeats colours on easy', () => {
    for (let run = 0; run < 50; run++) {
      const secret = generateSecret('easy')

      expect(new Set(secret).size).toBe(secret.length)
    }
  })

  it('is deterministic with an injected RNG', () => {
    expect(generateSecret('classic', () => 0)).toEqual(codeOf('RRRR'))
    expect(generateSecret('easy', () => 0)).toEqual(codeOf('RBGY'))
  })
})
