import { Check, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { FamiliarityLevel, Gender } from '../../types/auth'
import {
  AGE_OPTIONS,
  GENDER_OPTIONS,
  TRAINING_OPTIONS,
  parseTrainingActivities,
  serializeTrainingActivities,
} from '../../types/auth'
import type { Peptide, PeptideFrequency, Profile, TrackerState } from '../../types'
import { AutoResizeTextarea } from '../ui/AutoResizeTextarea'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'

interface ProfileViewProps {
  state: TrackerState
  onSaveProfile: (
    profile: Profile,
    peptides: Peptide[],
    extras?: {
      familiarity?: string | null
      mainGoal?: string | null
      interestedPeptides?: string | null
      additionalInfo?: string | null
      gender?: string | null
      age?: number | null
      trainingActivities?: string | null
    }
  ) => void | Promise<void>
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
  const { userProfile, refreshProfile } = useAuth()
  const [draftProfile, setDraftProfile] = useState(() =>
    profileToDraft(state.profile)
  )
  const [draftPeptides, setDraftPeptides] = useState(() =>
    clonePeptides(state.peptides)
  )
  const [familiarity, setFamiliarity] = useState<FamiliarityLevel>(
    userProfile?.familiarity ?? 'beginner'
  )
  const [mainGoal, setMainGoal] = useState(userProfile?.mainGoal ?? '')
  const [interestedPeptides, setInterestedPeptides] = useState(
    userProfile?.interestedPeptides ?? ''
  )
  const [gender, setGender] = useState<Gender | ''>(
    userProfile?.gender ?? ''
  )
  const [age, setAge] = useState<number | ''>(userProfile?.age ?? '')
  const [selectedTraining, setSelectedTraining] = useState<string[]>(() =>
    parseTrainingActivities(userProfile?.trainingActivities)
  )
  const [additionalInfo, setAdditionalInfo] = useState(
    userProfile?.additionalInfo ?? ''
  )

  const toggleTraining = (activity: string) => {
    if (activity === 'Not training right now') {
      setSelectedTraining(['Not training right now'])
      return
    }
    setSelectedTraining((prev) => {
      const withoutNone = prev.filter((t) => t !== 'Not training right now')
      return withoutNone.includes(activity)
        ? withoutNone.filter((t) => t !== activity)
        : [...withoutNone, activity]
    })
  }
  const [justSaved, setJustSaved] = useState(false)
  const [saving, setLoading] = useState(false)

  const profileDirty = isDraftDirty(draftProfile, state.profile)
  const peptidesDirty = useMemo(
    () => JSON.stringify(draftPeptides) !== JSON.stringify(state.peptides),
    [draftPeptides, state.peptides]
  )
  const questionnaireDirty =
    familiarity !== (userProfile?.familiarity ?? 'beginner') ||
    mainGoal !== (userProfile?.mainGoal ?? '') ||
    interestedPeptides !== (userProfile?.interestedPeptides ?? '') ||
    gender !== (userProfile?.gender ?? '') ||
    age !== (userProfile?.age ?? '') ||
    serializeTrainingActivities(selectedTraining) !==
      (userProfile?.trainingActivities ?? '') ||
    additionalInfo !== (userProfile?.additionalInfo ?? '')
  const isDirty = profileDirty || peptidesDirty || questionnaireDirty
  const isValid = draftToProfile(draftProfile) !== null

  const updatePeptide = (id: string, patch: Partial<Peptide>) => {
    setDraftPeptides((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    )
  }

  const removePeptide = (id: string) => {
    setDraftPeptides((prev) => prev.filter((p) => p.id !== id))
  }

  const handleSave = async () => {
    const profile = draftToProfile(draftProfile)
    if (!profile) return
    setLoading(true)
    await onSaveProfile(profile, draftPeptides, {
      familiarity,
      mainGoal,
      interestedPeptides,
      additionalInfo,
      gender: gender || null,
      age: age === '' ? null : age,
      trainingActivities: serializeTrainingActivities(selectedTraining) || null,
    })
    await refreshProfile()
    setLoading(false)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2500)
  }

  return (
    <div>
      <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Profile & Stack</h2>
          <p className="mt-1 text-sm text-slate-400">
            Configure your stats and peptide protocol
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-xs font-medium text-amber-400">
              Unsaved changes
            </span>
          )}
          {justSaved && !isDirty && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <Check size={14} />
              Saved!
            </span>
          )}
        </div>
      </div>

      <Card title="Goals & Background">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
              Peptide familiarity
            </span>
            <select
              value={familiarity}
              onChange={(e) =>
                setFamiliarity(e.target.value as FamiliarityLevel)
              }
              className="w-full rounded-lg border border-slate-700 bg-navy-950 px-3 py-2.5 text-base text-slate-100 focus:border-teal-500/60 focus:outline-none"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
              Gender
            </span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender | '')}
              className="w-full rounded-lg border border-slate-700 bg-navy-950 px-3 py-2.5 text-base text-slate-100 focus:border-teal-500/60 focus:outline-none"
            >
              <option value="">Not set</option>
              {GENDER_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
              Age
            </span>
            <select
              value={age}
              onChange={(e) =>
                setAge(e.target.value ? Number(e.target.value) : '')
              }
              className="w-full rounded-lg border border-slate-700 bg-navy-950 px-3 py-2.5 text-base text-slate-100 focus:border-teal-500/60 focus:outline-none"
            >
              <option value="">Not set</option>
              {AGE_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <div className="space-y-2 sm:col-span-2">
            <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
              Training
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TRAINING_OPTIONS.map((activity) => (
                <button
                  key={activity}
                  type="button"
                  onClick={() => toggleTraining(activity)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    selectedTraining.includes(activity)
                      ? 'border-teal-500/50 bg-teal-500/10 text-teal-400'
                      : 'border-slate-700 bg-navy-950 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {activity}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <AutoResizeTextarea
              label="Main goal"
              minRows={3}
              value={mainGoal}
              onChange={(e) => setMainGoal(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <AutoResizeTextarea
              label="Peptides of interest"
              minRows={3}
              value={interestedPeptides}
              onChange={(e) => setInterestedPeptides(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <AutoResizeTextarea
              label="Tell us more (daily habits, eating regimen, etc.)"
              minRows={3}
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
            />
          </div>
        </div>
      </Card>

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
      </div>

      {(isDirty || saving) && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-navy-900/95 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Tap Save to apply changes across the app.
            </p>
            <Button
              onClick={handleSave}
              disabled={!isDirty || !isValid || saving}
              className="w-full sm:w-auto"
            >
              {saving ? 'Saving…' : 'Save Profile'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}