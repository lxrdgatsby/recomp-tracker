import { format } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdminEmail } from '../../constants/admin'
import { useAuth } from '../../contexts/AuthContext'
import type { TrackerState } from '../../types'
import {
  getLatestWeight,
  getStartWeight,
} from '../../utils/calculations'
import { getLastCheckIn } from '../../utils/checkInStorage'
import { computeWindowAdherence } from '../../utils/doseAdherence'
import {
  calcDoseLogAdherence,
  getActiveVials,
  getDoseLogsSince,
} from '../../utils/inventoryStorage'
import { evaluatePlanHealth } from '../../utils/planHealth'
import { getTodayDashboardData } from '../../utils/todayActions'
import { DoseLogger } from '../logging/DoseLogger'
import { PlanHealthCard } from '../plan/PlanHealthCard'
import { AdherenceSnapshot } from './sections/AdherenceSnapshot'
import { DashboardHeader } from './sections/DashboardHeader'
import { ProgressSnapshot } from './sections/ProgressSnapshot'
import { QuickActionsGrid } from './sections/QuickActionsGrid'
import { TodayDosesSection } from './sections/TodayDosesSection'
import { VialsSummary } from './sections/VialsSummary'

interface DashboardViewProps {
  state: TrackerState
  username?: string | null
  onToggleInjection: (date: string, peptideId: string) => void
}

export function DashboardView({
  state,
  username,
  onToggleInjection,
}: DashboardViewProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = isAdminEmail(user?.email)
  const { profile } = state
  const today = format(new Date(), 'yyyy-MM-dd')
  const dateLabel = format(new Date(), 'EEEE, MMM d')

  const currentWeight = getLatestWeight(profile, state.weightHistory)
  const startWeight = getStartWeight(profile, state.weightHistory)
  const { dayInCycle, totalDays, injections } = getTodayDashboardData(state)

  const [logOpen, setLogOpen] = useState(false)
  const [logCompoundName, setLogCompoundName] = useState<string | undefined>()
  const [logDoseMg, setLogDoseMg] = useState<number | undefined>()
  const [tick, setTick] = useState(0)

  const displayName = username
    ? username.charAt(0).toUpperCase() + username.slice(1)
    : 'there'

  // Merge schedule "done" with today's dose logs (taken)
  const todayLogs = useMemo(() => getDoseLogsSince(2), [tick])
  const enrichedInjections = useMemo(() => {
    return injections.map((inj) => {
      const loggedTaken = todayLogs.some(
        (l) =>
          l.taken &&
          l.date.slice(0, 10) === today &&
          l.compoundName.toLowerCase() === inj.peptideName.toLowerCase()
      )
      return { ...inj, loggedTaken }
    })
  }, [injections, todayLogs, today])

  const adherence = useMemo(() => {
    const hybrid = computeWindowAdherence(state, 7)
    const pure = calcDoseLogAdherence(7)
    if (pure.total > 0 && hybrid.expected === 0) {
      return {
        pct: pure.pct,
        streak: pure.streak,
        cells: hybrid.cells,
      }
    }
    return {
      pct: hybrid.pct,
      streak: hybrid.streak || pure.streak,
      cells: hybrid.cells,
    }
  }, [state, tick])

  const vials = useMemo(() => getActiveVials(), [tick])
  const lastCheckIn = getLastCheckIn()

  const weightSeries = useMemo(() => {
    const sorted = [...state.weightHistory].sort((a, b) =>
      a.date.localeCompare(b.date)
    )
    const pts = sorted.slice(-8).map((w) => w.weight)
    if (pts.length === 0) return [startWeight, currentWeight]
    if (pts[pts.length - 1] !== currentWeight) pts.push(currentWeight)
    return pts
  }, [state.weightHistory, startWeight, currentWeight])

  const openLog = (compoundName?: string, doseMg?: number) => {
    setLogCompoundName(compoundName)
    setLogDoseMg(doseMg)
    setLogOpen(true)
  }

  const bump = () => {
    evaluatePlanHealth(state)
    setTick((n) => n + 1)
  }

  useEffect(() => {
    const onData = () => {
      evaluatePlanHealth(state)
      setTick((n) => n + 1)
    }
    window.addEventListener('pt-data-updated', onData)
    return () => window.removeEventListener('pt-data-updated', onData)
  }, [state])

  return (
    <div className="pb-8 text-white">
      {/* 1. Header */}
      <DashboardHeader
        displayName={displayName}
        username={username}
        dateLabel={dateLabel}
        dayInCycle={dayInCycle}
        totalDays={totalDays}
      />

      {/* 2. Today's Doses — highest priority */}
      <TodayDosesSection
        injections={enrichedInjections}
        peptides={state.peptides}
        startDate={profile.startDate}
        onLog={(name, mg) => openLog(name, mg)}
        onQuickDone={(id) => {
          onToggleInjection(today, id)
          bump()
        }}
        onLogUnscheduled={() => openLog()}
      />

      {/* 3. Plan Health */}
      <PlanHealthCard
        state={state}
        showProgress
        dayInCycle={dayInCycle}
        totalDays={totalDays}
        className="mb-5"
        onOpenPlan={() => navigate('/app/plan')}
      />

      {/* 4. Adherence Snapshot */}
      <AdherenceSnapshot
        pct={adherence.pct}
        streak={adherence.streak}
        weekCells={adherence.cells}
        onOpenProgress={() => navigate('/app/progress')}
      />

      {/* 5. Active Vials */}
      <VialsSummary
        vials={vials}
        onOpenInventory={() => navigate('/app/peptides')}
      />

      {/* 6. Progress Snapshot */}
      <ProgressSnapshot
        latestWeight={currentWeight}
        startWeight={startWeight}
        goalWeight={profile.goalWeight}
        energy={lastCheckIn?.energy}
        weightSeries={weightSeries}
        onOpenProgress={() => navigate('/app/progress')}
      />

      {/* 7. Quick Actions */}
      <QuickActionsGrid
        onLogDose={() => openLog()}
        onCheckIn={() => navigate('/app/progress')}
        onCoach={() => navigate('/app/assistant')}
        onPlan={() => navigate('/app/plan')}
        showAdmin={isAdmin}
        onAdmin={() => navigate('/admin')}
      />

      <DoseLogger
        open={logOpen}
        onClose={() => setLogOpen(false)}
        peptides={state.peptides}
        initialCompoundName={logCompoundName}
        initialDoseMg={logDoseMg}
        onLogged={bump}
      />
    </div>
  )
}
