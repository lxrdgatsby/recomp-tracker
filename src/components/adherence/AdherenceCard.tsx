import { Flame, Syringe } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { calcDoseLogAdherence, loadDoseLogs } from '../../utils/inventoryStorage'
import { computeWindowAdherence } from '../../utils/doseAdherence'
import type { TrackerState } from '../../types'
import { EmptyState } from '../ui/EmptyState'

interface AdherenceCardProps {
  state?: TrackerState
  /** Compact single-stat for dashboard */
  compact?: boolean
  className?: string
}

/**
 * 7/30-day adherence from dose logs (with schedule fallback if state provided).
 */
export function AdherenceCard({
  state,
  compact = false,
  className = '',
}: AdherenceCardProps) {
  const navigate = useNavigate()
  // Recalculate each render — localStorage is source of truth
  const pure7 = calcDoseLogAdherence(7)
  const pure30 = calcDoseLogAdherence(30)
  const hybrid7 = state ? computeWindowAdherence(state, 7) : null
  const hybrid30 = state ? computeWindowAdherence(state, 30) : null

  // Prefer hybrid when we have scheduled context; else pure dose logs
  const d7 =
    hybrid7 && hybrid7.expected > 0
      ? { pct: hybrid7.pct, streak: hybrid7.streak }
      : pure7.total > 0
        ? { pct: pure7.pct, streak: pure7.streak }
        : hybrid7
          ? { pct: hybrid7.pct, streak: hybrid7.streak }
          : { pct: pure7.pct, streak: pure7.streak }

  const d30 =
    hybrid30 && hybrid30.expected > 0
      ? { pct: hybrid30.pct }
      : pure30.total > 0
        ? { pct: pure30.pct }
        : hybrid30
          ? { pct: hybrid30.pct }
          : { pct: pure30.pct }

  const recent = loadDoseLogs().slice(0, 14)

  if (compact) {
    return (
      <div className={`rounded-2xl bg-white/5 p-4 ${className}`}>
        <div className="text-xs tracking-widest text-slate-400 uppercase">
          7-day adherence
        </div>
        <div className="mt-1 text-3xl font-semibold tabular-nums text-emerald-400">
          {d7.pct}%
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <Flame size={12} className="text-orange-400" />
          {d7.streak}d streak
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h2 className="text-xl font-semibold text-white">Adherence</h2>
        <p className="mt-1 text-sm text-slate-400">
          Taken vs missed · last 7 and 30 days
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white/5 p-4">
          <div className="text-xs text-slate-400">7-day</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-400">
            {d7.pct}%
          </div>
        </div>
        <div className="rounded-2xl bg-white/5 p-4">
          <div className="text-xs text-slate-400">30-day</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-400">
            {d30.pct}%
          </div>
        </div>
        <div className="rounded-2xl bg-white/5 p-4">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Flame size={12} className="text-orange-400" />
            Streak
          </div>
          <div className="mt-1 text-2xl font-semibold text-orange-400">
            {d7.streak}
            <span className="text-sm font-normal text-slate-500">d</span>
          </div>
        </div>
      </div>

      {/* Recent history chips */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 text-xs tracking-widest text-slate-400 uppercase">
          Recent logs
        </div>
        {recent.length === 0 ? (
          <EmptyState
            icon={<Syringe size={18} />}
            title="No doses logged yet"
            description="Log taken or missed doses from Home or Peptides to build your streak."
            actionLabel="Go to Home"
            onAction={() => navigate('/app')}
            className="border-0 bg-transparent py-4"
          />
        ) : (
          <ul className="space-y-2">
            {recent.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <div className="min-w-0">
                  <span className="font-medium text-white">
                    {l.compoundName}
                  </span>
                  <span className="text-slate-500">
                    {' '}
                    · {l.doseMg}mg
                    {l.units ? ` · ${l.units}u` : ''}
                  </span>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    l.taken
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {l.taken ? 'Taken' : 'Missed'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Heat strip for last 30 pure log days if available */}
      {state && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 text-xs tracking-widest text-slate-400 uppercase">
            30-day map
          </div>
          <div className="flex flex-wrap gap-1.5">
            {computeWindowAdherence(state, 30).cells.map((c) => (
              <div
                key={c.date}
                title={`${c.date}: ${c.status}`}
                className={`h-3.5 w-3.5 rounded-md ${
                  c.status === 'taken'
                    ? 'bg-emerald-500'
                    : c.status === 'missed'
                      ? 'bg-red-500/70'
                      : c.status === 'partial'
                        ? 'bg-emerald-500/40'
                        : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdherenceCard
