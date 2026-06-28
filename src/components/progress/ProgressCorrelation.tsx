import { useMemo } from 'react'
import { getCheckInHistory } from '../../utils/checkInStorage'
import { buildCheckInSummary } from '../../utils/checkInInsights'

interface ProgressCorrelationProps {
  refreshKey?: number
}

export function ProgressCorrelation({ refreshKey = 0 }: ProgressCorrelationProps) {
  const { checkIns, summary } = useMemo(() => {
    void refreshKey
    const history = [...getCheckInHistory()].sort((a, b) =>
      a.date.localeCompare(b.date)
    )
    return {
      checkIns: history,
      summary: buildCheckInSummary(history),
    }
  }, [refreshKey])

  const latest = checkIns[checkIns.length - 1]

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 font-semibold">Progress Insights</h3>
      {summary ? (
        <p className="mb-4 text-sm leading-relaxed text-emerald-400">{summary}</p>
      ) : null}

      <div className="text-sm text-slate-400">
        {checkIns.length > 0 ? (
          <div>
            Latest check-in: {latest.date.split('T')[0]}
            {latest.weight && (
              <span className="text-slate-500">
                {' '}
                · {latest.weight} lbs · energy {latest.energy}/10
              </span>
            )}
          </div>
        ) : (
          <div>No check-ins yet. Start logging daily.</div>
        )}
      </div>
    </div>
  )
}

export default ProgressCorrelation