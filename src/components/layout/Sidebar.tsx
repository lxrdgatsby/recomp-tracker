import {
  Activity,
  Calendar,
  CircleHelp,
  Dumbbell,
  Home,
  LogOut,
  MessageSquare,
  Syringe,
  User,
} from 'lucide-react'
import type { ViewId } from '../../types'
import { BottomNav } from './BottomNav'
import { InstallAppButton } from './InstallAppButton'

const NAV: { id: ViewId; label: string; icon: typeof MessageSquare }[] = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'assistant', label: 'Assistant', icon: MessageSquare },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'peptides', label: 'Peptides', icon: Syringe },
  { id: 'plan', label: '90-Day Plan', icon: Calendar },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell },
  { id: 'progress', label: 'Progress', icon: Activity },
  { id: 'faqs', label: 'FAQs', icon: CircleHelp },
]

interface SidebarProps {
  active: ViewId
  onNavigate: (view: ViewId) => void
  onExport: () => void
  username?: string | null
  onSignOut?: () => void
}

export function Sidebar({
  active,
  onNavigate,
  onExport,
  username,
  onSignOut,
}: SidebarProps) {
  return (
    <>
      <aside className="no-print hidden w-56 shrink-0 flex-col border-r border-slate-800/80 bg-navy-900/50 lg:flex">
        <div className="border-b border-slate-800/80 px-5 py-6">
          <h1 className="text-lg font-bold tracking-tight text-white">
            Peptide<span className="text-teal-400">Tracker</span>
          </h1>
          {username ? (
            <p className="mt-1 text-xs text-teal-400/80">@{username}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">90-day peptide protocol</p>
          )}
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active === id
                  ? 'bg-teal-500/10 font-medium text-teal-400'
                  : 'text-slate-400 hover:bg-navy-800 hover:text-slate-200'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="space-y-2 border-t border-slate-800/80 p-3">
          <InstallAppButton fullWidth />
          <button
            type="button"
            onClick={onExport}
            className="w-full rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 transition-colors hover:border-teal-500/40 hover:text-teal-400"
          >
            Export JSON
          </button>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 transition-colors hover:border-red-500/30 hover:text-red-400"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          )}
        </div>
      </aside>

      <BottomNav />
    </>
  )
}