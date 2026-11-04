import { format } from 'date-fns'
import { useMemo, useState } from 'react'
import {
  LAUTNER_CARRY_BAG,
  LAUTNER_DAILY_TARGET,
  LAUTNER_MEALS,
  getDailyTotals,
  getDietLog,
  saveMealEntry,
  type MealLogEntry,
} from '../utils/lautnerDiet'
import { Card } from '../ui/Card'

export function LautnerDietView() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(today)
  const [logsVersion, setLogsVersion] = useState(0)
  const [swapModal, setSwapModal] = useState<number | null>(null)
  const [swapText, setSwapText] = useState('')
  const [swapProtein, setSwapProtein] = useState('')
  const [swapFat, setSwapFat] = useState('')
  const [swapCarbs, setSwapCarbs] = useState('')

  const entries = useMemo(() => getDietLog(date), [date, logsVersion])
  const totals = useMemo(() => getDailyTotals(date), [date, logsVersion])

  const isEaten = (mealId: number) =>
    entries.some((e) => e.mealId === mealId && e.eaten)

  const getEntry = (mealId: number): MealLogEntry | undefined =>
    entries.find((e) => e.mealId === mealId)

  const toggleMeal = (mealId: number) => {
    const existing = getEntry(mealId)
    saveMealEntry(date, {
      mealId,
      date,
      eaten: !existing?.eaten,
      swap: existing?.swap,
      swapProtein: existing?.swapProtein,
      swapFat: existing?.swapFat,
      swapCarbs: existing?.swapCarbs,
      swapKcal: existing?.swapKcal,
      carryBagUsed: existing?.carryBagUsed,
    })
    setLogsVersion((v) => v + 1)
  }

  const toggleCarryBag = (mealId: number) => {
    const existing = getEntry(mealId)
    if (!existing?.eaten) return
    saveMealEntry(date, { ...existing, carryBagUsed: !existing.carryBagUsed })
    setLogsVersion((v) => v + 1)
  }

  const openSwap = (mealId: number) => {
    const existing = getEntry(mealId)
    setSwapModal(mealId)
    setSwapText(existing?.swap ?? '')
    setSwapProtein(existing?.swapProtein?.toString() ?? '')
    setSwapFat(existing?.swapFat?.toString() ?? '')
    setSwapCarbs(existing?.swapCarbs?.toString() ?? '')
  }

  const saveSwap = () => {
    if (swapModal === null) return
    const existing = getEntry(swapModal) ?? {
      mealId: swapModal,
      date,
      eaten: true,
    }
    const p = Number(swapProtein) || undefined
    const f = Number(swapFat) || undefined
    const c = Number(swapCarbs) || undefined
    const meal = LAUTNER_MEALS.find((m) => m.id === swapModal)!
    const kcal = p && f && c ? Math.round(p * 4 + f * 9 + c * 4) : undefined
    saveMealEntry(date, {
      ...existing,
      eaten: true,
      swap: swapText || undefined,
      swapProtein: p,
      swapFat: f,
      swapCarbs: c,
      swapKcal: kcal,
    })
    setSwapModal(null)
    setLogsVersion((v) => v + 1)
  }

  const proteinOk = Math.abs(totals.protein - LAUTNER_DAILY_TARGET.protein) <= 10
  const fatOk = Math.abs(totals.fat - LAUTNER_DAILY_TARGET.fat) <= 10
  const carbsOk = Math.abs(totals.carbs - LAUTNER_DAILY_TARGET.carbs) <= 20
  const dayOk = proteinOk && fatOk && carbsOk

  return (
    <div className="min-w-0 max-w-full overflow-hidden pb-8 text-white">
      <h1 className="mb-1 text-2xl font-semibold sm:text-3xl">Diet</h1>
      <p className="mb-2 text-xs text-slate-400 sm:text-sm">
        Lautner 6-meal timeline · 2-hour max gaps · macro check-off
      </p>

      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="diet-date" className="shrink-0 text-xs text-slate-500">
          Date
        </label>
        <input
          id="diet-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MacroPill
          label="Protein"
          value={totals.protein}
          target={LAUTNER_DAILY_TARGET.protein}
          unit="g"
          ok={proteinOk}
        />
        <MacroPill
          label="Fat"
          value={totals.fat}
          target={LAUTNER_DAILY_TARGET.fat}
          unit="g"
          ok={fatOk}
        />
        <MacroPill
          label="Carbs"
          value={totals.carbs}
          target={LAUTNER_DAILY_TARGET.carbs}
          unit="g"
          ok={carbsOk}
        />
        <MacroPill
          label="Calories"
          value={totals.kcal}
          target={LAUTNER_DAILY_TARGET.kcal}
          unit=""
          ok={dayOk}
        />
      </div>

      {LAUTNER_MEALS.map((meal) => {
        const eaten = isEaten(meal.id)
        const entry = getEntry(meal.id)
        const hasSwap = !!entry?.swap
        return (
          <div
            key={meal.id}
            className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:mb-4 sm:rounded-3xl sm:p-6"
          >
            <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div className="min-w-0">
                <div className="text-xs text-emerald-400 sm:text-sm">
                  Meal {meal.id} · {meal.time}
                </div>
                <div className="text-lg font-semibold sm:text-xl">{meal.name}</div>
                <div className="mt-1 text-xs text-slate-400 sm:text-sm">
                  {meal.foods}
                </div>
                {hasSwap && (
                  <div className="mt-1 text-xs text-amber-400/90">
                    Swap: {entry.swap}
                  </div>
                )}
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  onClick={() => toggleMeal(meal.id)}
                  className={`flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-all sm:rounded-2xl sm:px-5 ${
                    eaten
                      ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
                      : 'bg-emerald-500 text-black hover:bg-emerald-600'
                  }`}
                >
                  {eaten ? 'Eaten ✓' : 'Mark Eaten'}
                </button>
                {meal.swapAllowed && (
                  <button
                    type="button"
                    onClick={() => openSwap(meal.id)}
                    className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 sm:rounded-2xl sm:px-5"
                  >
                    {hasSwap ? 'Edit Swap' : 'Swap Food'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-500 sm:gap-2 sm:text-xs">
              <span className="rounded-full bg-white/5 px-2 py-0.5 sm:px-2.5 sm:py-1">
                {entry?.swapProtein ?? meal.protein} g protein
              </span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 sm:px-2.5 sm:py-1">
                {entry?.swapFat ?? meal.fat} g fat
              </span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 sm:px-2.5 sm:py-1">
                {entry?.swapCarbs ?? meal.carbs} g carbs
              </span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 sm:px-2.5 sm:py-1">
                {entry?.swapKcal ?? meal.kcal} kcal
              </span>
            </div>

            {eaten && (
              <button
                type="button"
                onClick={() => toggleCarryBag(meal.id)}
                className={`mt-3 text-left text-xs transition-colors sm:text-sm ${entry?.carryBagUsed ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {entry?.carryBagUsed ? '✓' : '○'} Carry bag between meals: beef
                patties, raw almonds, sweet potatoes (+{LAUTNER_CARRY_BAG.protein} g
                protein)
              </button>
            )}
          </div>
        )
      })}

      <div
        className={`rounded-2xl border p-4 text-xs sm:rounded-3xl sm:p-5 sm:text-sm ${dayOk ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}
      >
        {dayOk
          ? 'Day on target — all macros within window.'
          : 'Day off target — adjust with carry bag or a logged swap before bed.'}
      </div>

      <Card title="Swap Rules" className="mt-4">
        <ul className="space-y-2 text-sm text-slate-400">
          <li>· Protein swap within ±5 g of the original meal</li>
          <li>· Fat + carbs combined within ±5 g</li>
          <li>· Lean meats and veggies only — no junk</li>
          <li>· Breaking the window means re-eating to target</li>
        </ul>
      </Card>

      {swapModal !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="mb-4 text-lg font-semibold">
              Swap Meal {swapModal} —{' '}
              {LAUTNER_MEALS.find((m) => m.id === swapModal)?.name}
            </h2>
            <label className="mb-1 block text-xs text-slate-500">What you ate</label>
            <input
              value={swapText}
              onChange={(e) => setSwapText(e.target.value)}
              className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
              placeholder="e.g. turkey, quinoa, broccoli"
            />
            <div className="mb-4 grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Protein g</label>
                <input
                  type="number"
                  value={swapProtein}
                  onChange={(e) => setSwapProtein(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Fat g</label>
                <input
                  type="number"
                  value={swapFat}
                  onChange={(e) => setSwapFat(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Carbs g</label>
                <input
                  type="number"
                  value={swapCarbs}
                  onChange={(e) => setSwapCarbs(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSwapModal(null)}
                className="flex-1 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSwap}
                className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-600"
              >
                Save Swap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MacroPill({
  label,
  value,
  target,
  unit,
  ok,
}: {
  label: string
  value: number
  target: number
  unit: string
  ok: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${ok ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}
    >
      <div className="text-[10px] text-slate-500 sm:text-xs">{label}</div>
      <div
        className={`text-lg font-semibold sm:text-xl ${ok ? 'text-emerald-400' : 'text-amber-400'}`}
      >
        {value}
        {unit && <span className="text-xs text-slate-500"> {unit}</span>}
      </div>
      <div className="text-[10px] text-slate-500">target {target}{unit}</div>
    </div>
  )
}
