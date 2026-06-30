import { useEffect, useState } from 'react'
import { BAC_WATER_OPTIONS } from '../../constants/peptideCatalog'
import type { BacWaterUnits } from '../../types'

const INPUT_CLASS =
  'mt-1 w-full rounded-2xl border border-white/20 bg-black/40 p-3 text-lg text-white focus:border-emerald-500/50 focus:outline-none'

const SELECT_CLASS =
  'mt-1 w-full appearance-none rounded-2xl border border-white/20 bg-black/40 p-3 text-lg text-white focus:border-emerald-500/50 focus:outline-none'

const VIAL_OPTIONS = [5, 10, 15, 30] as const

const STORAGE_KEY = 'doseCalculator'

interface DoseCalculatorProps {
  initialVialMg?: number
  initialBacWaterUnits?: BacWaterUnits
  initialTargetDoseMg?: number
}

function normalizeVialMg(value: number): (typeof VIAL_OPTIONS)[number] {
  if (VIAL_OPTIONS.includes(value as (typeof VIAL_OPTIONS)[number])) {
    return value as (typeof VIAL_OPTIONS)[number]
  }
  return 10
}

function normalizeBacUnits(value: number): BacWaterUnits {
  if (BAC_WATER_OPTIONS.includes(value as BacWaterUnits)) {
    return value as BacWaterUnits
  }
  return 200
}

export function DoseCalculator({
  initialVialMg = 10,
  initialBacWaterUnits = 200,
  initialTargetDoseMg = 1,
}: DoseCalculatorProps) {
  const [vialMg, setVialMg] = useState(() => normalizeVialMg(initialVialMg))
  const [bacWaterUnits, setBacWaterUnits] = useState<BacWaterUnits>(() =>
    normalizeBacUnits(initialBacWaterUnits)
  )
  const [targetDoseMg, setTargetDoseMg] = useState(initialTargetDoseMg)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved) as {
          vialMg?: number
          bacWaterUnits?: number
          bacWaterMl?: number
          targetDoseMg?: number
        }
        if (typeof data.vialMg === 'number') {
          setVialMg(normalizeVialMg(data.vialMg))
        }
        if (typeof data.bacWaterUnits === 'number') {
          setBacWaterUnits(normalizeBacUnits(data.bacWaterUnits))
        } else if (typeof data.bacWaterMl === 'number') {
          setBacWaterUnits(normalizeBacUnits(Math.round(data.bacWaterMl * 100)))
        }
        if (typeof data.targetDoseMg === 'number') {
          setTargetDoseMg(data.targetDoseMg)
        }
      } catch {
        // ignore invalid storage
      }
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ vialMg, bacWaterUnits, targetDoseMg })
    )
  }, [vialMg, bacWaterUnits, targetDoseMg, ready])

  const bacWaterMl = bacWaterUnits / 100
  const concentration = vialMg / bacWaterMl
  const drawUnits = Math.round((targetDoseMg / concentration) * 100)

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 flex items-center gap-2 font-semibold">
        📏 Dose Calculator
      </h3>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-xs text-slate-400">Vial Size</label>
          <select
            value={vialMg}
            onChange={(e) => setVialMg(Number(e.target.value) as typeof vialMg)}
            className={SELECT_CLASS}
          >
            {VIAL_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}mg
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400">BAC Water Added</label>
          <select
            value={bacWaterUnits}
            onChange={(e) =>
              setBacWaterUnits(Number(e.target.value) as BacWaterUnits)
            }
            className={SELECT_CLASS}
          >
            {BAC_WATER_OPTIONS.map((units) => (
              <option key={units} value={units}>
                {units} units ({units / 100}ml)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400">Target Dose (mg)</label>
          <input
            type="number"
            min={0}
            step="any"
            value={targetDoseMg}
            onChange={(e) => {
              const next = e.target.value
              setTargetDoseMg(next === '' ? 0 : Number(next))
            }}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-emerald-500/10 p-4 text-center">
        <div className="text-sm text-emerald-400">Draw Units</div>
        <div className="font-mono text-4xl font-semibold text-emerald-400 tabular-nums">
          {drawUnits}
        </div>
        <div className="mt-1 text-xs text-slate-400">
          on a U-100 insulin syringe
        </div>
      </div>

      <div className="mt-3 text-center text-[10px] text-slate-500">
        {vialMg}mg ÷ {bacWaterUnits} units ({bacWaterMl}ml) ={' '}
        {concentration.toFixed(1)}mg/ml → {targetDoseMg}mg = {drawUnits} units
      </div>
    </div>
  )
}

export default DoseCalculator