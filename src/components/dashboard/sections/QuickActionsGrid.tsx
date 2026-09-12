import {
  Calendar,
  ClipboardList,
  MessageSquare,
  Plus,
  Syringe,
} from 'lucide-react'

interface QuickActionsGridProps {
  onLogDose: () => void
  onCheckIn: () => void
  onCoach: () => void
  onPlan: () => void
  showAdmin?: boolean
  onAdmin?: () => void
}

const BTN =
  'flex min-h-[4.5rem] flex-col items-start justify-center gap-1.5 rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition-colors active:bg-white/[0.08]'

export function QuickActionsGrid({
  onLogDose,
  onCheckIn,
  onCoach,
  onPlan,
  showAdmin,
  onAdmin,
}: QuickActionsGridProps) {
  return (
    <section className="mb-4">
      <h2 className="mb-3 px-0.5 text-sm font-medium tracking-[0.12em] text-slate-400 uppercase">
        Quick actions
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onLogDose} className={BTN}>
          <Syringe size={18} className="text-emerald-400" />
          <span className="text-sm font-medium text-white">Log Dose</span>
        </button>
        <button type="button" onClick={onCheckIn} className={BTN}>
          <ClipboardList size={18} className="text-emerald-400" />
          <span className="text-sm font-medium text-white">Add Check-in</span>
        </button>
        <button type="button" onClick={onCoach} className={BTN}>
          <MessageSquare size={18} className="text-emerald-400" />
          <span className="text-sm font-medium text-white">AI Coach</span>
        </button>
        <button type="button" onClick={onPlan} className={BTN}>
          <Calendar size={18} className="text-emerald-400" />
          <span className="text-sm font-medium text-white">Full Plan</span>
        </button>
        {showAdmin && onAdmin && (
          <button
            type="button"
            onClick={onAdmin}
            className={`${BTN} col-span-2 border-emerald-500/25 bg-emerald-500/10`}
          >
            <Plus size={18} className="text-emerald-400" />
            <span className="text-sm font-medium text-white">Admin Dashboard</span>
          </button>
        )}
      </div>
    </section>
  )
}
