import { addDays, eachDayOfInterval, format, parseISO } from 'date-fns'
import { CYCLE_DAYS } from '../constants/defaults'
import type { TrackerState } from '../types'
import { getDaysIntoCycle } from './calculations'
import { getInjectionsForDate } from './peptideSchedule'
import { getWorkoutDate, WORKOUT_PLAN } from './workoutPlan'

export function computeAdherence(state: TrackerState) {
  const { profile, injectionLogs, workoutCompletions, peptides } = state
  const daysIn = getDaysIntoCycle(profile.startDate)
  const start = parseISO(profile.startDate)
  const end = addDays(start, Math.min(daysIn, CYCLE_DAYS) - 1)

  let expectedInjections = 0
  let completedInjections = 0
  const days = eachDayOfInterval({ start, end })

  days.forEach((day) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const scheduled = getInjectionsForDate(peptides, day, profile.startDate)
    expectedInjections += scheduled.length
    scheduled.forEach((inj) => {
      if (
        injectionLogs.some(
          (l) => l.date === dateStr && l.peptideId === inj.peptideId
        )
      ) {
        completedInjections++
      }
    })
  })

  let expectedWorkouts = 0
  let completedWorkouts = 0
  WORKOUT_PLAN.forEach((week) => {
    week.days.forEach((day) => {
      const date = getWorkoutDate(profile.startDate, week.week, day.dayIndex)
      const dayDate = parseISO(date)
      if (dayDate >= start && dayDate <= end) {
        expectedWorkouts++
        if (
          workoutCompletions.some(
            (c) =>
              c.date === date &&
              c.week === week.week &&
              c.dayIndex === day.dayIndex
          )
        ) {
          completedWorkouts++
        }
      }
    })
  })

  const injectionPct =
    expectedInjections > 0
      ? Math.round((completedInjections / expectedInjections) * 100)
      : 100
  const workoutPct =
    expectedWorkouts > 0
      ? Math.round((completedWorkouts / expectedWorkouts) * 100)
      : 100
  const overall = Math.round((injectionPct + workoutPct) / 2)

  return {
    injectionPct,
    workoutPct,
    overall,
    completedInjections,
    expectedInjections,
    completedWorkouts,
    expectedWorkouts,
  }
}