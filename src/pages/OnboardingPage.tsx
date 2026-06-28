import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  OnboardingWizard,
  type OnboardingCompleteData,
} from '../components/onboarding/OnboardingWizard'
import {
  formatPeptideSelections,
} from '../constants/peptideCatalog'
import { completeOnboarding, isUsernameAvailable } from '../lib/profileService'
import type { Questionnaire } from '../types/auth'
import { serializeTrainingActivities } from '../types/auth'

export function OnboardingPage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const handleComplete = async (
    data: OnboardingCompleteData
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not signed in' }

    const { available, error: usernameError } = await isUsernameAvailable(
      data.username
    )
    if (usernameError) return { error: usernameError }
    if (!available) return { error: 'Username is already taken' }

    const goals = [
      ...data.selectedGoals,
      ...(data.customGoal.trim() ? [data.customGoal.trim()] : []),
    ]

    const questionnaire: Questionnaire = {
      familiarity: data.familiarity,
      mainGoal: goals.join(', '),
      peptideSelections: data.peptideSelections,
      interestedPeptides: formatPeptideSelections(data.peptideSelections),
      currentWeight: parseFloat(data.currentWeight),
      goalWeight: parseFloat(data.goalWeight),
      gender: data.gender,
      age: data.age,
      trainingActivities: serializeTrainingActivities(data.selectedTraining),
      additionalInfo: data.additionalInfo,
    }

    const { error: err } = await completeOnboarding(
      user.id,
      data.username,
      questionnaire
    )
    if (err) return { error: err }

    await refreshProfile()
    navigate('/app')
    return { error: null }
  }

  return <OnboardingWizard onComplete={handleComplete} />
}