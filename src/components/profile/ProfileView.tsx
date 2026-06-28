import { Check, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Peptide, PeptideFrequency, Profile, TrackerState } from '../../types'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'

interface ProfileViewProps {
  state: TrackerState
  onSaveProfile: (profile: Profile, peptides: Peptide[]) => void
}

function newPeptide(): Peptide {
  return {
    id: crypto.randomUUID(),
    name: '',
    dose: '',
    frequency: 'daily',
    timing: '',
    notes: '',
  }
}

type DraftProfile = Omit<
  Profile,
  'currentWeight' | 'goalWeight' | 'weeklyLossTarget'
> & {
  currentWeight: string
  goalWeight: string
  weeklyLossTarget: string
}

function profileToDraft(profile: Profile): DraftProfile {
  return {
    ...profile,
    currentWeight: String(profile.currentWeight),
    goalWeight: String(profile.goalWeight),
    weeklyLossTarget: String(profile.weeklyLossTarget),
  }
}

function draftToProfile(draft: DraftProfile): Profile | null {
  const currentWeight = parseFloat(draft.currentWeight)
  const goalWeight = parseFloat(draft.goalWeight)
  const weeklyLossTarget = parseFloat(draft.weeklyLossTarget)

  if (isNaN(currentWeight) || isNaN(goalWeight) || isNaN(weeklyLossTarget)) {
    return null
  }

  return {
    ...draft,
    currentWeight,
    goalWeight,
    weeklyLossTarget,
  }
}

function isDraftDirty(draft: DraftProfile, saved: Profile): boolean {
  return (
    draft.currentWeight !== String(saved.currentWeight) ||
    draft.goalWeight !== String(saved.goalWeight) ||
    draft.weeklyLossTarget !== String(saved.weeklyLossTarget) ||
    draft.height !== saved.height ||
    draft.startDate !== saved.startDate
  )
}

function clonePeptides(peptides: Peptide[]): Peptide[] {
  return peptides.map((p) => ({ ...p }))
}

export function ProfileView({ state, onSaveProfile }: ProfileViewProps) {
  const [draftProfile, setDraftProfile] = useState(() =>
    profileToDraft(state.profile)
  )
  const [draftPeptides, setDraftPeptides] = useState(() =>
    clonePeptides(state.peptides)
  )
  const [justSaved, setJustSaved] = useState(false)

  const profileDirty = isDraftDirty(draftProfile, state.profile)
  const peptidesDirty = useMemo(
    () => JSON.stringify(draftPeptides) !== JSON.stringify(state.peptides),
    [draftPeptides, state.peptides]
  )
  const isDirty = profileDirty || peptidesDirty
  const isValid = draftToProfile(draftProfile) !== null

  const updatePeptide = (id: string, patch: Partial<Peptide>) => {
    setDraftPeptides((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    )
  }

  const removePeptide = (id: string) => {
    setDraftPeptides((prev) => prev.filter((p) => p.id !== id))
  }

  const handleSave = () => {
    const profile = draftToProfile(draftProfile)
    if (!profile) return
    onSaveProfile(profile, draftPeptides)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2500)
  }

  return (
    <div className="space-y-6 pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Profile & Stack</h2>
          <p className="mt-1 text-sm text-slate-400">
            Configure your stats and peptide protocol
          </p>
        </div>
        {isDirty && (
          <span className="text-xs font-medium text-amber-400">
            Unsaved changes
          </span>
        )}
      </div>

      <Card title="Body Stats">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Current Weight (lbs)"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 195"
            value={draftProfile.currentWeight}
            onChange={(e) =>
              setDraftProfile((p) => ({
                ...p,
                currentWeight: e.target.value,
              }))
            }
          />
          <Input
            label="Goal Weight (lbs)"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 175"
            value={draftProfile.goalWeight}
            onChange={(e) =>
              setDraftProfile((p) => ({
                ...p,
                goalWeight: e.target.value,
              }))
            }
          />
          <Input
            label="Height (optional)"
            placeholder={`e.g. 5'11"`}
            value={draftProfile.height ?? ''}
            onChange={(e) =>
              setDraftProfile((p) => ({ ...p, height: e.target.value }))
            }
          />
          <Input
            label="Start Date"
            type="date"
            value={draftProfile.startDate}
            onChange={(e) =>
              setDraftProfile((p) => ({ ...p, startDate: e.target.value }))
            }
          />
          <Input
            label="Expected Weekly Loss (lbs)"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 0.875"
            value={draftProfile.weeklyLossTarget}
            onChange={(e) =>
              setDraftProfile((p) => ({
                ...p,
                weeklyLossTarget: e.target.value,
              }))
            }
          />
        </div>
      </Card>

      <Card
        title="Peptide Stack"
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setDraftPeptides((prev) => [...prev, newPeptide()])
            }
          >
            <Plus size={14} />
            Add Peptide
          </Button>
        }
      >
        <div className="space-y-4">
          {draftPeptides.length === 0 && (
            <p className="text-sm text-slate-500">
              No peptides in your stack. Tap Add Peptide to get started.
            </p>
          )}
          {draftPeptides.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-slate-800 bg-navy-950/50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-teal-400">
                  {p.name || 'New Peptide'}
                </span>
                <button
                  type="button"
                  onClick={() => removePeptide(p.id)}
                  className="text-slate-600 transition-colors hover:text-red-400"
                  aria-label="Remove peptide"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Name"
                  value={p.name}
                  onChange={(e) =>
                    updatePeptide(p.id, { name: e.target.value })
                  }
                />
                <Input
                  label="Dose"
                  placeholder="e.g. 2mg"
                  value={p.dose}
                  onChange={(e) =>
                    updatePeptide(p.id, { dose: e.target.value })
                  }
                />
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                    Frequency
                  </span>
                  <select
                    value={p.frequency}
                    onChange={(e) =>
                      updatePeptide(p.id, {
                        frequency: e.target.value as PeptideFrequency,
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-navy-950 px-3 py-2.5 text-base text-slate-100 focus:border-teal-500/60 focus:outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </label>
                <Input
                  label="Timing"
                  placeholder="e.g. Morning fasted"
                  value={p.timing ?? ''}
                  onChange={(e) =>
                    updatePeptide(p.id, { timing: e.target.value })
                  }
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Notes"
                    value={p.notes ?? ''}
                    onChange={(e) =>
                      updatePeptide(p.id, { notes: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="sticky bottom-20 z-40 rounded-xl border border-slate-800 bg-navy-900/95 p-4 shadow-lg backdrop-blur-md lg:bottom-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {isDirty
              ? 'Tap Save to apply changes across the app.'
              : 'All changes saved.'}
          </p>
          <div className="flex items-center gap-3">
            {justSaved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                <Check size={16} />
                Saved!
              </span>
            )}
            <Button
              onClick={handleSave}
              disabled={!isDirty || !isValid}
              className="w-full sm:w-auto"
            >
              Save Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}