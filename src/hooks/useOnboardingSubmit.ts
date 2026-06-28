import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { OnboardingCompleteData } from '../components/onboarding/OnboardingWizard'
import { formatPeptideSelections } from '../constants/peptideCatalog'
import { completeOnboarding, isUsernameAvailable } from '../lib/profileService'
import type { Questionnaire } from '../types/auth'
import { serializeTrainingActivities } from '../types/auth'
import {
  generate90DayPlan,
  onboardingDataFromComplete,
  save90DayPlan,
  saveOnboardingData,
} from '../utils/onboardingStorage'

export function useOnboardingSubmit() {
  const { user, refreshProfile } = useAuth()

  return useCallback(
    async (data: OnboardingCompleteData): Promise<{ error: string | null }> => {
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

      const onboardingData = onboardingDataFromComplete(data)
      saveOnboardingData(onboardingData)
      save90DayPlan(generate90DayPlan(onboardingData))

      await refreshProfile()
      return { error: null }
    },
    [user, refreshProfile]
  )
}