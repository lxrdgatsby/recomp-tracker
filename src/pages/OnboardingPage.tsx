import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { completeOnboarding, isUsernameAvailable } from '../lib/profileService'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { MedicalDisclaimer } from '../components/layout/MedicalDisclaimer'
import type { FamiliarityLevel, Questionnaire } from '../types/auth'

const STEPS = [
  {
    id: 'familiarity',
    title: 'Peptide experience',
    subtitle: 'How familiar are you with peptides?',
  },
  {
    id: 'goal',
    title: 'Your main goal',
    subtitle: 'What are you optimizing for?',
  },
  {
    id: 'peptides',
    title: 'Your peptides',
    subtitle: 'What are you using or interested in?',
  },
  {
    id: 'weight',
    title: 'Body stats',
    subtitle: 'Current and goal weight',
  },
  {
    id: 'info',
    title: 'About you',
    subtitle: 'Age, training, anything relevant',
  },
  {
    id: 'username',
    title: 'Choose a username',
    subtitle: 'This is how you appear in the app',
  },
] as const

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
  const [mainGoal, setMainGoal] = useState('Body recomposition')
  const [customGoal, setCustomGoal] = useState('')
  const [interestedPeptides, setInterestedPeptides] = useState(
    'Retatrutide, Tesamorelin, AOD9604, BPC-157'
  )
  const [currentWeight, setCurrentWeight] = useState('')
  const [goalWeight, setGoalWeight] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
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
    const available = await isUsernameAvailable(name)
    if (!available) {
      setError('Username is already taken')
      setLoading(false)
      return
    }

    const questionnaire: Questionnaire = {
      familiarity,
      mainGoal: customGoal || mainGoal,
      interestedPeptides,
      currentWeight: parseFloat(currentWeight),
      goalWeight: parseFloat(goalWeight),
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
      <div className="border-b border-slate-800 px-6 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <span className="text-sm text-slate-500">
            Step {step + 1} of {STEPS.length}
          </span>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i <= step ? 'bg-teal-500' : 'bg-navy-800'
                }`}
              />
            ))}
          </div>
        </div>
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
                    onClick={() => {
                      setMainGoal(g)
                      setCustomGoal('')
                    }}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                      mainGoal === g && !customGoal
                        ? 'border-teal-500/50 bg-teal-500/10 text-teal-400'
                        : 'border-slate-800 bg-navy-900 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
                <Input
                  label="Or describe your goal"
                  placeholder="Custom goal"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                />
              </div>
            )}

            {current.id === 'peptides' && (
              <textarea
                className="w-full rounded-xl border border-slate-700 bg-navy-950 px-4 py-3 text-base text-slate-100 placeholder:text-slate-600 focus:border-teal-500/60 focus:outline-none"
                rows={4}
                placeholder="e.g. Retatrutide 2mg weekly, Tesamorelin daily…"
                value={interestedPeptides}
                onChange={(e) => setInterestedPeptides(e.target.value)}
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
              <textarea
                className="w-full rounded-xl border border-slate-700 bg-navy-950 px-4 py-3 text-base text-slate-100 placeholder:text-slate-600 focus:border-teal-500/60 focus:outline-none"
                rows={4}
                placeholder="Age, training experience, injuries, timeline…"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
              />
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

            {error && <p className="text-sm text-red-400">{error}</p>}
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