import { Settings, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getGreeting } from '../../../utils/todayActions'

interface DashboardHeaderProps {
  displayName: string
  username?: string | null
  dateLabel: string
  dayInCycle: number
  totalDays: number
}

export function DashboardHeader({
  displayName,
  username,
  dateLabel,
  dayInCycle,
  totalDays,
}: DashboardHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3 pt-1 pb-5">
      <div className="min-w-0">
        <p className="text-sm text-slate-400">
          {getGreeting()}, {displayName}
        </p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Today
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          {dateLabel}
          <span className="text-slate-600"> · </span>
          <span className="text-emerald-400/90">
            Day {dayInCycle}/{totalDays}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to="/app/profile"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition-colors active:bg-white/10"
          aria-label={username ? `Profile @${username}` : 'Profile'}
        >
          <User size={18} />
        </Link>
        <Link
          to="/app/settings"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition-colors active:bg-white/10"
          aria-label="Settings"
        >
          <Settings size={18} />
        </Link>
      </div>
    </header>
  )
}
