import { paths } from "@/app/paths";
import { leaveForMainSite } from "@/features/daily/routes";
import { useDailyResults } from "@/features/daily/store";
import { useSettings } from "@/features/game/store/settings";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { DailyLink } from "./DailyLink";

const MAIN_SITE_DAILY = "https://www.tyrko.app/daily";

function renderLink() {
  render(
    <MemoryRouter>
      <DailyLink />
    </MemoryRouter>,
  );

  return screen.getByRole("link", { name: /Daily code/ });
}

beforeEach(() => {
  localStorage.clear();
  useSettings.setState(useSettings.getInitialState(), true);
  useDailyResults.setState(useDailyResults.getInitialState(), true);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("daily code on the main site", () => {
  it("opens this site's daily page", () => {
    const replaceLocation = vi.fn<(url: string) => void>();
    leaveForMainSite(replaceLocation);

    expect(renderLink()).toHaveAttribute("href", paths.daily);
    expect(replaceLocation).not.toHaveBeenCalled();
  });
});

/* Each site keeps its own save: playing on both would be two attempts (0012). */
describe("daily code on a mirror site", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_DAILY_URL", MAIN_SITE_DAILY);
  });

  it("sends the player to the main site and names it", () => {
    const link = renderLink();

    expect(link).toHaveAttribute("href", MAIN_SITE_DAILY);
    expect(link).toHaveTextContent("www.tyrko.app");
  });

  it("leaves its own daily page for the main site", () => {
    const replaceLocation = vi.fn<(url: string) => void>();
    leaveForMainSite(replaceLocation);

    expect(replaceLocation).toHaveBeenCalledWith(MAIN_SITE_DAILY);
  });
});
