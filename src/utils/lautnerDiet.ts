export type LautnerMeal = {
  id: number
  time: string
  name: string
  protein: number
  fat: number
  carbs: number
  kcal: number
  foods: string
  swapAllowed: boolean
}

export const LAUTNER_MEALS: LautnerMeal[] = [
  {
    id: 1,
    time: '6:00 AM',
    name: 'Protein shake',
    protein: 40,
    fat: 5,
    carbs: 20,
    kcal: 290,
    foods: 'Shake (per PepTrack dose log)',
    swapAllowed: true,
  },
  {
    id: 2,
    time: '8:00 AM',
    name: 'Breakfast',
    protein: 35,
    fat: 18,
    carbs: 45,
    kcal: 490,
    foods: '4-egg omelet, yogurt, whole wheat toast, orange juice',
    swapAllowed: true,
  },
  {
    id: 3,
    time: '10:00 AM',
    name: 'Mid-morning snack',
    protein: 10,
    fat: 15,
    carbs: 25,
    kcal: 290,
    foods: 'Nuts, strawberries, blueberries',
    swapAllowed: true,
  },
  {
    id: 4,
    time: '12:00 PM',
    name: 'Lunch',
    protein: 50,
    fat: 15,
    carbs: 70,
    kcal: 620,
    foods: 'Roasted chicken, rice, green beans, fish',
    swapAllowed: true,
  },
  {
    id: 5,
    time: '3:00 PM',
    name: 'Post-workout',
    protein: 30,
    fat: 8,
    carbs: 60,
    kcal: 440,
    foods: 'Protein bar, banana, raspberries',
    swapAllowed: true,
  },
  {
    id: 6,
    time: '6:00 PM',
    name: 'Dinner',
    protein: 40,
    fat: 20,
    carbs: 55,
    kcal: 590,
    foods: 'Salmon, sweet potato, mixed vegetables, green tea',
    swapAllowed: true,
  },
]

export const LAUTNER_CARRY_BAG = {
  protein: 10,
  fat: 12,
  carbs: 20,
  kcal: 250,
  foods: 'Beef patties, raw almonds, sweet potatoes',
}

export const LAUTNER_DAILY_TARGET = {
  protein: 186,
  fat: 93,
  carbs: 330,
  kcal: 3200,
}

export type MealLogEntry = {
  mealId: number
  date: string
  eaten: boolean
  swap?: string
  swapProtein?: number
  swapFat?: number
  swapCarbs?: number
  swapKcal?: number
  carryBagUsed?: boolean
}

const STORAGE_KEY = 'lautner-diet-log'

export function getDietLog(date: string): MealLogEntry[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-${date}`)
    return raw ? (JSON.parse(raw) as MealLogEntry[]) : []
  } catch {
    return []
  }
}

export function saveMealEntry(date: string, entry: MealLogEntry): void {
  const existing = getDietLog(date).filter((e) => e.mealId !== entry.mealId)
  localStorage.setItem(
    `${STORAGE_KEY}-${date}`,
    JSON.stringify([...existing, entry]),
  )
}

export function getDailyTotals(date: string): {
  protein: number
  fat: number
  carbs: number
  kcal: number
} {
  const entries = getDietLog(date)
  let protein = 0
  let fat = 0
  let carbs = 0
  let kcal = 0
  for (const entry of entries) {
    const meal = LAUTNER_MEALS.find((m) => m.id === entry.mealId)
    if (!meal || !entry.eaten) continue
    protein += entry.swapProtein ?? meal.protein
    fat += entry.swapFat ?? meal.fat
    carbs += entry.swapCarbs ?? meal.carbs
    kcal += entry.swapKcal ?? meal.kcal
    if (entry.carryBagUsed) {
      protein += LAUTNER_CARRY_BAG.protein
      fat += LAUTNER_CARRY_BAG.fat
      carbs += LAUTNER_CARRY_BAG.carbs
      kcal += LAUTNER_CARRY_BAG.kcal
    }
  }
  return { protein, fat, carbs, kcal }
}
