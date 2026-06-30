import type { OnboardingData, Generated90DayPlan } from './onboardingStorage'
import {
  computeWeeklyWeightTarget,
  inferWeightGoalMode,
  planNutritionFocus,
  planTitleForGoals,
  type WeightGoalMode,
} from '../constants/onboardingGoals'

export function getWeightGoalModeFromOnboarding(
  data: OnboardingData
): WeightGoalMode {
  const current = parseFloat(data.currentWeight)
  const goal = parseFloat(data.goalWeight)
  if (isNaN(current) || isNaN(goal)) {
    return inferWeightGoalMode(data.goals, 0, 0)
  }
  return inferWeightGoalMode(data.goals, current, goal)
}

export function generateGoalAware90DayPlan(data: OnboardingData): Generated90DayPlan {
  const startWeight = parseFloat(data.currentWeight) || 0
  const goalWeight = parseFloat(data.goalWeight) || startWeight
  const mode = getWeightGoalModeFromOnboarding(data)
  const weeklyTarget = computeWeeklyWeightTarget(mode, startWeight, goalWeight)

  const startDate = new Date().toISOString().split('T')[0]
  const goalDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const milestones =
    mode === 'loss'
      ? [
          {
            week: 2,
            targetWeight: (startWeight - weeklyTarget * 2).toFixed(1),
          },
          {
            week: 4,
            targetWeight: (startWeight - weeklyTarget * 4).toFixed(1),
          },
          {
            week: 8,
            targetWeight: (startWeight - weeklyTarget * 8).toFixed(1),
          },
          { week: 12, targetWeight: String(goalWeight) },
        ]
      : mode === 'gain'
        ? [
            {
              week: 2,
              targetWeight: (startWeight + weeklyTarget * 2).toFixed(1),
            },
            {
              week: 4,
              targetWeight: (startWeight + weeklyTarget * 4).toFixed(1),
            },
            {
              week: 8,
              targetWeight: (startWeight + weeklyTarget * 8).toFixed(1),
            },
            { week: 12, targetWeight: String(goalWeight) },
          ]
        : [
            { week: 4, targetWeight: String(startWeight) },
            { week: 8, targetWeight: String(startWeight) },
            { week: 12, targetWeight: String(goalWeight || startWeight) },
          ]

  return {
    startDate,
    goalDate,
    targetWeeklyLoss: String(weeklyTarget),
    planMode: mode,
    planTitle: planTitleForGoals(data.goals, mode),
    peptides: data.peptides,
    training: data.training,
    nutritionFocus: planNutritionFocus(data.goals, mode),
    milestones,
  }
}