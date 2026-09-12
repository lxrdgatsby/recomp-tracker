import { Activity, Scale } from 'lucide-react'

interface ProgressSnapshotProps {
  latestWeight: number
  startWeight: number
  goalWeight: number
  energy: number | string | null | undefined
  /** Last N weights for mini sparkline (oldest → newest) */
  weightSeries: number[]
  onOpenProgress?: () => void
}

export function ProgressSnapshot({
  latestWeight,
  startWeight,
  goalWeight,
  energy,
  weightSeries,
  onOpenProgress,
}: ProgressSnapshotProps) {
  const delta = Math.round((latestWeight - startWeight) * 10) / 10
  const deltaLabel =
    delta === 0 ? '0 lb' : `${delta > 0 ? '+' : ''}${delta} lb since start`
  const towardGoal = Math.round((latestWeight - goalWeight) * 10) / 10

  const spark = buildSpark(weightSeries)

  return (
    <section className="mb-5">
      <button
        type="button"
        onClick={onOpenProgress}
        className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition-colors active:bg-white/[0.06]"
      >
        <p className="text-xs tracking-[0.14em] text-slate-500 uppercase">
          Progress
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-black/25 p-3">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <Scale size={11} /> Weight
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
              {latestWeight}
              <span className="text-sm font-normal text-slate-500"> lb</span>
            </p>
            <p
              className={`mt-0.5 text-[11px] ${
                delta < 0 ? 'text-emerald-400' : delta > 0 ? 'text-amber-400' : 'text-slate-500'
              }`}
            >
              {deltaLabel}
            </p>
          </div>
          <div className="rounded-2xl bg-black/25 p-3">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <Activity size={11} /> Energy
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
              {energy != null && energy !== '' ? energy : '—'}
              {energy != null && energy !== '' && (
                <span className="text-sm font-normal text-slate-500">/10</span>
              )}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {towardGoal === 0
                ? 'At goal weight'
                : towardGoal > 0
                  ? `${towardGoal} lb to goal`
                  : `${Math.abs(towardGoal)} lb under goal`}
            </p>
          </div>
        </div>

        {spark && (
          <div className="mt-3">
            <p className="mb-1.5 text-[10px] text-slate-600">Weight trend</p>
            <svg
              viewBox={`0 0 ${spark.w} ${spark.h}`}
              className="h-10 w-full"
              preserveAspectRatio="none"
            >
              <polyline
                fill="none"
                stroke="rgb(52 211 153)"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={spark.points}
              />
            </svg>
          </div>
        )}
      </button>
    </section>
  )
}

function buildSpark(series: number[]): {
  w: number
  h: number
  points: string
} | null {
  if (series.length < 2) return null
  const w = 120
  const h = 32
  const min = Math.min(...series)
  const max = Math.max(...series)
  const range = max - min || 1
  const pts = series.map((v, i) => {
    const x = (i / (series.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  })
  return { w, h, points: pts.join(' ') }
}
