import { paths } from '@/app/paths'
import type { RouteObject } from 'react-router'
import { HighScores } from './pages/HighScores'

export const highScoreRoutes: RouteObject[] = [
  { path: paths.highScores, element: <HighScores /> },
]
