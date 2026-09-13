import { useEffect, useMemo, useRef, useState } from 'react'
import type { TrackerState } from '../../types'
import type { PlanHealthStatus } from '../../types/v2'
import {
  evaluatePlanHealth,
  getCachedPlanHealth,
  planHealthBadgeClass,
  planHealthLabel,
} from '../../utils/planHealth'

interface PlanHealthCardProps {
  state: TrackerState
  /** Show cycle day progress bar */
  showProgress?: boolean
  dayInCycle?: number
  totalDays?: number
  className?: string
  /** Optional CTA (e.g. open full 90-day plan) */
  onOpenPlan?: () => void
}

/**
 * Shared Plan Health card for Dashboard + 90-Day Plan.
 * Suggestions are shown but never auto-applied.
 */
export function PlanHealthCard({
  state,
  showProgress = false,
  dayInCycle,
  totalDays = 90,
  className = '',
  onOpenPlan,
}: PlanHealthCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [tick, setTick] = useState(0)
  const [statusPulse, setStatusPulse] = useState(false)
  const prevStatus = useRef<PlanHealthStatus | null>(null)
  const health = useMemo(() => getCachedPlanHealth(state), [state, tick])

  useEffect(() => {
    if (prevStatus.current && prevStatus.current !== health.status) {
      setStatusPulse(true)
      const t = window.setTimeout(() => setStatusPulse(false), 1800)
      return () => window.clearTimeout(t)
    }
    prevStatus.current = health.status
  }, [health.status])

  useEffect(() => {
    const onData = () => {
      evaluatePlanHealth(state)
      setTick((n) => n + 1)
    }
    window.addEventListener('pt-data-updated', onData)
    return () => window.removeEventListener('pt-data-updated', onData)
  }, [state])

  const progress =
    dayInCycle != null && totalDays > 0
      ? Math.round((dayInCycle / totalDays) * 100)
      : null

  const weightLabel =
    health.weightTrendLbsPerWeek == null
      ? '—'
      : `${health.weightTrendLbsPerWeek > 0 ? '+' : ''}${health.weightTrendLbsPerWeek} lb/wk`

  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition-shadow duration-500 ${
        statusPulse ? 'shadow-[0_0_0_1px_rgba(52,211,153,0.35)]' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs tracking-widest text-slate-400 uppercase">
            Adaptive recomp engine
            {dayInCycle != null ? ` · Day ${dayInCycle}/${totalDays}` : ''}
          </div>
          <h3 className="mt-1 text-lg font-semibold text-white">Plan Health</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
            {health.summary}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-transform duration-300 ${planHealthBadgeClass(health.status)} ${
            statusPulse ? 'scale-105' : ''
          }`}
        >
          {planHealthLabel(health.status)}
        </span>
      </div>

      {showProgress && progress != null && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-black/30 px-3 py-2.5">
          <div className="text-[10px] tracking-wide text-slate-500 uppercase">
            Adherence
          </div>
          <div className="mt-0.5 text-base font-semibold text-emerald-400">
            {health.adherence7d}%
          </div>
          <div className="text-[10px] text-slate-600">7-day</div>
        </div>
        <div className="rounded-2xl bg-black/30 px-3 py-2.5">
          <div className="text-[10px] tracking-wide text-slate-500 uppercase">
            Weight
          </div>
          <div className="mt-0.5 text-base font-semibold text-white">
            {weightLabel}
          </div>
          <div className="text-[10px] text-slate-600">recent trend</div>
        </div>
        <div className="rounded-2xl bg-black/30 px-3 py-2.5">
          <div className="text-[10px] tracking-wide text-slate-500 uppercase">
            Energy
          </div>
          <div className="mt-0.5 text-base font-semibold text-white">
            {health.avgEnergy != null ? `${health.avgEnergy}/10` : '—'}
          </div>
          <div className="text-[10px] text-slate-600">avg</div>
        </div>
      </div>

      {health.suggestions.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
          >
            {expanded ? 'Hide suggestions' : 'View suggested adjustments'}
          </button>
          {expanded && (
            <ul className="mt-2 space-y-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-3 text-xs leading-relaxed text-slate-300">
              {health.suggestions.map((s) => (
                <li key={s} className="flex gap-2">
                  <span className="text-emerald-400">·</span>
                  <span>{s}</span>
                </li>
              ))}
              <li className="pt-1 text-[10px] text-slate-500">
                Suggestions are guidance only — nothing is auto-applied to your
                plan. Discuss changes with your clinician when relevant.
              </li>
            </ul>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            evaluatePlanHealth(state)
            setTick((n) => n + 1)
          }}
          className="text-[10px] text-slate-600 hover:text-slate-400"
        >
          Re-evaluate now
        </button>
        {onOpenPlan && (
          <button
            type="button"
            onClick={onOpenPlan}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
          >
            View full 90-day plan →
          </button>
        )}
      </div>
    </div>
  )
}

export default PlanHealthCard
