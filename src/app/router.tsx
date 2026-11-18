import { Layout } from "@/components/layout/Layout";
import { GameMachineProvider } from "@/features/game/machine-context";
import { gameRoutes } from "@/features/game/routes";
import { highScoreRoutes } from "@/features/highscores/routes";
import { createHashRouter, Navigate } from "react-router";
import { paths } from "./paths";

/*
 * Hash router: GitHub Pages has no SPA fallback, so a reload on a path URL
 * would 404. The game provider wraps every page so an in-progress game
 * survives a visit to the high-score page.
 */
export const router = createHashRouter([
  {
    element: (
      <GameMachineProvider>
        <Layout />
      </GameMachineProvider>
    ),
    children: [
      ...gameRoutes,
      ...highScoreRoutes,
      { path: "*", element: <Navigate to={paths.play} replace /> },
    ],
  },
]);
