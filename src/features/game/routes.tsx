import { paths } from '@/app/paths'
import type { RouteObject } from 'react-router'
import { Play } from './pages/Play'

export const gameRoutes: RouteObject[] = [
  { path: paths.play, element: <Play /> },
]
