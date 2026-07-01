import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { SmartCheckIn } from '../checkin/SmartCheckIn'
import { useTrackerStore } from '../../hooks/useTrackerStore'
import { DoseCalculator } from '../DoseCalculator'
import { InjectionSiteMap } from '../peptides/InjectionSiteMap'
import { AdvancedAnalytics } from '../progress/AdvancedAnalytics'
import { ProgressCorrelation } from '../progress/ProgressCorrelation'
import type { TrackerState } from '../../types'
import type { CheckInData } from '../../utils/checkInStorage'
import { getLatestWeight } from '../../utils/calculations'
import { getPlanForExport } from '../../utils/export90DayPlan'
import {
  generate90DayPlan,
  get90DayPlan,
  getOnboardingData,
  type Generated90DayPlan,
} from '../../utils/onboardingStorage'

interface MasterDashboardProps {
  state: TrackerState
  onLogWeight: (date: string, weight: number) => void
}

export function MasterDashboard({ state, onLogWeight }: MasterDashboardProps) {
  const addInjectionLog = useTrackerStore((store) => store.addInjectionLog)
  const saveActiveProtocol = useTrackerStore((store) => store.saveActiveProtocol)
  const [plan, setPlan] = useState<Generated90DayPlan | null>(null)
  const [checkInVersion, setCheckInVersion] = useState(0)

  const today = format(new Date(), 'yyyy-MM-dd')
  const currentWeight = getLatestWeight(state.profile, state.weightHistory)

  useEffect(() => {
    const onboarding = getOnboardingData()
    const saved = get90DayPlan()
    if (saved) {
      setPlan(saved)
    } else if (onboarding) {
      setPlan(generate90DayPlan(onboarding))
    } else {
      setPlan(getPlanForExport(state))
    }
  }, [state])

  const handleCheckIn = (data: CheckInData) => {
    const w = parseFloat(data.weight)
    if (!isNaN(w) && w > 0) {
      onLogWeight(today, w)
    }
    setCheckInVersion((v) => v + 1)
  }

  const handleExportReport = async () => {
    const { exportFullReport } = await import('../../lib/exportPDF')
    exportFullReport()
  }

  return (
    <div className="pb-6 text-white">
      <div className="flex items-start justify-between gap-3 pt-2 pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-slate-400">Your complete overview</p>
        </div>
        <button
          type="button"
          onClick={handleExportReport}
          className="shrink-0 rounded-2xl border border-white/20 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-emerald-500/40 hover:bg-white/5 hover:text-emerald-400"
        >
          Export Report
        </button>
      </div>

      <div className="space-y-6">
        <SmartCheckIn
          defaultWeight={String(currentWeight)}
          onSubmit={handleCheckIn}
        />
        <ProgressCorrelation refreshKey={checkInVersion} />
        <AdvancedAnalytics refreshKey={checkInVersion} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DoseCalculator
            peptides={state.peptides}
            onLogDose={async (log) => {
              await addInjectionLog({ ...log })
              alert(`✅ Successfully logged dose for ${log.peptideName}`)
            }}
            onSaveProtocol={(protocol) => saveActiveProtocol({ ...protocol })}
          />
          <InjectionSiteMap />
        </div>

        {plan && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-2 font-semibold">90-Day Plan</h3>
            <p className="text-sm text-slate-400">
              Target: {plan.targetWeeklyLoss} lbs/week · Goal: {plan.goalDate}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MasterDashboard