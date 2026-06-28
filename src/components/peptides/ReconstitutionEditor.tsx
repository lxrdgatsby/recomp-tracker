import { useAuth } from '../../contexts/AuthContext'
import type { BacWaterUnits, TrackerState } from '../../types'
import { BAC_WATER_OPTIONS } from '../../constants/peptideCatalog'
import { generateRecompPlan, normalizeSelection } from '../../utils/recompProtocol'
import { ReconstitutionGuide } from './ReconstitutionGuide'

interface ReconstitutionEditorProps {
  state: TrackerState
  onUpdate: (state: TrackerState, selections: ReturnType<typeof normalizeSelection>[]) => void
}

export function ReconstitutionEditor({ state, onUpdate }: ReconstitutionEditorProps) {
  const { userProfile } = useAuth()
  const selections = (userProfile?.peptideSelections ?? []).map(normalizeSelection)

  if (selections.length === 0) return null

  const updateSelection = (
    catalogId: string,
    patch: Partial<(typeof selections)[0]>
  ) => {
    if (!userProfile) return
    const updated = selections.map((s) =>
      s.catalogId === catalogId ? { ...s, ...patch } : s
    )
    const { peptides, recompPlan } = generateRecompPlan({
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
    onUpdate({ ...state, peptides, recompPlan }, updated)
  }

  return (
    <div className="space-y-4">
      <ReconstitutionGuide />
      <div className="space-y-3">
        {selections.map((sel) => {
          const peptide = state.peptides.find((p) => p.id === sel.catalogId)
          const proto = peptide?.protocol
          return (
            <div
              key={sel.catalogId}
              className="rounded-xl border border-slate-800 bg-navy-900 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-white">
                  {peptide?.name ?? sel.catalogId} · {sel.dose} vial
                </p>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={sel.reconstituted}
                    onChange={(e) =>
                      updateSelection(sel.catalogId, {
                        reconstituted: e.target.checked,
                      })
                    }
                    className="rounded border-slate-600 bg-navy-950 text-teal-500 focus:ring-teal-500/40"
                  />
                  Reconstituted
                </label>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                How much bacteriostatic water did you add?
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {BAC_WATER_OPTIONS.map((units) => (
                  <button
                    key={units}
                    type="button"
                    onClick={() =>
                      updateSelection(sel.catalogId, {
                        bacWaterUnits: units as BacWaterUnits,
                      })
                    }
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      sel.bacWaterUnits === units
                        ? 'border-teal-500/50 bg-teal-500/10 text-teal-400'
                        : 'border-slate-700 bg-navy-950 text-slate-300'
                    }`}
                  >
                    {units} units ({units / 100}ml)
                  </button>
                ))}
              </div>

              {proto && (
                <p className="mt-3 rounded-lg bg-navy-950/60 px-3 py-2 text-xs text-slate-400">
                  {proto.calculationSummary}
                </p>
              )}

              {!sel.reconstituted && (
                <p className="mt-2 text-xs text-amber-400/90">
                  Mark reconstituted once mixed — your injection schedule uses this
                  concentration.
                </p>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-xs text-slate-500">
        Changes save automatically and update your 90-day titration syringe units.
      </p>
    </div>
  )
}