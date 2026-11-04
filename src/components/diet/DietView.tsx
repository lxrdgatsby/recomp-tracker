import { format } from 'date-fns'
import { Check, Circle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { isLautnerWeek, recompWeek } from '../../lib/lautnerPlan'
import { loadDietChecked, saveDietChecked } from '../../utils/lautnerDietStorage'

type Meal = {
  id: string
  time: string
  label: string
  foods: string
  protein: number
  fat: number
  carbs: number
  calories: number
}

/** Edit these numbers to change a meal. Checked rows sum into the bars. */
export const LAUTNER_MEALS: Meal[] = [
  {
    id: 'shake',
    time: '6:00 AM',
    label: 'Protein shake',
    foods: 'Before fully awake',
    protein: 40,
    fat: 8,
    carbs: 30,
    calories: 400,
  },
  {
    id: 'breakfast',
    time: '8:00 AM',
    label: 'Breakfast',
    foods: '4-egg omelet, yogurt, whole wheat toast, orange juice',
    protein: 36,
    fat: 28,
    carbs: 55,
    calories: 650,
  },
  {
    id: 'snack',
    time: '10:00 AM',
    label: 'Mid-morning snack',
    foods: 'Nuts, strawberries, blueberries',
    protein: 10,
    fat: 20,
    carbs: 30,
    calories: 350,
  },
  {
    id: 'lunch',
    time: '12:00 PM',
    label: 'Lunch',
    foods: 'Roasted chicken, rice, green beans, fish',
    protein: 45,
    fat: 15,
    carbs: 80,
    calories: 700,
  },
  {
    id: 'post',
    time: '2:00 PM',
    label: 'Post-workout',
    foods: 'Protein bar, banana, raspberries',
    protein: 25,
    fat: 8,
    carbs: 60,
    calories: 450,
  },
  {
    id: 'dinner',
    time: '4:00 PM',
    label: 'Dinner',
    foods: 'Salmon, sweet potato, mixed vegetables, green tea',
    protein: 30,
    fat: 14,
    carbs: 75,
    calories: 650,
  },
  {
    id: 'carry-patties',
    time: 'Carry bag',
    label: 'Beef patties',
    foods: 'One patty',
    protein: 20,
    fat: 18,
    carbs: 0,
    calories: 242,
  },
  {
    id: 'carry-almonds',
    time: 'Carry bag',
    label: 'Raw almonds',
    foods: '1 oz',
    protein: 6,
    fat: 14,
    carbs: 6,
    calories: 170,
  },
  {
    id: 'carry-potato',
    time: 'Carry bag',
    label: 'Sweet potato',
    foods: 'One medium',
    protein: 2,
    fat: 0,
    carbs: 26,
    calories: 112,
  },
]

export const TARGETS = { calories: 3200, protein: 186, fat: 93, carbs: 330 }

export function dietTotals(checked: Record<string, boolean>) {
  return LAUTNER_MEALS.filter((m) => checked[m.id]).reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      fat: acc.fat + m.fat,
      carbs: acc.carbs + m.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  )
}

const pct = (v: number, t: number) => Math.min(100, Math.round((v / t) * 100))

export function DietView({ startDate }: { startDate: string }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [checked, setChecked] = useState<Record<string, boolean>>(() => loadDietChecked(today))
  const cut = isLautnerWeek(recompWeek(startDate)) && recompWeek(startDate) >= 37

  const totals = useMemo(() => dietTotals(checked), [checked])

  const toggle = (id: string) => {
    setChecked((c) => {
      const next = { ...c, [id]: !c[id] }
      saveDietChecked(today, next)
      return next
    })
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-xl font-bold">Lautner Diet</h1>
        <p className="text-sm text-gray-400">
          6 meals, nothing more than 2 hours apart. Check off as you eat.
        </p>
      </div>

      {cut && (
        <p className="rounded-lg border border-[#c6a15b]/30 bg-[#c6a15b]/10 p-3 text-xs text-[#f3ead8]">
          Cut block. Drop calories from the 3,200 surplus to maintenance. Protein stays 186 g.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        {(
          [
            ['Calories', totals.calories, TARGETS.calories],
            ['Protein', totals.protein, TARGETS.protein],
            ['Fat', totals.fat, TARGETS.fat],
            ['Carbs', totals.carbs, TARGETS.carbs],
          ] as const
        ).map(([label, v, t]) => (
          <div key={label} className="rounded-lg bg-neutral-900 p-2">
            <div className="text-gray-400">{label}</div>
            <div className="font-bold">
              {v} / {t}
            </div>
            <div className="mt-1 h-1.5 rounded bg-neutral-800">
              <div className="h-1.5 rounded bg-emerald-500" style={{ width: `${pct(v, t)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {LAUTNER_MEALS.map((m) => {
          const on = !!checked[m.id]
          return (
            <button
              key={m.id}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => toggle(m.id)}
              className={`w-full rounded-lg border p-3 text-left ${on ? 'border-emerald-600 bg-emerald-950/40' : 'border-neutral-800 bg-neutral-900'}`}
            >
              <div className="flex items-start gap-3">
                {on ? (
                  <Check className="mt-0.5 text-emerald-500" size={18} />
                ) : (
                  <Circle className="mt-0.5 text-neutral-600" size={18} />
                )}
                <div className="flex-1">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">
                      {m.time} — {m.label}
                    </span>
                    <span className="text-xs text-gray-500">{m.calories} kcal</span>
                  </div>
                  <div className="text-sm text-gray-400">{m.foods}</div>
                  {m.id === 'post' && (
                    <div className="text-xs italic text-gray-500">Eat immediately after lifting.</div>
                  )}
                  <div className="mt-1 text-xs text-gray-500">
                    P {m.protein}g · F {m.fat}g · C {m.carbs}g
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="rounded-lg bg-neutral-900 p-3 text-xs text-gray-500">
        Swap any meal&apos;s foods anytime — just edit the numbers in <code>LAUTNER_MEALS</code> in{' '}
        <code>DietView.tsx</code> and the totals recompute automatically. Carry bag items count
        whenever you eat them.
      </div>
    </div>
  )
}
