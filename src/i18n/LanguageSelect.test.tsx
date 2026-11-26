import { act, fireEvent, render, screen } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { i18n, loadLanguage } from "./index";
import { LANGUAGE_STORAGE_KEY, type Language } from "./languages";
import { LanguageSelect } from "./LanguageSelect";
import da from "./locales/da.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

/* The real loader, wrapped so a test can hold a language back or fail it. */
vi.mock("./index", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./index")>();

  return {
    ...actual,
    loadLanguage: vi.fn<typeof actual.loadLanguage>(actual.loadLanguage),
  };
});

const { loadLanguage: loadLanguageForReal } =
  await vi.importActual<typeof import("./index")>("./index");

/* Stands in for the rest of the page: one translated string. */
function PageText() {
  const { t } = useTranslation();

  return <p>{t("common.settings")}</p>;
}

function renderSelect() {
  render(
    <>
      <label htmlFor="language">{en.common.language}</label>
      <LanguageSelect id="language" />
      <PageText />
    </>,
  );

  return screen.getByRole<HTMLSelectElement>("combobox");
}

function pick(select: HTMLSelectElement, language: Language) {
  fireEvent.change(select, { target: { value: language } });
}

/* Makes the next load wait, like a slow connection, until `finish` is called. */
function holdNextLoad() {
  let finish = () => {};
  vi.mocked(loadLanguage).mockImplementationOnce(
    (language) =>
      new Promise<void>((resolve, reject) => {
        finish = () => loadLanguageForReal(language).then(resolve, reject);
      }),
  );

  return () => act(async () => finish());
}

beforeEach(async () => {
  localStorage.clear();
  await i18n.changeLanguage("en");
});

test("keeps the page in the current language until the picked one has loaded", async () => {
  const finishLoad = holdNextLoad();
  const select = renderSelect();

  pick(select, "da");

  expect(select).toHaveValue("da");
  expect(select).toHaveAttribute("aria-busy", "true");
  expect(screen.getByText(en.common.settings)).toBeVisible();

  await finishLoad();

  expect(await screen.findByText(da.common.settings)).toBeVisible();
  expect(select).toHaveAttribute("aria-busy", "false");
  expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('"da"');
});

test("says so and stays put when the picked language can't be loaded", async () => {
  vi.mocked(loadLanguage).mockRejectedValueOnce(new Error("offline"));
  const select = renderSelect();

  pick(select, "da");

  expect(await screen.findByRole("alert")).toHaveTextContent(
    en.common.languageLoadFailed,
  );
  expect(select).toHaveValue("en");
  expect(screen.getByText(en.common.settings)).toBeVisible();
  // Not saved: the next visit must not start by failing the same way.
  expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
});

test("a newer pick wins over an earlier one that loads later", async () => {
  const finishDanish = holdNextLoad();
  const select = renderSelect();

  pick(select, "da");
  pick(select, "fr");
  expect(await screen.findByText(fr.common.settings)).toBeVisible();

  await finishDanish();

  expect(screen.getByText(fr.common.settings)).toBeVisible();
  expect(select).toHaveValue("fr");
  expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('"fr"');
});
