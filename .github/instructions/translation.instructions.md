---
applyTo: "src/i18n/locales/*.json"
---

# Translation instructions

All user-facing strings in `src/i18n/locales/*.json` should read as friendly, plain, everyday language — never bureaucratic, formal or technical. Assume the players may include children as well as adults.

Languages: English (`en.json`, the source of truth), Simplified Chinese (`zh.json`), Hindi (`hi.json`), Spanish (`es.json`), Arabic (`ar.json`), French (`fr.json`), Bengali (`bn.json`), Brazilian Portuguese (`pt.json`), Indonesian (`id.json`), German (`de.json`), Japanese (`ja.json`), Swahili (`sw.json`), Danish (`da.json`). Every key in `en.json` must exist in every file; `src/i18n/locales.test.ts` checks it.

## Tone rules

- **Plain words over technical compounds.** Prefer the everyday word a child would actually hear.
  - ❌ `Commence a new session`
  - ✅ `New game`
- **Use the casual "you" form** in languages that have one.
  - FR `tu` not `vous` (`Gagne une partie`, `Ton nom`)
  - DE `du` (`Gewinne ein Spiel`, `Dein Name`)
  - DA `du` (`Dit navn`)
  - ZH `你`, not `您`
  - HI `तुम` (`तुम्हारा नाम`), not `आप`
  - AR address the player directly in the singular (`اسمك`, `العب`)
  - ES `tú` (`Elige`, `Tu nombre`), not `usted`
  - PT `você` with plain imperatives (`Escolha`, `Seu nome`)
  - BN `তুমি` (`তোমার নাম`), not `আপনি`
  - ID `kamu` (`Namamu`), not `Anda`
  - JA plain, friendly forms (`〜しよう`, `〜してね`), no keigo
  - SW second person singular (`Jina lako`, `Chagua`)
- **Drop polite filler.** "Please", `Veuillez`, `Bitte`, `Venligst`, `请` — all out.
  - ❌ `Please enter your name`
  - ✅ `Your name`
- **No parenthetical plurals.** `guess(es)`, `Versuch(e)` read like form letters. Use i18next's `_one` / `_other` keys instead. Chinese, Japanese and Indonesian have no plural forms: only `_other`. Arabic uses all six: `_zero`, `_one`, `_two`, `_few`, `_many`, `_other`.
- **Keep game terms consistent.** Bull = right colour in the right spot, cow = right colour in the wrong spot. Use the same word for each everywhere in a file (DE Stier/Kuh, FR taureau/vache, DA tyr/ko, ZH 公牛/母牛, HI बैल/गाय, AR ثور/بقرة, ES toro/vaca, PT touro/vaca, BN ষাঁড়/গাভী, ID banteng/sapi, JA おうし/めうし, SW fahali/ng'ombe). The game name `Tyr & Ko` (`app.title`) is a brand and stays untranslated in every language, Danish included.
- **Keep it short.** Strings appear on buttons and in a 448px-wide layout; prefer the shorter of two equally clear phrasings.
- **Never rename i18n keys to fit copy.** Keys are referenced from code (and type-checked against `en.json`); only edit the string _values_. A key rename is a separate, code-touching change.

## Process

- When unsure about a language you don't speak natively, change only the lowest-risk items (plurals, dropping "please") and flag the file for native-speaker review. Don't guess.
- `es`, `pt`, `bn`, `id`, `ja` and `sw` were machine-translated and have not been read by a native speaker yet.
- After editing locale files, run `pnpm format` and `pnpm check`.
