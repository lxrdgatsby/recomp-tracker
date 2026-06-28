import { useMemo } from 'react'
import { getCheckInHistory } from '../../utils/checkInStorage'
import { buildCheckInSummary } from '../../utils/checkInInsights'

interface ProgressCorrelationProps {
  refreshKey?: number
}

export function ProgressCorrelation({ refreshKey = 0 }: ProgressCorrelationProps) {
  const summary = useMemo(() => {
    void refreshKey
    const history = [...getCheckInHistory()].sort((a, b) =>
      a.date.localeCompare(b.date)
    )
    return buildCheckInSummary(history)
  }, [refreshKey])

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-2 font-semibold">AI Insights</h3>
      <p className="text-sm text-emerald-400">
        {summary || 'Log a few check-ins to see correlations.'}
      </p>
    </div>
  )
}

export default ProgressCorrelation