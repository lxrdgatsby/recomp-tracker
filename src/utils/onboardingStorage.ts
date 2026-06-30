import type { OnboardingCompleteData } from '../components/onboarding/OnboardingWizard'
import { getCatalogEntry } from '../constants/peptideCatalog'
import { generateGoalAware90DayPlan } from './goalAwarePlan'

const ONBOARDING_KEY = 'onboardingData'
const PLAN_KEY = 'ninetyDayPlan'

export type OnboardingData = {
  experience: string
  goals: string[]
  peptides: { name: string; status: string }[]
  currentWeight: string
  goalWeight: string
  gender: string
  age: string
  training: string[]
  habits: string
}

export interface Generated90DayPlan {
  startDate: string
  goalDate: string
  targetWeeklyLoss: string
  planMode?: 'loss' | 'gain' | 'wellness' | 'maintain'
  planTitle?: string
  peptides: OnboardingData['peptides']
  training: string[]
  nutritionFocus: string
  milestones: { week: number; targetWeight: string }[]
}

export function onboardingDataFromComplete(
  data: OnboardingCompleteData
): OnboardingData {
  const goals = [
    ...data.selectedGoals,
    ...(data.customGoal.trim() ? [data.customGoal.trim()] : []),
  ]

  return {
    experience: data.familiarity,
    goals,
    peptides: data.peptideSelections.map((selection) => {
      const entry = getCatalogEntry(selection.catalogId)
      return {
        name: entry?.name ?? selection.catalogId,
        status: selection.status === 'using' ? 'Using' : 'Interested',
      }
    }),
    currentWeight: data.currentWeight,
    goalWeight: data.goalWeight,
    gender: data.gender,
    age: String(data.age),
    training: data.selectedTraining,
    habits: data.additionalInfo,
  }
}

export function saveOnboardingData(data: OnboardingData): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(data))
  } catch {
    // ignore quota errors
  }
}

export function getOnboardingData(): OnboardingData | null {
  try {
    const saved = localStorage.getItem(ONBOARDING_KEY)
    if (!saved) return null
    return JSON.parse(saved) as OnboardingData
  } catch {
    return null
  }
}

export function generate90DayPlan(data: OnboardingData): Generated90DayPlan {
  return generateGoalAware90DayPlan(data)
}

export function save90DayPlan(plan: Generated90DayPlan): void {
  try {
    localStorage.setItem(PLAN_KEY, JSON.stringify(plan))
  } catch {
    // ignore quota errors
  }
}

export function get90DayPlan(): Generated90DayPlan | null {
  try {
    const saved = localStorage.getItem(PLAN_KEY)
    if (!saved) return null
    return JSON.parse(saved) as Generated90DayPlan
  } catch {
    return null
  }
}