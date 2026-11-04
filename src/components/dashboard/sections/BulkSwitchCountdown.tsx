import { daysUntilBulkSwitch, getLxrdGoalWeight } from '../../../lib/lxrdWeight'

export function BulkSwitchCountdown() {
  const days = daysUntilBulkSwitch()
  const goal = getLxrdGoalWeight()
  const switched = days === 0 && goal === 186

  if (switched) {
    return (
      <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
        Bulk phase active — goal is now 186 lb.
      </div>
    )
  }

  if (days <= 0) return null

  return (
    <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
      Cut to 145 lb continues. Goal switches to 186 lb on Dec 1
      <span className="ml-1 font-semibold text-amber-200">({days} day{days === 1 ? '' : 's'} left)</span>.
    </div>
  )
}
