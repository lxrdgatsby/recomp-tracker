import { Flame } from 'lucide-react'
import type { DayAdherenceCell } from '../../../utils/doseAdherence'

interface AdherenceSnapshotProps {
  pct: number
  streak: number
  weekCells: DayAdherenceCell[]
  onOpenProgress?: () => void
}

export function AdherenceSnapshot({
  pct,
  streak,
  weekCells,
  onOpenProgress,
}: AdherenceSnapshotProps) {
  const dotClass = (status: DayAdherenceCell['status']) => {
    switch (status) {
      case 'taken':
        return 'bg-emerald-500'
      case 'partial':
        return 'bg-emerald-500/45'
      case 'missed':
        return 'bg-red-500/65'
      default:
        return 'bg-white/12'
    }
  }

  return (
    <section className="mb-5">
      <button
        type="button"
        onClick={onOpenProgress}
        className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition-colors active:bg-white/[0.06]"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.14em] text-slate-500 uppercase">
              Adherence
            </p>
            <p className="mt-1 text-4xl font-semibold tabular-nums text-emerald-400">
              {pct}
              <span className="text-xl text-emerald-400/70">%</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">Last 7 days</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400">
              <Flame size={12} />
              {streak}d streak
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-1.5">
          {weekCells.map((c) => (
            <div key={c.date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-2 w-full max-w-[28px] rounded-full ${dotClass(c.status)}`}
                title={`${c.date}: ${c.status}`}
              />
              <span className="text-[9px] text-slate-600">
                {c.date.slice(8)}
              </span>
            </div>
          ))}
        </div>
      </button>
    </section>
  )
}
