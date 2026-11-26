# Bugs

Out-of-scope bugs found during development. Newest at the bottom.

```text
2026-11-26
Component: Bengali (`bn`) number formatting — every `Intl` call given `i18n.language`, and i18next's `{{x, number}}` formatter (DailyLink, DailyHeader, DailyResultPanel, HighScores, BullBubble)
Expected: One numeral system on a Bengali page.
Actual: `Intl` formats `bn` with Bengali digits (`ডেইলি কোড #১,২৯৬`, dates, win rate), while plain `{{count}}` / `{{slot}}` / `{{pegs}}` values, the timer and literal numbers in `bn.json` are Western (`4`, `1977`), so both appear side by side. `hi` and `ar` are not affected: their `Intl` default is Western digits.
Repro: Settings → বাংলা, then compare the daily code number with the peg counts in the difficulty picker.
Workaround: none. Either pass `bn-u-nu-latn` to `Intl` for Bengali (Western digits everywhere), or switch the plain placeholders to `{{count, number}}` and translate the literals (Bengali digits everywhere).
```
