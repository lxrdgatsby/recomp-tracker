import { AlertTriangle, ChevronRight, FlaskConical } from 'lucide-react'
import type { Vial } from '../../../types/v2'
import { formatMg } from '../../../utils/vialMath'

const LOW_MG_THRESHOLD = 1 // remaining ≤ 1mg considered low for small peptides; also % of vial

function isLow(v: Vial): boolean {
  if (v.remainingMg <= 0.25) return true
  if (v.vialMg > 0 && v.remainingMg / v.vialMg <= 0.15) return true
  return v.remainingMg <= LOW_MG_THRESHOLD && v.vialMg >= 5
}

interface VialsSummaryProps {
  vials: Vial[]
  onOpenInventory: () => void
}

export function VialsSummary({ vials, onOpenInventory }: VialsSummaryProps) {
  const low = vials.filter(isLow)
  const lowest = [...vials].sort((a, b) => a.remainingMg - b.remainingMg)[0]

  return (
    <section className="mb-5">
      <button
        type="button"
        onClick={onOpenInventory}
        className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition-colors active:bg-white/[0.06]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10">
              <FlaskConical size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs tracking-[0.14em] text-slate-500 uppercase">
                Active vials
              </p>
              <p className="mt-0.5 text-2xl font-semibold text-white">
                {vials.length}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="mt-1 text-slate-600" />
        </div>

        {vials.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No stock tracked — open inventory to add a vial
          </p>
        ) : low.length > 0 ? (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-400" />
            <div className="text-xs text-amber-100/90">
              <span className="font-medium text-amber-300">Running low: </span>
              {low.map((v) => `${v.compoundName} (${formatMg(v.remainingMg)})`).join(', ')}
            </div>
          </div>
        ) : lowest ? (
          <p className="mt-3 text-sm text-slate-400">
            Lowest stock:{' '}
            <span className="text-white">
              {lowest.compoundName} · {formatMg(lowest.remainingMg)}
            </span>
          </p>
        ) : null}
      </button>
    </section>
  )
}
