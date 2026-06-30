import { X } from 'lucide-react'
import {
  BAC_WATER_OPTIONS,
  PEPTIDE_CATALOG,
  recommendedBacWaterForVial,
  getCatalogEntry,
  type PeptideSelection,
  type PeptideUsageStatus,
} from '../../constants/peptideCatalog'
import type { FamiliarityLevel } from '../../types/auth'
import type { BacWaterUnits } from '../../types'
import { previewStartingDose } from '../../utils/recompProtocol'
import { ReconstitutionGuide } from '../peptides/ReconstitutionGuide'

const SELECT_CLASS =
  'w-full rounded-xl border border-slate-700 bg-navy-950 px-3 py-2.5 text-base text-slate-100 focus:border-teal-500/60 focus:outline-none'

const DOSE_SELECT_CLASS =
  'min-w-[5.5rem] rounded-lg border border-slate-700 bg-navy-950 px-2 py-2 text-sm text-slate-100 focus:border-teal-500/60 focus:outline-none'

interface PeptideSelectorProps {
  selections: PeptideSelection[]
  onChange: (selections: PeptideSelection[]) => void
  familiarity?: FamiliarityLevel
  variant?: 'default' | 'onboarding'
}

export function PeptideSelector({
  selections,
  onChange,
  familiarity = 'beginner',
  variant = 'default',
}: PeptideSelectorProps) {
  const isOnboarding = variant === 'onboarding'
  const fieldClass = isOnboarding
    ? 'w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-base text-white focus:border-emerald-500/50 focus:outline-none'
    : SELECT_CLASS
  const doseClass = isOnboarding
    ? 'min-w-[5.5rem] rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none'
    : DOSE_SELECT_CLASS
  const cardClass = isOnboarding
    ? 'rounded-2xl border border-white/10 bg-white/5 p-3'
    : 'rounded-xl border border-slate-800 bg-navy-900 p-3'
  const selectedIds = new Set(selections.map((s) => s.catalogId))
  const available = PEPTIDE_CATALOG.filter((p) => !selectedIds.has(p.id))

  const addPeptide = (catalogId: string) => {
    const entry = getCatalogEntry(catalogId)
    if (!entry) return
    onChange([
      ...selections,
      {
        catalogId,
        dose: entry.defaultDose,
        status: 'interested',
        bacWaterUnits: recommendedBacWaterForVial(entry.defaultDose),
        reconstituted: false,
      },
    ])
  }

  const updateSelection = (catalogId: string, patch: Partial<PeptideSelection>) => {
    onChange(
      selections.map((s) => (s.catalogId === catalogId ? { ...s, ...patch } : s))
    )
  }

  const removeSelection = (catalogId: string) => {
    onChange(selections.filter((s) => s.catalogId !== catalogId))
  }

  return (
    <div className="space-y-4">
      {!isOnboarding && <ReconstitutionGuide />}

      <label className="block space-y-1.5">
        <span className={`text-sm font-medium ${isOnboarding ? 'text-slate-300' : 'text-slate-300'}`}>
          Add your peptides
        </span>
        <select
          className={fieldClass}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              addPeptide(e.target.value)
              e.target.value = ''
            }
          }}
        >
          <option value="" disabled>
            {available.length > 0 ? 'Choose your peptides…' : 'All peptides added'}
          </option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.tagline}
            </option>
          ))}
        </select>
      </label>

      {selections.length === 0 ? (
        <p
          className={`rounded-xl border border-dashed px-4 py-6 text-center text-sm text-slate-500 ${
            isOnboarding ? 'border-white/10' : 'border-slate-800'
          }`}
        >
          Add at least one peptide to continue. You can select as many as you
          like from the dropdown.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            For each peptide: pick vial size, how much BAC water you will use to
            reconstitute (100 / 200 / 300 units), and whether you are using it or
            just interested.
          </p>
          {selections.map((selection) => {
            const entry = getCatalogEntry(selection.catalogId)
            if (!entry) return null
            const preview = previewStartingDose(selection, familiarity)
            return (
              <div
                key={selection.catalogId}
                className={cardClass}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{entry.name}</p>
                    <p className="text-xs text-slate-500">{entry.tagline}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSelection(selection.catalogId)}
                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-400"
                    aria-label={`Remove ${entry.name}`}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs text-slate-500">Vial size</label>
                    <select
                      value={selection.dose}
                      onChange={(e) => {
                        const dose = e.target.value
                        updateSelection(selection.catalogId, {
                          dose,
                          bacWaterUnits: recommendedBacWaterForVial(dose),
                        })
                      }}
                      className={doseClass}
                      aria-label={`${entry.name} vial size`}
                    >
                      {entry.doseOptions.map((dose) => (
                        <option key={dose} value={dose}>
                          {dose} vial
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-medium text-slate-400">
                      BAC water for reconstitution
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {BAC_WATER_OPTIONS.map((units) => (
                        <button
                          key={units}
                          type="button"
                          onClick={() =>
                            updateSelection(selection.catalogId, {
                              bacWaterUnits: units as BacWaterUnits,
                            })
                          }
                          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                            selection.bacWaterUnits === units
                              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                              : isOnboarding
                                ? 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                                : 'border-slate-700 bg-navy-950 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          {units} units ({units / 100}ml)
                        </button>
                      ))}
                    </div>
                  </div>

                  <StatusToggle
                    status={selection.status}
                    onChange={(status) =>
                      updateSelection(selection.catalogId, { status })
                    }
                  />

                  {preview && (
                    <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 px-3 py-2 text-xs">
                      <p className="font-medium text-teal-300">
                        Week 1 starting dose: draw {preview.syringeUnits} units
                        on U-100 syringe
                      </p>
                      <p className="mt-1 text-slate-400">{preview.summary}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatusToggle({
  status,
  onChange,
}: {
  status: PeptideUsageStatus
  onChange: (status: PeptideUsageStatus) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">Status</span>
      <div className="flex rounded-lg border border-slate-700 p-0.5">
        {(['using', 'interested'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              status === value
                ? 'bg-teal-500/20 text-teal-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {value === 'using' ? 'Using' : 'Interested'}
          </button>
        ))}
      </div>
    </div>
  )
}