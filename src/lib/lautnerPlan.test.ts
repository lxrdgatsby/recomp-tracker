import { describe, expect, it } from 'vitest'
import {
  isLautnerWeek,
  lautnerSessionDate,
  lautnerWeek,
  recompWeek,
} from './lautnerPlan'
import { prescribedSetCount } from '../utils/workoutSetStorage'

const START = '2026-08-23'

function exercise(week: number, dayIndex: number, name: string): string | undefined {
  return lautnerWeek(week)
    .days.find((day) => day.dayIndex === dayIndex)
    ?.exercises.find((line) => line.startsWith(name))
}

describe('Lautner bulk plan', () => {
  it('keeps week 11 on the written split with no eccentrics', () => {
    const week = lautnerWeek(11)
    expect(week.days).toHaveLength(5)
    expect(exercise(11, 0, 'Barbell bench press')).toBe('Barbell bench press: 5×5 heavy')
    expect(exercise(11, 0, 'Dumbbell incline bench')).toBe('Dumbbell incline bench: 3×8–10')
    expect(week.days[0].exercises.some((line) => line.startsWith('Taste the weight'))).toBe(false)
    expect(week.days[0].exercises.some((line) => line.startsWith('Swiss ball pikes'))).toBe(true)
    expect(week.days[1].exercises.some((line) => line.startsWith('Swiss ball pikes'))).toBe(false)
  })

  it('adds bench and squat eccentrics and 4×15 assistance in weeks 13–14', () => {
    expect(exercise(13, 0, 'Dumbbell incline bench')).toBe('Dumbbell incline bench: 4×15')
    expect(exercise(13, 0, 'Barbell bench press')).toBe('Barbell bench press: 5×5 heavy')
    expect(exercise(14, 0, 'Taste the weight — Barbell bench press')).toMatch(/3×5 eccentric/)
    expect(exercise(13, 2, 'Taste the weight — Back squat')).toMatch(/spotter/)
    expect(exercise(13, 1, 'Taste the weight — Deadlift')).toBeUndefined()
  })

  it('swings primary volume in weeks 15 and 16', () => {
    expect(exercise(15, 0, 'Barbell bench press')).toBe('Barbell bench press: 4×15')
    expect(exercise(15, 3, 'Military press')).toBe('Military press: 4×15')
    expect(exercise(16, 1, 'Deadlift')).toBe('Deadlift: 3×8–10')
    expect(exercise(16, 2, 'Leg press')).toBe('Leg press: 4×15')
  })

  it('cuts set volume 40% on the deload and keeps the rep scheme', () => {
    expect(exercise(19, 0, 'Barbell bench press')).toBe('Barbell bench press: 3×5 heavy')
    expect(exercise(20, 0, 'Close-grip tricep press')).toBe('Close-grip tricep press: 2×15')
    expect(exercise(29, 2, 'Back squat')).toBe('Back squat: 3×5')
  })

  it('puts taste-the-weight on all four primaries in the second intensity block', () => {
    for (const day of [0, 1, 2, 3]) {
      const lines = lautnerWeek(21).days.find((item) => item.dayIndex === day)?.exercises ?? []
      expect(lines.some((line) => line.startsWith('Taste the weight'))).toBe(true)
    }
    expect(exercise(24, 1, 'Deadlift')).toBe('Deadlift: 5×5')
  })

  it('rotates 3×8–10 and 4×15 across weeks 25–28', () => {
    expect(exercise(25, 0, 'Barbell bench press')).toBe('Barbell bench press: 3×8–10')
    expect(exercise(26, 2, 'Back squat')).toBe('Back squat: 4×15')
    expect(exercise(27, 3, 'Military press')).toBe('Military press: 3×8–10')
    expect(exercise(28, 1, 'Deadlift')).toBe('Deadlift: 4×15')
  })

  it('lifts three days in the cut block', () => {
    const days = lautnerWeek(37).days.map((day) => day.label)
    expect(days).toEqual(['Monday', 'Wednesday', 'Friday'])
    expect(lautnerWeek(40).progressionNote).toMatch(/maintenance/)
  })

  it('dates week 11 to the Monday inside a Sunday-start plan week', () => {
    expect(lautnerSessionDate(START, 11, 0)).toBe('2026-11-02')
    expect(lautnerSessionDate(START, 11, 2)).toBe('2026-11-04')
    expect(recompWeek(START, new Date(2026, 10, 4, 12))).toBe(11)
    expect(isLautnerWeek(10)).toBe(false)
    expect(isLautnerWeek(11)).toBe(true)
  })

  it('opens one set row per prescribed set, using the top of a 3–4 range', () => {
    expect(prescribedSetCount('Barbell bench press: 5×5 heavy')).toBe(5)
    expect(prescribedSetCount('Swiss ball pikes: 3–4×8–12')).toBe(4)
    expect(prescribedSetCount('Close-grip tricep press: 2×15')).toBe(2)
  })
})
