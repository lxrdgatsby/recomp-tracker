import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import {
  recommendedBacWaterForVial,
  getCatalogEntry,
  type PeptideSelection,
} from '../../constants/peptideCatalog'
import {
  getRecommendedPeptideIds,
  inferWeightGoalMode,
  ONBOARDING_GOALS,
} from '../../constants/onboardingGoals'
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
import { OnboardingGeneratingScreen } from './OnboardingGeneratingScreen'
import { OnboardingProgress } from './OnboardingProgress'
import { PeptideSelector } from './PeptideSelector'
import { ReconstitutionQuiz } from './ReconstitutionQuiz'

const STEPS = [
  { id: 1, label: 'Experience' },
  { id: 2, label: 'Goals' },
  { id: 3, label: 'Peptides' },
  { id: 4, label: 'Body Stats' },
  { id: 5, label: 'About You' },
] as const

type Phase =
  | 'experience'
  | 'reconstitution_gate'
  | 'reconstitution_quiz'
  | 'advanced_protocol'
  | 'goals'
  | 'peptides'
  | 'body_stats'
  | 'about'
  | 'generating'

const EXPERIENCE_LEVELS: { label: string; value: FamiliarityLevel }[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
]

const ADVANCED_YEARS = [
  'Less than 1 year',
  '1 year',
  '2 years',
  '3 years',
  '4–5 years',
  '6–10 years',
  '10+ years',
]

const FIELD_CLASS =
  'mt-1 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-base text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none'

const SELECT_CLASS = `${FIELD_CLASS} appearance-none`

const CHOICE_CLASS = (selected: boolean) =>
  `w-full rounded-2xl border p-4 text-left transition-all ${
    selected
      ? 'border-emerald-500 bg-emerald-500/10'
      : 'border-white/10 hover:border-white/30'
  }`

function phaseToStep(phase: Phase): number {
  switch (phase) {
    case 'experience':
    case 'reconstitution_gate':
    case 'reconstitution_quiz':
    case 'advanced_protocol':
      return 1
    case 'goals':
      return 2
    case 'peptides':
      return 3
    case 'body_stats':
      return 4
    case 'about':
    case 'generating':
      return 5
    default:
      return 1
  }
}

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
  reconstitutionEducated?: boolean
  advancedYearsOnPeptides?: string | null
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingCompleteData) => Promise<{ error: string | null }>
}

function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [phase, setPhase] = useState<Phase>('experience')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [familiarity, setFamiliarity] = useState<FamiliarityLevel | ''>('')
  const [knowsReconstitution, setKnowsReconstitution] = useState<boolean | null>(
    null
  )
  const [reconstitutionEducated, setReconstitutionEducated] = useState(false)
  const [advancedYears, setAdvancedYears] = useState('')
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [customGoal, setCustomGoal] = useState('')
  const [peptideSelections, setPeptideSelections] = useState<PeptideSelection[]>(
    []
  )
  const [currentWeight, setCurrentWeight] = useState('')
  const [goalWeight, setGoalWeight] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [age, setAge] = useState<number | ''>('')
  const [selectedTraining, setSelectedTraining] = useState<string[]>([])
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [username, setUsername] = useState('')

  const totalSteps = STEPS.length
  const progressStep = phaseToStep(phase)

  const allGoals = useMemo(
    () => [
      ...selectedGoals,
      ...(customGoal.trim() ? [customGoal.trim()] : []),
    ],
    [selectedGoals, customGoal]
  )

  const recommendedIds = useMemo(
    () => getRecommendedPeptideIds(allGoals),
    [allGoals]
  )

  const weightMode = useMemo(() => {
    const current = parseFloat(currentWeight)
    const goal = parseFloat(goalWeight)
    if (isNaN(current) || isNaN(goal)) return 'maintain' as const
    return inferWeightGoalMode(allGoals, current, goal)
  }, [allGoals, currentWeight, goalWeight])

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

  const addRecommendedPeptide = (catalogId: string) => {
    if (peptideSelections.some((p) => p.catalogId === catalogId)) return
    const entry = getCatalogEntry(catalogId)
    if (!entry) return
    setPeptideSelections((prev) => [
      ...prev,
      {
        catalogId,
        dose: entry.defaultDose,
        status: 'using',
        bacWaterUnits: recommendedBacWaterForVial(entry.defaultDose),
        reconstituted: false,
      },
    ])
  }

  const canContinue = () => {
    switch (phase) {
      case 'experience':
        return familiarity !== ''
      case 'reconstitution_gate':
        return knowsReconstitution !== null
      case 'reconstitution_quiz':
        return false
      case 'advanced_protocol':
        return advancedYears !== ''
      case 'goals':
        return selectedGoals.length > 0 || customGoal.trim().length > 0
      case 'peptides':
        return peptideSelections.length > 0
      case 'body_stats':
        return (
          currentWeight !== '' &&
          goalWeight !== '' &&
          !isNaN(parseFloat(currentWeight)) &&
          !isNaN(parseFloat(goalWeight))
        )
      case 'about':
        return (
          gender !== '' &&
          age !== '' &&
          selectedTraining.length > 0 &&
          username.trim().length >= 3
        )
      default:
        return false
    }
  }

  const back = () => {
    setError('')
    switch (phase) {
      case 'reconstitution_gate':
        setPhase('experience')
        break
      case 'reconstitution_quiz':
        setPhase('reconstitution_gate')
        break
      case 'advanced_protocol':
        setPhase('experience')
        break
      case 'goals':
        if (familiarity === 'beginner') {
          setPhase(
            knowsReconstitution ? 'reconstitution_gate' : 'reconstitution_quiz'
          )
        } else if (familiarity === 'advanced') {
          setPhase('advanced_protocol')
        } else {
          setPhase('experience')
        }
        break
      case 'peptides':
        setPhase('goals')
        break
      case 'body_stats':
        setPhase('peptides')
        break
      case 'about':
        setPhase('body_stats')
        break
      default:
        break
    }
  }

  const next = () => {
    if (!canContinue()) return
    setError('')

    if (phase === 'experience') {
      if (familiarity === 'beginner') setPhase('reconstitution_gate')
      else if (familiarity === 'advanced') setPhase('advanced_protocol')
      else setPhase('goals')
      return
    }

    if (phase === 'reconstitution_gate') {
      if (knowsReconstitution) setPhase('goals')
      else setPhase('reconstitution_quiz')
      return
    }

    if (phase === 'advanced_protocol') {
      setPhase('goals')
      return
    }

    if (phase === 'goals') {
      setPhase('peptides')
      return
    }

    if (phase === 'peptides') {
      setPhase('body_stats')
      return
    }

    if (phase === 'body_stats') {
      setPhase('about')
      return
    }

    if (phase === 'about') {
      void finishOnboarding()
    }
  }

  const finishOnboarding = async () => {
    if (familiarity === '' || gender === '' || age === '') return
    setPhase('generating')
    setError('')
    setLoading(true)

    await new Promise((r) => setTimeout(r, 2200))

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
      reconstitutionEducated:
        reconstitutionEducated || knowsReconstitution === true,
      advancedYearsOnPeptides:
        familiarity === 'advanced' ? advancedYears : null,
    })

    setLoading(false)
    if (err) {
      setPhase('about')
      setError(err)
    }
  }

  const showNav = phase !== 'generating' && phase !== 'reconstitution_quiz'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto w-full max-w-lg">
        <OnboardingProgress
          currentStep={progressStep}
          totalSteps={totalSteps}
          stepLabels={STEPS.map((s) => s.label)}
        />
      </div>

      <div className="mx-auto w-full max-w-lg px-6 pt-6 pb-32">
        {phase === 'experience' && (
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

        {phase === 'reconstitution_gate' && (
          <div>
            <h2 className="mb-2 text-2xl font-semibold">Reconstitution basics</h2>
            <p className="mb-6 text-slate-400">
              Are you familiar with how to reconstitute your peptide vial with
              bacteriostatic water?
            </p>
            <button
              type="button"
              onClick={() => setKnowsReconstitution(true)}
              className={`mb-3 ${CHOICE_CLASS(knowsReconstitution === true)}`}
            >
              Yes — I know how to reconstitute
            </button>
            <button
              type="button"
              onClick={() => setKnowsReconstitution(false)}
              className={CHOICE_CLASS(knowsReconstitution === false)}
            >
              No — teach me the basics
            </button>
          </div>
        )}

        {phase === 'reconstitution_quiz' && (
          <ReconstitutionQuiz
            onComplete={() => {
              setReconstitutionEducated(true)
              setPhase('goals')
            }}
          />
        )}

        {phase === 'advanced_protocol' && (
          <div>
            <h2 className="mb-2 text-2xl font-semibold">Your current protocol</h2>
            <p className="mb-4 text-slate-400">
              Tell us where you are in your peptide journey so we can tailor your
              tracker.
            </p>

            <label className="mb-6 block text-sm text-slate-400">
              How long have you been running peptides?
              <select
                className={SELECT_CLASS}
                value={advancedYears}
                onChange={(e) => setAdvancedYears(e.target.value)}
              >
                <option value="" disabled>
                  Select experience length
                </option>
                {ADVANCED_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>

            <p className="mb-3 text-sm text-slate-400">
              Which peptides are you currently on? (optional — you can add more on
              the next step)
            </p>
            <PeptideSelector
              selections={peptideSelections}
              onChange={setPeptideSelections}
              familiarity="advanced"
              variant="onboarding"
            />
          </div>
        )}

        {phase === 'goals' && (
          <div>
            <h2 className="mb-2 text-2xl font-semibold">Your goals</h2>
            <p className="mb-2 text-slate-400">Select all that apply</p>
            <p className="mb-6 text-xs text-slate-500">
              Your 90-day plan and peptide recommendations will be tailored to these
              goals.
            </p>

            {ONBOARDING_GOALS.map((goal) => (
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

        {phase === 'peptides' && (
          <div>
            <h2 className="mb-2 text-2xl font-semibold">Your peptides</h2>
            <p className="mb-4 text-slate-400">
              Pick peptides aligned with your goals. Set vial size and BAC water for
              proper reconstitution.
            </p>

            {recommendedIds.length > 0 && (
              <div className="mb-5">
                <p className="mb-2 text-xs font-medium tracking-wide text-emerald-400/90 uppercase">
                  Recommended for your goals
                </p>
                <div className="flex flex-wrap gap-2">
                  {recommendedIds.map((id) => {
                    const entry = getCatalogEntry(id)
                    if (!entry) return null
                    const added = peptideSelections.some(
                      (p) => p.catalogId === id
                    )
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => addRecommendedPeptide(id)}
                        disabled={added}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          added
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        {added ? '✓ ' : '+ '}
                        {entry.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <PeptideSelector
              selections={peptideSelections}
              onChange={setPeptideSelections}
              familiarity={familiarity || 'beginner'}
              variant="onboarding"
            />
          </div>
        )}

        {phase === 'body_stats' && (
          <div>
            <h2 className="mb-2 text-2xl font-semibold">Body stats</h2>
            <p className="mb-6 text-sm text-slate-400">
              {weightMode === 'gain'
                ? 'Enter your current and target weight — we will track lean gain progress.'
                : weightMode === 'wellness'
                  ? 'Enter your weight for personalized tracking (goals are wellness-focused).'
                  : 'Enter your current and goal weight for your tailored protocol.'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">
                  Current Weight (lbs)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={`${FIELD_CLASS} text-xl tabular-nums`}
                  placeholder="Enter current weight"
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
                  placeholder="Enter goal weight"
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {phase === 'about' && (
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

        {phase === 'generating' && <OnboardingGeneratingScreen />}

        {error && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-red-400">{error}</p>
            {isDatabaseSetupError(error) && <DatabaseSetupPanel />}
          </div>
        )}
      </div>

      {showNav && (
        <div className="fixed right-0 bottom-0 left-0 border-t border-white/10 bg-[#0a0a0a] px-6 pt-3 pb-4">
          <div className="mx-auto mb-3 max-w-lg">
            <MedicalDisclaimer compact />
          </div>
          <div className="mx-auto flex max-w-lg gap-3">
            <button
              type="button"
              onClick={back}
              disabled={phase === 'experience'}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/20 py-3.5 transition-colors disabled:opacity-40"
            >
              <ArrowLeft size={18} /> Back
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!canContinue() || loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 font-medium text-black transition-colors disabled:opacity-40"
            >
              {phase === 'about' ? (
                loading ? (
                  'Saving…'
                ) : (
                  <>
                    Finish Setup <Check size={18} />
                  </>
                )
              ) : (
                <>
                  Continue <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export { OnboardingWizard }
export default OnboardingWizard