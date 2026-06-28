import { differenceInDays, format, parseISO } from 'date-fns'
import { CYCLE_DAYS } from '../constants/defaults'
import type { TrackerState } from '../types'
import { getWorkoutDate, WORKOUT_PLAN } from './workoutPlan'
import {
  getInjectionsForDate,
  isInjectionDone,
} from './peptideSchedule'

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getTodayWorkout(startDate: string) {
  const today = new Date()
  const start = parseISO(startDate)
  const dayOffset = differenceInDays(today, start)
  if (dayOffset < 0) return null

  const week = Math.min(Math.floor(dayOffset / 7) + 1, WORKOUT_PLAN.length)
  const dayIndexInWeek = dayOffset % 7
  if (dayIndexInWeek > 4) return null

  const weekPlan = WORKOUT_PLAN.find((w) => w.week === week)
  const day = weekPlan?.days.find((d) => d.dayIndex === dayIndexInWeek)
  if (!day || !weekPlan) return null

  return {
    week,
    dayIndex: day.dayIndex,
    date: getWorkoutDate(startDate, week, day.dayIndex),
    focus: day.focus,
    label: day.label,
    exercises: day.exercises.join(' • '),
    completed: false,
  }
}

export function getTodayDashboardData(state: TrackerState) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const { profile, peptides, injectionLogs, workoutCompletions } = state
  const dayInCycle = Math.min(
    CYCLE_DAYS,
    Math.max(1, differenceInDays(new Date(), parseISO(profile.startDate)) + 1)
  )

  const injections = getInjectionsForDate(peptides, new Date(), profile.startDate)
  const primaryInjection = injections[0]

  const workout = getTodayWorkout(profile.startDate)
  const workoutCompleted = workout
    ? workoutCompletions.some(
        (c) =>
          c.date === workout.date &&
          c.week === workout.week &&
          c.dayIndex === workout.dayIndex
      )
    : false

  return {
    dayInCycle,
    totalDays: CYCLE_DAYS,
    injections: injections.map((inj) => ({
      ...inj,
      done: isInjectionDone(injectionLogs, today, inj.peptideId),
    })),
    primaryInjection: primaryInjection
      ? {
          ...primaryInjection,
          done: isInjectionDone(injectionLogs, today, primaryInjection.peptideId),
        }
      : null,
    workout: workout ? { ...workout, completed: workoutCompleted } : null,
  }
}