import { paths } from "@/app/paths";
import { useDailyResults } from "@/features/daily/store";
import { useSettings } from "@/features/game/store/settings";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { DailyLink } from "./DailyLink";

beforeEach(() => {
  localStorage.clear();
  useSettings.setState(useSettings.getInitialState(), true);
  useDailyResults.setState(useDailyResults.getInitialState(), true);
});

/* Every site hosts its own daily code, mirrors and embeds too (0012). */
it("opens this site's daily page", () => {
  render(
    <MemoryRouter>
      <DailyLink />
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: /Daily code/ })).toHaveAttribute(
    "href",
    paths.daily,
  );
});
