/** Onboarding goal options and peptide recommendations per goal. */

export const ONBOARDING_GOALS = [
  'Fat loss',
  'Muscle gain',
  'Body recomposition',
  'Recovery & healing',
  'Performance',
  'Longevity',
  'Clearer skin',
  'Better sleep',
  'Reduce anxiety',
] as const

export type OnboardingGoal = (typeof ONBOARDING_GOALS)[number]

/** Catalog IDs recommended when a goal is selected. */
export const GOAL_PEPTIDE_RECOMMENDATIONS: Record<OnboardingGoal, string[]> = {
  'Fat loss': ['retatrutide', 'semaglutide', 'tirzepatide', 'aod9604'],
  'Muscle gain': ['tesamorelin', 'cjc1295', 'ipamorelin', 'bpc157'],
  'Body recomposition': ['retatrutide', 'aod9604', 'tesamorelin', 'bpc157'],
  'Recovery & healing': ['bpc157', 'tb500', 'ghkcu'],
  Performance: ['motsc', 'ss31', 'semax', 'bpc157'],
  Longevity: ['epitalon', 'ghkcu', 'motsc', 'ss31'],
  'Clearer skin': ['ghkcu', 'bpc157'],
  'Better sleep': ['dsip', 'epitalon'],
  'Reduce anxiety': ['selank', 'semax'],
}

const WEIGHT_LOSS_GOALS: OnboardingGoal[] = ['Fat loss', 'Body recomposition']
const WEIGHT_GAIN_GOALS: OnboardingGoal[] = ['Muscle gain']
const WELLNESS_GOALS: OnboardingGoal[] = [
  'Clearer skin',
  'Better sleep',
  'Reduce anxiety',
  'Recovery & healing',
  'Performance',
  'Longevity',
]

export function getRecommendedPeptideIds(goals: string[]): string[] {
  const ids = new Set<string>()
  for (const goal of goals) {
    const recs = GOAL_PEPTIDE_RECOMMENDATIONS[goal as OnboardingGoal]
    if (recs) recs.forEach((id) => ids.add(id))
  }
  return [...ids]
}

export type WeightGoalMode = 'loss' | 'gain' | 'wellness' | 'maintain'

export function inferWeightGoalMode(
  goals: string[],
  currentWeight: number,
  goalWeight: number
): WeightGoalMode {
  const hasLoss = goals.some((g) =>
    WEIGHT_LOSS_GOALS.includes(g as OnboardingGoal)
  )
  const hasGain = goals.some((g) =>
    WEIGHT_GAIN_GOALS.includes(g as OnboardingGoal)
  )
  const wellnessOnly =
    goals.length > 0 &&
    goals.every((g) => WELLNESS_GOALS.includes(g as OnboardingGoal))

  if (goalWeight > currentWeight + 0.5) return 'gain'
  if (goalWeight < currentWeight - 0.5) return 'loss'
  if (hasGain && !hasLoss) return 'gain'
  if (hasLoss && !hasGain) return 'loss'
  if (wellnessOnly) return 'wellness'
  return 'maintain'
}

export function computeWeeklyWeightTarget(
  mode: WeightGoalMode,
  currentWeight: number,
  goalWeight: number,
  weeks = 12
): number {
  if (mode === 'wellness' || mode === 'maintain') return 0
  return Math.round((Math.abs(goalWeight - currentWeight) / weeks) * 100) / 100
}

export function planNutritionFocus(goals: string[], mode: WeightGoalMode): string {
  if (mode === 'gain') {
    return 'Calorie surplus with high protein (~1g per lb bodyweight) for lean gains'
  }
  if (mode === 'loss') {
    return 'Moderate deficit with high protein (~1g per lb goal weight)'
  }
  if (goals.includes('Better sleep')) {
    return 'Sleep hygiene + consistent injection timing; limit late stimulants'
  }
  if (goals.includes('Clearer skin')) {
    return 'Hydration, protein, and track skin response weekly in check-ins'
  }
  if (goals.includes('Reduce anxiety')) {
    return 'Stress management + consistent protocol timing; journal mood in check-ins'
  }
  return 'Balanced nutrition aligned with your peptide protocol goals'
}

export function planTitleForGoals(goals: string[], mode: WeightGoalMode): string {
  if (mode === 'gain') return '90-day muscle & performance protocol'
  if (mode === 'loss') return '90-day recomp & fat loss protocol'
  if (mode === 'wellness') {
    if (goals.includes('Better sleep')) return '90-day sleep & recovery protocol'
    if (goals.includes('Clearer skin')) return '90-day skin & wellness protocol'
    return '90-day wellness & longevity protocol'
  }
  return '90-day personalized peptide protocol'
}