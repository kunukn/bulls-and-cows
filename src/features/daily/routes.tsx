import { paths } from "@/app/paths";
import type { RouteObject } from "react-router";
import { Daily } from "./pages/Daily";

export const dailyRoutes: RouteObject[] = [
  {
    path: paths.daily,
    element: <Daily />,
  },
];
