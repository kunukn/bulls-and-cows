import { Direction } from "radix-ui";
import { useTranslation } from "react-i18next";
import { RouterProvider } from "react-router";
import { getDirection } from "@/i18n/languages";
import { router } from "./router";

export function App() {
  const { i18n } = useTranslation();

  /*
   * Radix reads direction from this provider, not from <html dir>: without it
   * popover alignment and keyboard navigation stay left-to-right in Arabic.
   */
  return (
    <Direction.Provider dir={getDirection(i18n.language)}>
      <RouterProvider router={router} />
    </Direction.Provider>
  );
}
