import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { completeOnboarding, isUsernameAvailable } from '../lib/profileService'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import {
  DatabaseSetupPanel,
  isDatabaseSetupError,
} from '../components/onboarding/DatabaseSetupPanel'
import { OnboardingProgress } from '../components/onboarding/OnboardingProgress'
import { PeptideSelector } from '../components/onboarding/PeptideSelector'
import { MedicalDisclaimer } from '../components/layout/MedicalDisclaimer'
import {
  formatPeptideSelections,
  type PeptideSelection,
} from '../constants/peptideCatalog'
import type { FamiliarityLevel, Gender, Questionnaire } from '../types/auth'
import {
  AGE_OPTIONS,
  GENDER_OPTIONS,
  TRAINING_OPTIONS,
  serializeTrainingActivities,
} from '../types/auth'

const SELECT_CLASS =
  'w-full rounded-xl border border-slate-700 bg-navy-950 px-4 py-3 text-base text-slate-100 focus:border-teal-500/60 focus:outline-none'

const STEPS = [
  {
    id: 'familiarity',
    title: 'Peptide experience',
    subtitle: 'How familiar are you with peptides?',
  },
  {
    id: 'goal',
    title: 'Your goals',
    subtitle: 'Select all that apply',
  },
  {
    id: 'peptides',
    title: 'Your peptides',
    subtitle: "Select which peptides you're currently on and milligram",
  },
  {
    id: 'weight',
    title: 'Body stats',
    subtitle: 'Current and goal weight',
  },
  {
    id: 'info',
    title: 'About you',
    subtitle: 'A few details to personalize your experience',
  },
  {
    id: 'username',
    title: 'Choose a username',
    subtitle: 'This is how you appear in the app',
  },
] as const

const STEP_LABELS = ['Experience', 'Goals', 'Peptides', 'Stats', 'About', 'Username']

const GOALS = [
  'Fat loss',
  'Muscle gain',
  'Body recomposition',
  'Performance',
  'Recovery & healing',
  'Longevity',
]

export function OnboardingPage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [familiarity, setFamiliarity] = useState<FamiliarityLevel>('beginner')
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['Body recomposition'])
  const [customGoal, setCustomGoal] = useState('')

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    )
  }
  const [peptideSelections, setPeptideSelections] = useState<PeptideSelection[]>([])
  const [currentWeight, setCurrentWeight] = useState('')
  const [goalWeight, setGoalWeight] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [age, setAge] = useState<number | ''>('')
  const [selectedTraining, setSelectedTraining] = useState<string[]>([])
  const [additionalInfo, setAdditionalInfo] = useState('')

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
  const [username, setUsername] = useState('')

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const canNext = () => {
    switch (current.id) {
      case 'weight':
        return (
          currentWeight !== '' &&
          goalWeight !== '' &&
          !isNaN(parseFloat(currentWeight)) &&
          !isNaN(parseFloat(goalWeight))
        )
      case 'peptides':
        return peptideSelections.length > 0
      case 'goal':
        return selectedGoals.length > 0 || customGoal.trim().length > 0
      case 'info':
        return gender !== '' && age !== '' && selectedTraining.length > 0
      case 'username':
        return username.trim().length >= 3
      default:
        return true
    }
  }

  const handleFinish = async () => {
    if (!user) return
    setError('')
    setLoading(true)

    const name = username.trim().toLowerCase()
    const { available, error: usernameError } = await isUsernameAvailable(name)
    if (usernameError) {
      setError(usernameError)
      setLoading(false)
      return
    }
    if (!available) {
      setError('Username is already taken')
      setLoading(false)
      return
    }

    const goals = [
      ...selectedGoals,
      ...(customGoal.trim() ? [customGoal.trim()] : []),
    ]

    const questionnaire: Questionnaire = {
      familiarity,
      mainGoal: goals.join(', '),
      peptideSelections,
      interestedPeptides: formatPeptideSelections(peptideSelections),
      currentWeight: parseFloat(currentWeight),
      goalWeight: parseFloat(goalWeight),
      gender: gender as Gender,
      age: age as number,
      trainingActivities: serializeTrainingActivities(selectedTraining),
      additionalInfo,
    }

    const { error: err } = await completeOnboarding(user.id, name, questionnaire)
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    await refreshProfile()
    navigate('/app')
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy-950">
      <div className="mx-auto w-full max-w-lg border-b border-slate-800">
        <OnboardingProgress
          currentStep={step + 1}
          totalSteps={STEPS.length}
          stepLabels={STEP_LABELS}
        />
      </div>

      <div className="flex flex-1 flex-col px-6 py-8">
        <div className="mx-auto w-full max-w-lg">
          <h2 className="text-2xl font-bold text-white">{current.title}</h2>
          <p className="mt-1 text-slate-400">{current.subtitle}</p>

          <div className="mt-8 space-y-4">
            {current.id === 'familiarity' && (
              <div className="space-y-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFamiliarity(level)}
                    className={`w-full rounded-xl border px-4 py-3 text-left capitalize transition-colors ${
                      familiarity === level
                        ? 'border-teal-500/50 bg-teal-500/10 text-teal-400'
                        : 'border-slate-800 bg-navy-900 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            )}

            {current.id === 'goal' && (
              <div className="space-y-2">
                {GOALS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGoal(g)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                      selectedGoals.includes(g)
                        ? 'border-teal-500/50 bg-teal-500/10 text-teal-400'
                        : 'border-slate-800 bg-navy-900 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
                <Input
                  label="Anything else? (optional)"
                  placeholder="e.g. Improve sleep, joint health…"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Tap goals to select or deselect. You can pick more than one.
                </p>
              </div>
            )}

            {current.id === 'peptides' && (
              <PeptideSelector
                selections={peptideSelections}
                onChange={setPeptideSelections}
                familiarity={familiarity}
              />
            )}

            {current.id === 'weight' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Current weight (lbs)"
                  type="text"
                  inputMode="decimal"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                />
                <Input
                  label="Goal weight (lbs)"
                  type="text"
                  inputMode="decimal"
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                />
              </div>
            )}

            {current.id === 'info' && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-slate-300">Gender</span>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender | '')}
                      className={SELECT_CLASS}
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
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-slate-300">Age</span>
                    <select
                      value={age}
                      onChange={(e) =>
                        setAge(e.target.value ? Number(e.target.value) : '')
                      }
                      className={SELECT_CLASS}
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
                  </label>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-300">Training</p>
                  <p className="text-xs text-slate-500">Select all that apply</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TRAINING_OPTIONS.map((activity) => (
                      <button
                        key={activity}
                        type="button"
                        onClick={() => toggleTraining(activity)}
                        className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                          selectedTraining.includes(activity)
                            ? 'border-teal-500/50 bg-teal-500/10 text-teal-400'
                            : 'border-slate-800 bg-navy-900 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {activity}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-slate-300">
                    Tell Us More? (daily habits, eating regimen, etc.)
                  </span>
                  <textarea
                    className="w-full rounded-xl border border-slate-700 bg-navy-950 px-4 py-3 text-base text-slate-100 placeholder:text-slate-600 focus:border-teal-500/60 focus:outline-none"
                    rows={4}
                    placeholder="e.g. 16:8 fasting, high protein, 8k steps daily…"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                  />
                </label>
              </div>
            )}

            {current.id === 'username' && (
              <>
                <Input
                  label="Username"
                  placeholder="e.g. lxrdgatsby"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))
                  }
                  autoComplete="username"
                />
                <p className="text-xs text-slate-500">
                  Letters, numbers, and underscores only. Min 3 characters.
                </p>
              </>
            )}

            {error && (
              <div className="space-y-3">
                <p className="text-sm text-red-400">{error}</p>
                {isDatabaseSetupError(error) && <DatabaseSetupPanel />}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 px-6 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ChevronLeft size={16} />
            Back
          </Button>
          {isLast ? (
            <Button onClick={handleFinish} disabled={!canNext() || loading}>
              {loading ? 'Saving…' : 'Get Started'}
            </Button>
          ) : (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
            >
              Next
              <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </div>
      <MedicalDisclaimer />
    </div>
  )
}