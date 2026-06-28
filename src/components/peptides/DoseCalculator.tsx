import { useEffect, useState } from 'react'

const INPUT_CLASS =
  'mt-1 w-full rounded-2xl border border-white/20 bg-black/40 p-3 text-lg text-white focus:border-emerald-500/50 focus:outline-none'

const STORAGE_KEY = 'doseCalculator'

interface SavedDoseCalculator {
  vialMg: number
  bacWaterMl: number
  targetDoseMg: number
}

function readStorage(): SavedDoseCalculator | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    const data = JSON.parse(saved) as Partial<SavedDoseCalculator>
    if (
      typeof data.vialMg === 'number' &&
      typeof data.bacWaterMl === 'number' &&
      typeof data.targetDoseMg === 'number'
    ) {
      return data as SavedDoseCalculator
    }
  } catch {
    // ignore invalid storage
  }
  return null
}

interface DoseCalculatorProps {
  initialVialMg?: number
  initialBacWaterMl?: number
  initialTargetDoseMg?: number
}

export function DoseCalculator({
  initialVialMg = 10,
  initialBacWaterMl = 2,
  initialTargetDoseMg = 1,
}: DoseCalculatorProps) {
  const saved = readStorage()
  const [vialMg, setVialMg] = useState(saved?.vialMg ?? initialVialMg)
  const [bacWaterMl, setBacWaterMl] = useState(
    saved?.bacWaterMl ?? initialBacWaterMl
  )
  const [targetDoseMg, setTargetDoseMg] = useState(
    saved?.targetDoseMg ?? initialTargetDoseMg
  )

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ vialMg, bacWaterMl, targetDoseMg })
    )
  }, [vialMg, bacWaterMl, targetDoseMg])

  const concentration = bacWaterMl > 0 ? vialMg / bacWaterMl : 0
  const units =
    concentration > 0
      ? Math.round((targetDoseMg / concentration) * 100)
      : 0

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 flex items-center gap-2 font-semibold">
        📏 Dose Calculator
      </h3>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-xs text-slate-400">Vial Size (mg)</label>
          <input
            type="number"
            min={0}
            step="any"
            value={vialMg}
            onChange={(e) => setVialMg(Number(e.target.value) || 0)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">BAC Water Added (ml)</label>
          <input
            type="number"
            min={0}
            step="any"
            value={bacWaterMl}
            onChange={(e) => setBacWaterMl(Number(e.target.value) || 0)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">Target Dose (mg)</label>
          <input
            type="number"
            min={0}
            step="any"
            value={targetDoseMg}
            onChange={(e) => setTargetDoseMg(Number(e.target.value) || 0)}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-emerald-500/10 p-4 text-center">
        <div className="text-sm text-emerald-400">DRAW</div>
        <div className="font-mono text-4xl font-semibold text-emerald-400 tabular-nums">
          {units} units
        </div>
        <div className="mt-1 text-xs text-slate-400">
          on a U-100 insulin syringe
        </div>
      </div>

      <div className="mt-3 text-center text-[10px] text-slate-500">
        {vialMg}mg ÷ {bacWaterMl}ml = {concentration.toFixed(1)}mg/ml →{' '}
        {targetDoseMg}mg = {units} units
      </div>
    </div>
  )
}

export default DoseCalculator