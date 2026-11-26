import { i18n, loadLanguage } from "./index";
import { LANGUAGE_CODES } from "./languages";
import en from "./locales/en.json";

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;
const PLACEHOLDER = /\{\{[^}]+\}\}/g;

/* Every string by its dotted path, e.g. "game.bulls_one" → "{{count}} bull". */
function flatten(node: unknown, path = ""): [string, string][] {
  if (typeof node === "string") return [[path, node]];

  return Object.entries(node as Record<string, unknown>).flatMap(
    ([key, child]) => flatten(child, path ? `${path}.${key}` : key),
  );
}

/* Languages differ in plural forms, so "bulls_one" and "bulls_other" count as "bulls". */
function withoutPluralSuffix(path: string) {
  return path.replace(PLURAL_SUFFIX, "");
}

/* The placeholders the English strings for a key use, across its plural forms. */
const englishPlaceholders = new Map<string, Set<string>>();
for (const [path, text] of flatten(en)) {
  const key = withoutPluralSuffix(path);
  const known = englishPlaceholders.get(key) ?? new Set<string>();
  for (const placeholder of text.match(PLACEHOLDER) ?? []) {
    known.add(placeholder);
  }
  englishPlaceholders.set(key, known);
}

const translatedLanguages = LANGUAGE_CODES.filter((code) => code !== "en");

describe.each(translatedLanguages)("%s translation", (language) => {
  let strings: [string, string][];

  beforeAll(async () => {
    await loadLanguage(language);
    strings = flatten(i18n.getResourceBundle(language, "translation"));
  });

  /* A key missing here shows up as English in the middle of a translated page. */
  test("has the same keys as English, give or take plural forms", () => {
    const keys = new Set(strings.map(([path]) => withoutPluralSuffix(path)));

    expect({
      missing: [...englishPlaceholders.keys()].filter((key) => !keys.has(key)),
      unknown: [...keys].filter((key) => !englishPlaceholders.has(key)),
    }).toEqual({ missing: [], unknown: [] });
  });

  /* i18next only falls back to the `_other` form when a count has no form of its own. */
  test("gives every plural key an _other form", () => {
    const paths = new Set(strings.map(([path]) => path));
    const pluralKeys = new Set(
      strings
        .filter(([path]) => PLURAL_SUFFIX.test(path))
        .map(([path]) => withoutPluralSuffix(path)),
    );

    expect([...pluralKeys].filter((key) => !paths.has(`${key}_other`))).toEqual(
      [],
    );
  });

  /* A mistyped placeholder reaches the player as a literal "{{colour}}". */
  test("only uses placeholders the English string has", () => {
    const mistyped = strings.filter(([path, text]) => {
      const known = englishPlaceholders.get(withoutPluralSuffix(path));

      return (text.match(PLACEHOLDER) ?? []).some(
        (placeholder) => !known?.has(placeholder),
      );
    });

    expect(mistyped).toEqual([]);
  });
});
