import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import {
  DEFAULT_BAC_WATER,
  getCatalogEntry,
  PEPTIDE_CATALOG,
  type PeptideSelection,
} from '../../constants/peptideCatalog'
import {
  AGE_OPTIONS,
  GENDER_OPTIONS,
  TRAINING_OPTIONS,
  type FamiliarityLevel,
  type Gender,
} from '../../types/auth'
import {
  DatabaseSetupPanel,
  isDatabaseSetupError,
} from './DatabaseSetupPanel'
import { MedicalDisclaimer } from '../layout/MedicalDisclaimer'
import { OnboardingProgress } from './OnboardingProgress'

const STEPS = [
  { id: 1, label: 'Experience' },
  { id: 2, label: 'Goals' },
  { id: 3, label: 'Peptides' },
  { id: 4, label: 'Body Stats' },
  { id: 5, label: 'About You' },
] as const

const GOALS = [
  'Fat loss',
  'Muscle gain',
  'Body recomposition',
  'Recovery & healing',
  'Performance',
  'Longevity',
]

const EXPERIENCE_LEVELS: { label: string; value: FamiliarityLevel }[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
]

const QUICK_PEPTIDE_IDS = [
  'retatrutide',
  'tesamorelin',
  'bpc157',
  'aod9604',
  'semaglutide',
  'tirzepatide',
]

const QUICK_PEPTIDES = QUICK_PEPTIDE_IDS.map((id) => getCatalogEntry(id)).filter(
  (entry): entry is NonNullable<typeof entry> => entry != null
)

const FIELD_CLASS =
  'mt-1 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-base text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none'

const SELECT_CLASS = `${FIELD_CLASS} appearance-none`

const CHOICE_CLASS = (selected: boolean) =>
  `w-full rounded-2xl border p-4 text-left transition-all ${
    selected
      ? 'border-emerald-500 bg-emerald-500/10'
      : 'border-white/10 hover:border-white/30'
  }`

export interface OnboardingCompleteData {
  familiarity: FamiliarityLevel
  selectedGoals: string[]
  customGoal: string
  peptideSelections: PeptideSelection[]
  currentWeight: string
  goalWeight: string
  gender: Gender
  age: number
  selectedTraining: string[]
  additionalInfo: string
  username: string
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingCompleteData) => Promise<{ error: string | null }>
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [showComplete, setShowComplete] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [familiarity, setFamiliarity] = useState<FamiliarityLevel | ''>('')
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['Body recomposition'])
  const [customGoal, setCustomGoal] = useState('')
  const [peptideSelections, setPeptideSelections] = useState<PeptideSelection[]>([])
  const [currentWeight, setCurrentWeight] = useState('')
  const [goalWeight, setGoalWeight] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [age, setAge] = useState<number | ''>('')
  const [selectedTraining, setSelectedTraining] = useState<string[]>([])
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [username, setUsername] = useState('')

  const totalSteps = STEPS.length

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    )
  }

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

  const togglePeptide = (catalogId: string) => {
    const exists = peptideSelections.some((p) => p.catalogId === catalogId)
    if (exists) {
      setPeptideSelections((prev) => prev.filter((p) => p.catalogId !== catalogId))
      return
    }
    const entry = getCatalogEntry(catalogId)
    if (!entry) return
    setPeptideSelections((prev) => [
      ...prev,
      {
        catalogId,
        dose: entry.defaultDose,
        status: 'using',
        bacWaterUnits: DEFAULT_BAC_WATER,
        reconstituted: false,
      },
    ])
  }

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return familiarity !== ''
      case 2:
        return selectedGoals.length > 0 || customGoal.trim().length > 0
      case 3:
        return peptideSelections.length > 0
      case 4:
        return (
          currentWeight !== '' &&
          goalWeight !== '' &&
          !isNaN(parseFloat(currentWeight)) &&
          !isNaN(parseFloat(goalWeight))
        )
      case 5:
        return (
          gender !== '' &&
          age !== '' &&
          selectedTraining.length > 0 &&
          username.trim().length >= 3
        )
      default:
        return true
    }
  }

  const back = () => {
    if (showComplete) {
      setShowComplete(false)
      return
    }
    if (currentStep > 1) setCurrentStep((s) => s - 1)
  }

  const next = () => {
    if (!canContinue()) return
    setError('')

    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1)
      return
    }

    setShowComplete(true)
  }

  const handleEnterApp = async () => {
    if (familiarity === '' || gender === '' || age === '') return

    setError('')
    setLoading(true)

    const { error: err } = await onComplete({
      familiarity,
      selectedGoals,
      customGoal,
      peptideSelections,
      currentWeight,
      goalWeight,
      gender,
      age: age as number,
      selectedTraining,
      additionalInfo,
      username: username.trim().toLowerCase(),
    })

    setLoading(false)
    if (err) setError(err)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto w-full max-w-lg">
        <OnboardingProgress
          currentStep={showComplete ? totalSteps : currentStep}
          totalSteps={totalSteps}
          stepLabels={STEPS.map((s) => s.label)}
        />
      </div>

      <div className="mx-auto w-full max-w-lg px-6 pt-6 pb-32">
        {!showComplete && currentStep === 1 && (
          <div>
            <h2 className="mb-2 text-2xl font-semibold">Peptide experience</h2>
            <p className="mb-6 text-slate-400">
              How familiar are you with peptides?
            </p>

            {EXPERIENCE_LEVELS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFamiliarity(value)}
                className={`mb-3 ${CHOICE_CLASS(familiarity === value)}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {!showComplete && currentStep === 2 && (
          <div>
            <h2 className="mb-2 text-2xl font-semibold">Your goals</h2>
            <p className="mb-6 text-slate-400">Select all that apply</p>

            {GOALS.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => toggleGoal(goal)}
                className={`mb-3 ${CHOICE_CLASS(selectedGoals.includes(goal))}`}
              >
                {goal}
              </button>
            ))}

            <div className="mt-4">
              <label className="text-sm text-slate-400">
                Anything else? (optional)
              </label>
              <textarea
                className={`${FIELD_CLASS} mt-2 min-h-[96px] resize-y`}
                placeholder="e.g. Better sleep, clearer skin…"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
              />
            </div>
          </div>
        )}

        {!showComplete && currentStep === 3 && (
          <div>
            <h2 className="mb-2 text-2xl font-semibold">Your peptides</h2>
            <p className="mb-6 text-slate-400">
              Select peptides you&apos;re using or interested in
            </p>

            {QUICK_PEPTIDES.map((entry) => {
              const selected = peptideSelections.some(
                (p) => p.catalogId === entry.id
              )
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => togglePeptide(entry.id)}
                  className={`mb-3 flex w-full items-center justify-between ${CHOICE_CLASS(selected)}`}
                >
                  <span>{entry.name}</span>
                  {selected && <Check className="text-emerald-400" size={18} />}
                </button>
              )
            })}

            <p className="mt-4 text-xs text-slate-500">
              You can add doses and reconstitution details after onboarding.
              {PEPTIDE_CATALOG.length > QUICK_PEPTIDES.length &&
                ' More peptides are available in your profile later.'}
            </p>
          </div>
        )}

        {!showComplete && currentStep === 4 && (
          <div>
            <h2 className="mb-6 text-2xl font-semibold">Body stats</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">
                  Current Weight (lbs)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`${FIELD_CLASS} text-xl tabular-nums`}
                  placeholder="176"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Goal Weight (lbs)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`${FIELD_CLASS} text-xl tabular-nums`}
                  placeholder="160"
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {!showComplete && currentStep === 5 && (
          <div>
            <h2 className="mb-6 text-2xl font-semibold">About you</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Gender</label>
                <select
                  className={SELECT_CLASS}
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender | '')}
                >
                  <option value="" disabled>
                    Select gender
                  </option>
                  {GENDER_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-400">Age</label>
                <select
                  className={SELECT_CLASS}
                  value={age}
                  onChange={(e) =>
                    setAge(e.target.value ? Number(e.target.value) : '')
                  }
                >
                  <option value="" disabled>
                    Select age
                  </option>
                  {AGE_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-sm text-slate-400">Training</p>
                <p className="mb-2 text-xs text-slate-500">Select all that apply</p>
                <div className="grid grid-cols-2 gap-2">
                  {TRAINING_OPTIONS.map((activity) => (
                    <button
                      key={activity}
                      type="button"
                      onClick={() => toggleTraining(activity)}
                      className={`rounded-2xl border px-3 py-2.5 text-left text-sm transition-all ${
                        selectedTraining.includes(activity)
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      {activity}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400">Username</label>
                <input
                  type="text"
                  autoComplete="username"
                  className={FIELD_CLASS}
                  placeholder="e.g. lxrdgatsby"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))
                  }
                />
                <p className="mt-1 text-xs text-slate-500">
                  Letters, numbers, and underscores only. Min 3 characters.
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-400">
                  Tell us more? (optional)
                </label>
                <textarea
                  className={`${FIELD_CLASS} min-h-[96px] resize-y`}
                  placeholder="e.g. 16:8 fasting, high protein, 8k steps daily…"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {showComplete && (
          <div className="py-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="text-emerald-400" size={32} />
            </div>
            <h2 className="mb-3 text-3xl font-semibold">You&apos;re all set!</h2>
            <p className="mx-auto mb-8 max-w-xs text-slate-400">
              Your personalized 90-day recomp plan is ready. Let&apos;s get started.
            </p>

            <button
              type="button"
              onClick={handleEnterApp}
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-500 py-4 text-lg font-medium text-black transition-colors hover:bg-emerald-600 disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Enter PeptideTracker'}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-red-400">{error}</p>
            {isDatabaseSetupError(error) && <DatabaseSetupPanel />}
          </div>
        )}
      </div>

      {!showComplete && (
        <div className="fixed right-0 bottom-0 left-0 border-t border-white/10 bg-[#0a0a0a] px-6 pt-3 pb-4">
          <div className="mx-auto mb-3 max-w-lg">
            <MedicalDisclaimer compact />
          </div>
          <div className="mx-auto flex max-w-lg gap-3">
            <button
              type="button"
              onClick={back}
              disabled={currentStep === 1}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/20 py-3.5 transition-colors disabled:opacity-40"
            >
              <ArrowLeft size={18} /> Back
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!canContinue()}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 font-medium text-black transition-colors disabled:opacity-40"
            >
              {currentStep === totalSteps ? 'Finish Setup' : 'Continue'}{' '}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}