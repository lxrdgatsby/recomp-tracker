import { format, parseISO, differenceInDays } from 'date-fns'
import { useMemo } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { useTrackerStore } from '../hooks/useTrackerStore'
import type { Peptide, TitrationWeek } from '../types'
import { computeAdherence } from '../utils/adherence'
import { getTitrationForDay } from '../utils/recompProtocol'
import { DoseCalculator } from './peptides/DoseCalculator'
import { ReconstitutionGuide } from './peptides/ReconstitutionGuide'

function getNextTitrationStep(
  peptide: Peptide,
  dayInCycle: number
): { current: TitrationWeek; next: TitrationWeek | null } | null {
  const titration = peptide.protocol?.titration
  if (!titration?.length) return null

  const currentWeek = Math.floor(dayInCycle / 7) + 1

  for (let i = 0; i < titration.length; i++) {
    const tier = titration[i]
    const [start, end] = tier.weeks.split('-').map((n) => parseInt(n, 10))
    if (currentWeek >= start && currentWeek <= (end ?? start)) {
      return { current: tier, next: titration[i + 1] ?? null }
    }
  }

  const last = titration[titration.length - 1]
  return { current: last, next: null }
}

export default function PeptidesPage() {
  const state = useTrackerStore((store) => store.state)
  const addInjectionLog = useTrackerStore((store) => store.addInjectionLog)
  const saveActiveProtocol = useTrackerStore((store) => store.saveActiveProtocol)
  const { userProfile } = useAuth()

  const { peptides, injectionLogs, profile } = state
  const dayInCycle = Math.max(0, differenceInDays(new Date(), parseISO(profile.startDate)))

  const handleLogDose = (log: Parameters<typeof addInjectionLog>[0]) => {
    void addInjectionLog({ ...log })
  }

  const calculatorPeptide = peptides.find((p) => p.protocol)
  const calculatorDefaults = useMemo(() => {
    const protocol = calculatorPeptide?.protocol
    if (!protocol) return {}
    return {
      initialVialMg: protocol.vialMg,
      initialBacWaterUnits: protocol.bacWaterUnits,
      initialTargetDoseMg: protocol.startingDoseMg,
      peptideCatalogId: calculatorPeptide?.id,
      familiarity: userProfile?.familiarity ?? 'beginner',
    }
  }, [calculatorPeptide, userProfile?.familiarity])

  const adherence = useMemo(() => computeAdherence(state), [state])

  const recentLogs = useMemo(
    () =>
      [...injectionLogs]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5)
        .map((log) => {
          const peptide = peptides.find((p) => p.id === log.peptideId)
          return {
            ...log,
            name: log.peptideName ?? peptide?.name ?? 'Unknown',
          }
        }),
    [injectionLogs, peptides]
  )

  const upcomingTitrations = useMemo(
    () =>
      peptides
        .map((peptide) => {
          const step = getNextTitrationStep(peptide, dayInCycle)
          if (!step) return null
          const currentTier = getTitrationForDay(peptide, dayInCycle)
          return {
            peptide,
            current: currentTier ?? step.current,
            next: step.next,
          }
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry != null),
    [peptides, dayInCycle]
  )

  return (
    <div className="min-h-screen pb-20">
      <div className="p-6">
        <h1 className="text-3xl font-bold">Peptides</h1>
        <p className="text-zinc-400">Track • Calculate • Progress</p>
      </div>

      <div className="mb-8 px-6">
        <ReconstitutionGuide variant="peptides" />
      </div>

      <div className="px-6 pb-8">
        <DoseCalculator
          key={calculatorPeptide?.id ?? 'default'}
          peptides={peptides}
          onLogDose={handleLogDose}
          onSaveProtocol={(protocol) => void saveActiveProtocol({ ...protocol })}
          {...calculatorDefaults}
        />
      </div>

      <div className="space-y-4 px-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-3xl bg-zinc-900 p-6">
            <h3 className="font-medium">Current Protocol</h3>
            {peptides.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">No active peptides yet</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {peptides.map((peptide) => (
                  <li key={peptide.id} className="text-sm text-zinc-300">
                    <span className="font-medium text-white">{peptide.name}</span>
                    {peptide.protocol?.reconstituted === false && (
                      <span className="ml-2 text-xs text-amber-400">Not mixed</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl bg-zinc-900 p-6">
            <h3 className="font-medium">Adherence</h3>
            <p className="mt-2 text-3xl font-bold text-emerald-400">
              {adherence.injectionPct}%
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {adherence.completedInjections} of {adherence.expectedInjections} doses logged
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-zinc-900 p-6">
          <h3 className="font-medium">Recent Logs</h3>
          {recentLogs.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No doses logged yet</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {recentLogs.map((log, index) => (
                <li
                  key={`${log.date}-${log.peptideId}-${index}`}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="font-medium text-white">{log.name}</span>
                    {log.units != null && (
                      <span className="ml-2 text-zinc-400">{log.units}U</span>
                    )}
                  </div>
                  <span className="text-zinc-500">
                    {format(parseISO(log.date.slice(0, 10)), 'MMM d')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl bg-zinc-900 p-6">
          <h3 className="font-medium">Upcoming Titration</h3>
          {upcomingTitrations.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No titration schedules active</p>
          ) : (
            <ul className="mt-3 space-y-4">
              {upcomingTitrations.map(({ peptide, current, next }) => (
                <li key={peptide.id} className="text-sm">
                  <div className="font-medium text-white">{peptide.name}</div>
                  <div className="mt-1 text-zinc-400">
                    Now: Weeks {current.weeks} — {current.doseLabel}
                  </div>
                  {next ? (
                    <div className="mt-0.5 text-emerald-400">
                      Next: Weeks {next.weeks} — {next.doseLabel}
                    </div>
                  ) : (
                    <div className="mt-0.5 text-zinc-500">Final titration step</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}