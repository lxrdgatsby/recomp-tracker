import { format, parseISO, differenceInDays } from 'date-fns'
import { Plus, Syringe } from 'lucide-react'
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
import { generateRecompPlan, normalizeSelection } from '../../utils/recompProtocol'
import {
  getInjectionsForDate,
  isInjectionDone,
} from '../../utils/peptideSchedule'
import { formatSyringeUnits, getTitrationForDay } from '../../utils/recompProtocol'
import { DoseCalculator } from './DoseCalculator'
import { InjectionSiteMap } from './InjectionSiteMap'

interface PeptidesViewProps {
  state: TrackerState
  onToggleInjection: (date: string, peptideId: string) => void
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
  onUpdateReconstitution,
}: PeptidesViewProps) {
  const { userProfile } = useAuth()
  const { peptides } = state
  const today = format(new Date(), 'yyyy-MM-dd')
  const [showSites, setShowSites] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [peptidePicker, setPeptidePicker] = useState('')

  const availableCatalogPeptides = useMemo(() => {
    const addedNames = new Set(peptides.map((p) => p.name.trim().toLowerCase()))
    return PEPTIDE_CATALOG.filter(
      (entry) => !addedNames.has(entry.name.toLowerCase())
    )
  }, [peptides])

  const stackCards = useMemo(() => buildStackCards(state, today), [state, today])

  const selections = useMemo(
    () => (userProfile?.peptideSelections ?? []).map(normalizeSelection),
    [userProfile?.peptideSelections]
  )

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

  const addPeptideFromCatalog = (catalogId: string) => {
    const entry = getCatalogEntry(catalogId)
    if (!entry || !userProfile) return
    if (selections.some((s) => s.catalogId === catalogId)) return

    const updated = [
      ...selections,
      {
        catalogId: entry.id,
        dose: entry.defaultDose,
        status: 'using' as const,
        bacWaterUnits: recommendedBacWaterForVial(entry.defaultDose),
        reconstituted: false,
      },
    ]

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

  const calculatorPeptide = peptides.find((p) => p.protocol)
  const calculatorDefaults = useMemo(() => {
    const protocol = calculatorPeptide?.protocol
    if (!protocol) return {}
    return {
      initialVialMg: protocol.vialMg,
      initialBacWaterUnits: protocol.bacWaterUnits,
      initialTargetDoseMg: protocol.startingDoseMg,
    }
  }, [calculatorPeptide])

  return (
    <div className="pb-8 text-white">
      <div className="pb-6 pt-2">
        <h1 className="text-3xl font-semibold tracking-tight">Peptides</h1>
        <p className="text-slate-400">Reconstitution • Dosing • Protocols</p>
      </div>

      <div className="mb-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Syringe className="text-emerald-400" size={20} />
            </div>
            <div>
              <div className="font-medium">Reconstitution Guide</div>
              <div className="text-xs text-slate-400">
                U-100 syringe • 100 units = 1ml
              </div>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex gap-3">
              <div className="font-mono text-emerald-400">1.</div>
              <div>
                Add BAC water slowly down the vial wall. Swirl gently.{' '}
                <span className="text-emerald-400">Never shake.</span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="font-mono text-emerald-400">2.</div>
              <div>Refrigerate immediately for 30 minutes before first use.</div>
            </div>
            <div className="flex gap-3">
              <div className="font-mono text-emerald-400">3.</div>
              <div>Store in fridge (36–46°F). Use within 28–30 days.</div>
            </div>
          </div>
        </div>
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

      <div className="mt-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <label className="block space-y-2">
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-200">
              <Plus size={16} className="text-emerald-400" />
              Add another peptide
            </span>
            <select
              className="w-full appearance-none rounded-2xl border border-white/20 bg-black/40 px-4 py-3 text-base text-white focus:border-emerald-500/50 focus:outline-none"
              value={peptidePicker}
              onChange={(e) => {
                const catalogId = e.target.value
                if (!catalogId) return
                addPeptideFromCatalog(catalogId)
                setPeptidePicker('')
              }}
            >
              <option value="">
                {availableCatalogPeptides.length > 0
                  ? 'Choose your peptides…'
                  : 'All catalog peptides added'}
              </option>
              {availableCatalogPeptides.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name} — {entry.tagline}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  )
}