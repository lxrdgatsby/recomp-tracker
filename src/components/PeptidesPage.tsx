import { differenceInDays, format, parseISO } from 'date-fns'
import { FlaskConical, Syringe } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTrackerStore } from '../hooks/useTrackerStore'
import type { Peptide, TitrationWeek } from '../types'
import { getTitrationForDay } from '../utils/recompProtocol'
import { loadDoseLogs } from '../utils/inventoryStorage'
import { EmptyState } from './ui/EmptyState'
import { VialInventory } from './inventory/VialInventory'
import { DoseLogger } from './logging/DoseLogger'
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
  const navigate = useNavigate()
  const [logOpen, setLogOpen] = useState(false)
  const [logTick, setLogTick] = useState(0)

  const { peptides, profile } = state
  const dayInCycle = Math.max(
    0,
    differenceInDays(new Date(), parseISO(profile.startDate))
  )

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

  const recentDoseLogs = useMemo(
    () => loadDoseLogs().slice(0, 6),
    [logTick]
  )

  useEffect(() => {
    const onData = () => setLogTick((n) => n + 1)
    window.addEventListener('pt-data-updated', onData)
    return () => window.removeEventListener('pt-data-updated', onData)
  }, [])

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

  const card = 'rounded-3xl border border-white/10 bg-white/[0.04] p-5'

  return (
    <div className="pb-8 text-white">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Peptides
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Stack · vials · dosing
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLogOpen(true)}
          className="min-h-11 shrink-0 rounded-2xl bg-emerald-500 px-4 text-sm font-semibold text-black active:bg-emerald-400"
        >
          Log dose
        </button>
      </div>

      {/* Active stack summary */}
      <section className={`mb-6 ${card}`}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-white">Active stack</h2>
          <Link
            to="/app/profile"
            className="text-xs text-emerald-400 hover:text-emerald-300"
          >
            Edit in Profile
          </Link>
        </div>
        {peptides.length === 0 ? (
          <EmptyState
            icon={<Syringe size={20} />}
            title="No active compounds"
            description="Add peptides to your stack in Profile to schedule doses and protocols."
            actionLabel="Open profile"
            onAction={() => navigate('/app/profile')}
          />
        ) : (
          <ul className="space-y-2.5">
            {peptides.map((peptide) => (
              <li
                key={peptide.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="font-medium text-white">{peptide.name}</span>
                <span className="truncate text-xs text-slate-500">
                  {peptide.dose}
                  {peptide.protocol?.reconstituted === false && (
                    <span className="ml-2 text-amber-400">Not mixed</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mb-8">
        <VialInventory
          defaultDoseByName={Object.fromEntries(
            peptides.map((p) => [p.name, p.protocol?.startingDoseMg ?? 0.5])
          )}
          onChange={() => setLogTick((n) => n + 1)}
        />
      </div>

      <div className="mb-8">
        <ReconstitutionGuide variant="peptides" />
      </div>

      <DoseLogger
        open={logOpen}
        onClose={() => setLogOpen(false)}
        peptides={peptides}
        onLogged={() => setLogTick((n) => n + 1)}
      />

      <div className="mb-8">
        <DoseCalculator
          key={calculatorPeptide?.id ?? 'default'}
          peptides={peptides}
          onLogDose={handleLogDose}
          onSaveProtocol={(protocol) => void saveActiveProtocol({ ...protocol })}
          {...calculatorDefaults}
        />
      </div>

      <div className="space-y-4">
        <div className={card}>
          <h3 className="mb-3 text-sm font-medium text-white">Recent dose logs</h3>
          {recentDoseLogs.length === 0 ? (
            <EmptyState
              icon={<FlaskConical size={20} />}
              title="No doses logged yet"
              description="Log taken or missed doses so adherence and the AI coach stay accurate."
              actionLabel="Log a dose"
              onAction={() => setLogOpen(true)}
            />
          ) : (
            <ul className="space-y-3">
              {recentDoseLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-white">
                      {log.compoundName}
                    </span>
                    <span className="text-slate-500">
                      {' '}
                      · {log.doseMg}mg
                      {log.units ? ` · ${log.units}u` : ''}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        log.taken
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {log.taken ? 'Taken' : 'Missed'}
                    </span>
                    <span className="text-xs text-slate-600">
                      {format(parseISO(log.date.slice(0, 10)), 'MMM d')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={card}>
          <h3 className="mb-3 text-sm font-medium text-white">
            Upcoming titration
          </h3>
          {upcomingTitrations.length === 0 ? (
            <p className="text-sm text-slate-500">No titration schedules active</p>
          ) : (
            <ul className="space-y-4">
              {upcomingTitrations.map(({ peptide, current, next }) => (
                <li key={peptide.id} className="text-sm">
                  <div className="font-medium text-white">{peptide.name}</div>
                  <div className="mt-1 text-slate-400">
                    Now: Weeks {current.weeks} — {current.doseLabel}
                  </div>
                  {next ? (
                    <div className="mt-0.5 text-emerald-400">
                      Next: Weeks {next.weeks} — {next.doseLabel}
                    </div>
                  ) : (
                    <div className="mt-0.5 text-slate-500">
                      Final titration step
                    </div>
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
