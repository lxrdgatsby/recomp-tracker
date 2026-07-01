import { format, parseISO, differenceInDays } from 'date-fns'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useAuth } from '../../contexts/AuthContext'
import {
  getCatalogEntry,
  getCatalogEntryByName,
  PEPTIDE_CATALOG,
  recommendedBacWaterForVial,
  type PeptideSelection,
} from '../../constants/peptideCatalog'
import type { Peptide, TrackerState } from '../../types'
import {
  generateRecompPlan,
  normalizeSelection,
  syncSelectionsFromPeptides,
} from '../../utils/recompProtocol'
import {
  getInjectionsForDate,
  isInjectionDone,
} from '../../utils/peptideSchedule'
import { formatSyringeUnits, getTitrationForDay } from '../../utils/recompProtocol'
import type { DoseLog } from '../DoseCalculator'
import { DoseCalculator } from './DoseCalculator'
import { InjectionSiteMap } from './InjectionSiteMap'
import { ReconstitutionGuide } from './ReconstitutionGuide'

interface PeptidesViewProps {
  state: TrackerState
  onToggleInjection: (date: string, peptideId: string) => void
  addInjectionLog: (log: DoseLog) => void | Promise<void>
  onUpdateReconstitution: (
    state: TrackerState,
    selections: PeptideSelection[]
  ) => void | Promise<void>
}

interface StackCard {
  peptide: Peptide
  nextDose: string
  frequency: string
  doneToday: boolean
  scheduledToday: boolean
}

function buildStackCards(state: TrackerState, today: string): StackCard[] {
  const { peptides, profile, injectionLogs } = state
  const todayDate = new Date()
  const scheduledToday = getInjectionsForDate(
    peptides,
    todayDate,
    profile.startDate
  )
  const scheduledIds = new Set(scheduledToday.map((s) => s.peptideId))

  return peptides.map((peptide) => {
    const scheduled = scheduledToday.find((s) => s.peptideId === peptide.id)
    const dayInCycle = Math.max(
      0,
      differenceInDays(todayDate, parseISO(profile.startDate))
    )
    const tier = getTitrationForDay(peptide, dayInCycle)
    const units =
      tier?.syringeUnits ?? peptide.protocol?.startingSyringeUnits
    const nextDose =
      units != null ? formatSyringeUnits(units) : 'Check protocol'

    const frequency =
      peptide.frequency === 'weekly'
        ? 'Weekly'
        : peptide.frequency === 'daily'
          ? 'Daily'
          : scheduled?.timing ?? peptide.timing ?? 'As scheduled'

    return {
      peptide,
      nextDose: scheduled ? nextDose : nextDose,
      frequency,
      doneToday: isInjectionDone(injectionLogs, today, peptide.id),
      scheduledToday: scheduledIds.has(peptide.id),
    }
  })
}

export function PeptidesView({
  state,
  onToggleInjection,
  addInjectionLog,
  onUpdateReconstitution,
}: PeptidesViewProps) {
  const { userProfile, setTrackerState } = useAuth()
  const { peptides } = state
  const today = format(new Date(), 'yyyy-MM-dd')
  const [showSites, setShowSites] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null)
  const [addingPeptideId, setAddingPeptideId] = useState<string | null>(null)

  const selections = useMemo(
    () => (userProfile?.peptideSelections ?? []).map(normalizeSelection),
    [userProfile?.peptideSelections]
  )

  const stackCatalogIds = useMemo(() => {
    const ids = new Set<string>()
    for (const peptide of peptides) {
      const entry =
        getCatalogEntry(peptide.id) ?? getCatalogEntryByName(peptide.name)
      if (entry) ids.add(entry.id)
    }
    for (const selection of selections) {
      if (selection.status === 'using') ids.add(selection.catalogId)
    }
    return ids
  }, [peptides, selections])

  const availableCatalogPeptides = useMemo(
    () => PEPTIDE_CATALOG.filter((entry) => !stackCatalogIds.has(entry.id)),
    [stackCatalogIds]
  )

  const stackCards = useMemo(() => buildStackCards(state, today), [state, today])

  const findSelection = (peptide: Peptide) =>
    selections.find((s) => s.catalogId === peptide.id) ??
    selections.find(
      (s) => getCatalogEntry(s.catalogId)?.name === peptide.name
    ) ??
    selections.find(
      (s) => getCatalogEntryByName(peptide.name)?.id === s.catalogId
    )

  const toggleReconstituted = (peptide: Peptide, checked: boolean) => {
    if (!userProfile) return
    const match = findSelection(peptide)
    if (!match) return

    const updated = selections.map((s) =>
      s.catalogId === match.catalogId ? { ...s, reconstituted: checked } : s
    )

    const { peptides: nextPeptides, recompPlan } = generateRecompPlan({
      familiarity: userProfile.familiarity ?? 'beginner',
      mainGoal: userProfile.mainGoal ?? '',
      gender: userProfile.gender,
      age: userProfile.age,
      trainingActivities: userProfile.trainingActivities,
      additionalInfo: userProfile.additionalInfo,
      currentWeight: state.profile.currentWeight,
      goalWeight: state.profile.goalWeight,
      weeklyLossTarget: state.profile.weeklyLossTarget,
      peptideSelections: updated,
    })

    void onUpdateReconstitution(
      { ...state, peptides: nextPeptides, recompPlan },
      updated
    )
  }

  const addPeptideFromCatalog = async (catalogId: string) => {
    const entry = getCatalogEntry(catalogId)
    if (!entry) return

    if (!userProfile) {
      setAddError('Sign in to add peptides to your stack.')
      setAddSuccess(null)
      return
    }

    const baseSelections = syncSelectionsFromPeptides(state.peptides, selections)
    const existing = baseSelections.find((s) => s.catalogId === catalogId)

    let updated: PeptideSelection[]
    if (existing?.status === 'using') {
      setAddError(`${entry.name} is already in your stack.`)
      setAddSuccess(null)
      return
    }

    if (existing) {
      updated = baseSelections.map((selection) =>
        selection.catalogId === catalogId
          ? { ...selection, status: 'using' as const }
          : selection
      )
    } else {
      updated = [
        ...baseSelections,
        {
          catalogId: entry.id,
          dose: entry.defaultDose,
          status: 'using' as const,
          bacWaterUnits: recommendedBacWaterForVial(entry.defaultDose),
          reconstituted: false,
        },
      ]
    }

    const { peptides: nextPeptides, recompPlan } = generateRecompPlan({
      familiarity: userProfile.familiarity ?? 'beginner',
      mainGoal: userProfile.mainGoal ?? '',
      gender: userProfile.gender,
      age: userProfile.age,
      trainingActivities: userProfile.trainingActivities,
      additionalInfo: userProfile.additionalInfo,
      currentWeight: state.profile.currentWeight,
      goalWeight: state.profile.goalWeight,
      weeklyLossTarget: state.profile.weeklyLossTarget,
      peptideSelections: updated,
    })

    const nextState = { ...state, peptides: nextPeptides, recompPlan }

    setAddingPeptideId(catalogId)
    setAddError(null)
    setAddSuccess(null)
    setTrackerState(nextState)

    try {
      await onUpdateReconstitution(nextState, updated)
      setAddSuccess(`${entry.name} added to your stack.`)
      setTimeout(() => setAddSuccess(null), 3000)
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : 'Could not save peptide. Try again.'
      )
    } finally {
      setAddingPeptideId(null)
    }
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

  return (
    <div className="pb-8 text-white">
      <div className="pb-6 pt-2">
        <h1 className="text-3xl font-semibold tracking-tight">Peptides</h1>
        <p className="text-slate-400">Reconstitution • Dosing • Protocols</p>
      </div>

      <div className="mb-8">
        <ReconstitutionGuide variant="peptides" />
      </div>

      <div className="mb-6">
        <h2 className="mb-4 font-medium">Your Stack</h2>

        {stackCards.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
            <p className="text-sm text-slate-400">
              No peptides in your stack yet. Add one below.
            </p>
          </div>
        ) : (
          stackCards.map(({ peptide, nextDose, frequency, doneToday, scheduledToday }) => {
            const protocol = peptide.protocol
            const vial =
              peptide.vialSize ??
              (peptide.protocol?.vialMg != null
                ? `${peptide.protocol.vialMg}mg`
                : '—')
            const concentration = protocol?.concentrationLabel ?? '—'
            const reconstituted = protocol?.reconstituted ?? false
            const hasSelection = Boolean(findSelection(peptide))

            return (
              <div
                key={peptide.id}
                className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xl font-semibold">{peptide.name}</div>
                    <div className="text-sm text-slate-400">
                      {vial} vial • {concentration}
                    </div>
                  </div>
                  <label className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={reconstituted}
                      disabled={!hasSelection}
                      onChange={(e) =>
                        toggleReconstituted(peptide, e.target.checked)
                      }
                      className="h-4 w-4 rounded border-white/20 bg-transparent text-emerald-500 focus:ring-emerald-500/40 disabled:opacity-40"
                      aria-label={`${peptide.name} reconstituted`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        reconstituted ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      Reconstituted
                    </span>
                  </label>
                </div>

                {!reconstituted && (
                  <p className="mt-3 text-xs text-amber-400/90">
                    Not activated — check the box once you&apos;ve mixed with BAC
                    per protocol. Your injection schedule unlocks when reconstituted.
                  </p>
                )}

                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400">Next Dose</div>
                    <div className="font-medium">{nextDose}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Frequency</div>
                    <div className="font-medium">{frequency}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleInjection(today, peptide.id)}
                  disabled={
                    !reconstituted || (!scheduledToday && !doneToday)
                  }
                  className={`mt-6 w-full rounded-2xl py-3.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                    doneToday
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-emerald-500 text-black hover:bg-emerald-600'
                  }`}
                >
                  {doneToday
                    ? '✓ Logged Today'
                    : !reconstituted
                      ? 'Reconstitute vial first'
                      : scheduledToday
                        ? 'Log Injection'
                        : 'Not scheduled today'}
                </button>
              </div>
            )
          })
        )}
      </div>

      <div className="mb-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-3 text-sm font-medium text-slate-200">
            Add another peptide
          </div>

          {availableCatalogPeptides.length === 0 ? (
            <p className="text-sm text-slate-400">All catalog peptides added.</p>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {availableCatalogPeptides.map((entry) => {
                const isAdding = addingPeptideId === entry.id
                return (
                  <button
                    key={entry.id}
                    type="button"
                    disabled={addingPeptideId != null}
                    onClick={() => void addPeptideFromCatalog(entry.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-left transition-colors hover:border-emerald-500/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-white">{entry.name}</div>
                      <div className="truncate text-xs text-slate-400">
                        {entry.tagline}
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-emerald-400">
                      {!isAdding && <Plus size={14} strokeWidth={2.5} />}
                      {isAdding ? 'Adding…' : 'Add'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {addError && <p className="mt-3 text-sm text-red-400">{addError}</p>}
          {addSuccess && (
            <p className="mt-3 text-sm text-emerald-400">{addSuccess}</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-medium">Quick Tools</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setShowSites(false)
              setShowCalculator((v) => !v)
            }}
            className="h-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition-colors hover:bg-white/10"
          >
            <div className="mb-1 text-emerald-400">📏</div>
            <div className="font-medium">Dose Calculator</div>
            <div className="mt-1 text-xs text-slate-400">Vial → Syringe units</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowCalculator(false)
              setShowSites((v) => !v)
            }}
            className="h-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition-colors hover:bg-white/10"
          >
            <div className="mb-1 text-emerald-400">📍</div>
            <div className="font-medium">Injection Sites</div>
            <div className="mt-1 text-xs text-slate-400">Rotation tracker</div>
          </button>
        </div>

        {showCalculator && (
          <div className="mt-3">
            <DoseCalculator
              key={calculatorPeptide?.id ?? 'default'}
              peptides={peptides}
              onLogDose={async (log) => {
                await addInjectionLog(log)
                setAddSuccess(
                  `Logged ${log.doseMg}mg (${log.units} units) of ${log.peptideName}`
                )
                setTimeout(() => setAddSuccess(null), 3000)
              }}
              {...calculatorDefaults}
            />
          </div>
        )}

        {showSites && (
          <div className="mt-3">
            <InjectionSiteMap />
          </div>
        )}
      </div>
    </div>
  )
}