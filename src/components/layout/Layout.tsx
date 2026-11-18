import { paths } from '@/app/paths'
import { cn } from '@/utils/cn'
import { NavLink, Outlet } from 'react-router'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-slate-700 text-white'
      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
  )

export function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4">
      <header className="flex items-center justify-between gap-2 py-4">
        <h1 className="text-lg font-bold tracking-tight">
          🐂 Bulls &amp; Cows
        </h1>
        <nav className="flex gap-1">
          <NavLink to={paths.play} end className={navLinkClass}>
            Play
          </NavLink>
          <NavLink to={paths.highScores} className={navLinkClass}>
            High scores
          </NavLink>
        </nav>
      </header>
      <main className="flex flex-1 flex-col pb-8">
        <Outlet />
      </main>
    </div>
  )
}
