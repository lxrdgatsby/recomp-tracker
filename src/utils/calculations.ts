import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import { CYCLE_DAYS } from '../constants/defaults'
import type { Profile, TrackerState, WeightEntry } from '../types'

export function getLatestWeight(profile: Profile, history: WeightEntry[]): number {
  if (history.length === 0) return profile.currentWeight
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date))
  return sorted[0].weight
}

export function getStartWeight(profile: Profile, history: WeightEntry[]): number {
  if (profile.startWeight && profile.startWeight > 0) return profile.startWeight
  if (history.length === 0) return profile.currentWeight
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))
  return sorted[0].weight
}

/** Save one weigh-in. The newest date becomes current weight. Older points stay. */
export function recordWeight(
  state: TrackerState,
  date: string,
  weight: number
): TrackerState {
  const day = date.slice(0, 10)
  const weightHistory = [
    ...state.weightHistory.filter((entry) => entry.date.slice(0, 10) !== day),
    { date: day, weight },
  ].sort((a, b) => a.date.localeCompare(b.date))
  const latest = weightHistory[weightHistory.length - 1]
  return {
    ...state,
    weightHistory,
    profile: {
      ...state.profile,
      currentWeight: latest?.weight ?? weight,
    },
  }
}

export function weightProgress(profile: Profile, history: WeightEntry[]) {
  const startWeight = getStartWeight(profile, history)
  const currentWeight = getLatestWeight(profile, history)
  const goalWeight = profile.goalWeight
  const remainingLb = getWeightToLose(currentWeight, goalWeight)
  const percent = getProgressPercent(startWeight, currentWeight, goalWeight)
  const lostLb = Math.round((startWeight - currentWeight) * 10) / 10
  return { startWeight, currentWeight, goalWeight, remainingLb, percent, lostLb }
}

export function getWeightToLose(current: number, goal: number): number {
  return Math.max(0, Math.round((current - goal) * 10) / 10)
}

export function getDaysIntoCycle(startDate: string): number {
  const start = parseISO(startDate)
  const today = new Date()
  return Math.min(CYCLE_DAYS, Math.max(0, differenceInCalendarDays(today, start) + 1))
}

export function getProjectedGoalDate(
  currentWeight: number,
  goalWeight: number,
  weeklyLoss: number,
  fromDate = new Date()
): Date | null {
  const toLose = currentWeight - goalWeight
  if (toLose <= 0) return fromDate
  if (weeklyLoss <= 0) return null
  const weeksNeeded = toLose / weeklyLoss
  const daysNeeded = Math.ceil(weeksNeeded * 7)
  return addDays(fromDate, daysNeeded)
}

export function getProgressPercent(
  startWeight: number,
  currentWeight: number,
  goalWeight: number
): number {
  const total = startWeight - goalWeight
  if (total <= 0) return 100
  const done = startWeight - currentWeight
  return Math.min(100, Math.max(0, Math.round((done / total) * 100)))
}

export interface Milestone {
  week: number
  date: string
  projectedWeight: number
  label: string
}

export function getMilestones(
  profile: Profile,
  startWeight: number
): Milestone[] {
  const start = parseISO(profile.startDate)
  const milestoneWeeks = [2, 4, 6, 8, 10, 12, 13]
  return milestoneWeeks.map((week) => {
    const days = (week - 1) * 7
    const date = addDays(start, days)
    const weeksElapsed = days / 7
    const projected = Math.max(
      profile.goalWeight,
      Math.round((startWeight - weeksElapsed * profile.weeklyLossTarget) * 10) / 10
    )
    return {
      week,
      date: format(date, 'MMM d, yyyy'),
      projectedWeight: projected,
      label: week === 13 ? 'Cycle Complete' : `Week ${week} Check-in`,
    }
  })
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'MMM d, yyyy')
}