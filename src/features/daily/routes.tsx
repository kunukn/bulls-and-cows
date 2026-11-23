import { paths } from "@/app/paths";
import type { RouteObject } from "react-router";
import { mainSiteDailyUrl } from "./daily";
import { Daily } from "./pages/Daily";

/*
 * On a mirror build the daily code isn't played here: an old link or a typed
 * URL leaves for the main site (0012). It replaces the history entry itself,
 * because the router's own redirect to another site adds one, and Back would
 * then bounce straight forward again.
 */
export function leaveForMainSite(
  replaceLocation = (url: string) => window.location.replace(url),
): null {
  const url = mainSiteDailyUrl();
  if (url) replaceLocation(url);

  return null;
}

/* Nothing to show on a mirror while the browser leaves. */
function DailyRoute() {
  return mainSiteDailyUrl() ? null : <Daily />;
}

export const dailyRoutes: RouteObject[] = [
  {
    path: paths.daily,
    loader: () => leaveForMainSite(),
    // The loader has no data to wait for, so there is nothing to show first.
    HydrateFallback: () => null,
    element: <DailyRoute />,
  },
];
