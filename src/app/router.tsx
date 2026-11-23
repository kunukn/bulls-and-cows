import { Layout } from "@/components/layout/Layout";
import { dailyRoutes } from "@/features/daily/routes";
import { GameMachineProvider } from "@/features/game/machine-context";
import { gameRoutes } from "@/features/game/routes";
import { highScoreRoutes } from "@/features/highscores/routes";
import {
  createBrowserRouter,
  createHashRouter,
  Navigate,
  type RouteObject,
} from "react-router";
import { paths } from "./paths";

/*
 * The game provider wraps every page so an in-progress game survives a visit
 * to the high-score page.
 */
const routes: RouteObject[] = [
  {
    element: (
      <GameMachineProvider>
        <Layout />
      </GameMachineProvider>
    ),
    children: [
      ...gameRoutes,
      ...dailyRoutes,
      ...highScoreRoutes,
      /*
       * Debug pages are lazy, so players never download their code. On a
       * direct visit, the empty fallback fills the gap while that code loads.
       */
      {
        path: paths.debug,
        HydrateFallback: () => null,
        lazy: async () => {
          const { DebugPage } = await import("@/debug/DebugPage");

          return { Component: DebugPage };
        },
      },
      {
        path: paths.debugBullLines,
        HydrateFallback: () => null,
        lazy: async () => {
          const { BullLinesPage } = await import("@/debug/BullLinesPage");

          return { Component: BullLinesPage };
        },
      },
      { path: "*", element: <Navigate to={paths.play} replace /> },
    ],
  },
];

/*
 * History routing (`/highscores`) by default: Vercel (vercel.json rewrite)
 * and the Vite dev server answer every path with index.html. GitHub Pages has
 * no such fallback, so a reload on a path would 404; deploy.yml sets
 * VITE_USE_HISTORY_ROUTING=0 to build the mirror with hash routing instead.
 */
const isHistoryRouting = import.meta.env.VITE_USE_HISTORY_ROUTING === "1";

export const router = isHistoryRouting
  ? createBrowserRouter(routes, { basename: import.meta.env.BASE_URL })
  : createHashRouter(routes);
