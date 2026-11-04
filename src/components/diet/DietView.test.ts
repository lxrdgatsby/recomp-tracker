import { describe, expect, it } from 'vitest'
import { LAUTNER_MEALS, TARGETS, dietTotals } from './DietView'

const on = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, true]))

describe('Lautner diet totals', () => {
  it('sums the six meals to 3200 / 186 / 93 / 330', () => {
    const ids = LAUTNER_MEALS.filter((meal) => !meal.id.startsWith('carry')).map((meal) => meal.id)
    expect(dietTotals(on(ids))).toEqual(TARGETS)
  })

  it('adds a carry-bag item on top of the checked meals', () => {
    const base = dietTotals(on(['shake', 'dinner']))
    const withPatty = dietTotals(on(['shake', 'dinner', 'carry-patties']))
    expect(base).toEqual({ calories: 1050, protein: 70, fat: 22, carbs: 105 })
    expect(withPatty.calories).toBe(base.calories + 242)
    expect(withPatty.protein).toBe(base.protein + 20)
  })
})
