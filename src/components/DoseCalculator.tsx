import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Calculator } from 'lucide-react'
import {
  getReconstitutionCompound,
  KLOW_NOTE,
  RECONSTITUTION_TABLE,
  U100_FORMULA,
} from '../constants/reconstitutionTable'
import {
  mlFromU100Units,
  testCypMgFromMl,
  u100UnitsFromMg,
} from '../utils/doseMath'
import type { BacWaterUnits, Peptide } from '../types'
import type { InventoryVial } from '../lib/vialInventory'

const INPUT =
  'min-w-0 flex-1 rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-lg text-white focus:border-emerald-500 focus:outline-none'
const SELECT =
  'w-full appearance-none rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-lg text-white focus:border-emerald-500 focus:outline-none'
const UNIT_SELECT =
  'w-24 shrink-0 appearance-none rounded-2xl border border-zinc-700 bg-zinc-800 px-3 py-3 text-lg text-white focus:border-emerald-500 focus:outline-none'

export interface DoseLog {
  peptideId: string
  peptideName: string
  doseMg: number
  units: number
  date: string
}

export interface Vial extends InventoryVial {
  dateAdded?: string
}

export interface SavedProtocolData {
  peptideId: string
  peptideName: string
  vialMg: number
  bacWaterMl: number
  targetDoseMg: number
  syringeType: '30' | '50' | '100'
  lastUpdated: string
}

interface DoseCalculatorProps {
  peptides?: Peptide[]
  initialPeptideId?: string
  initialVialMg?: number
  initialBacWaterUnits?: BacWaterUnits
  initialTargetDoseMg?: number
  peptideCatalogId?: string
  familiarity?: string
  onLogDose?: (log: DoseLog) => void
  onSaveProtocol?: (protocol: SavedProtocolData) => void
  onAddPeptideToStack?: (peptide: Peptide) => void
  className?: string
}

function sanitizeDecimal(raw: string): string {
  const next = raw.replace(/[^0-9.]/g, '')
  const parts = next.split('.')
  return parts.length <= 1 ? next : `${parts[0]}.${parts.slice(1).join('')}`
}

export function DoseCalculator({
  peptides = [],
  initialPeptideId,
  initialVialMg = 50,
  initialBacWaterUnits = 300,
  initialTargetDoseMg = 2.5,
  peptideCatalogId,
  className = '',
}: DoseCalculatorProps) {
  const options = useMemo(() => {
    const fromTable = RECONSTITUTION_TABLE.map((c) => ({ id: c.id, name: c.name }))
    const extra = peptides
      .filter((p) => !fromTable.some((c) => c.id === p.id))
      .map((p) => ({ id: p.id, name: p.name }))
    return [...fromTable, ...extra]
  }, [peptides])

  const [selectedId, setSelectedId] = useState(
    initialPeptideId ?? peptideCatalogId ?? options[0]?.id ?? 'ss31'
  )
  const [vialInput, setVialInput] = useState(
    initialVialMg > 0 ? String(initialVialMg) : ''
  )
  const [bacInput, setBacInput] = useState(
    initialBacWaterUnits > 0 ? String(initialBacWaterUnits / 100) : ''
  )
  const [doseInput, setDoseInput] = useState(
    initialTargetDoseMg > 0 ? String(initialTargetDoseMg) : ''
  )
  const [doseUnit, setDoseUnit] = useState<'mg' | 'mcg'>('mg')
  const [syringeType, setSyringeType] = useState<'30' | '50' | '100'>('100')

  const table = getReconstitutionCompound(selectedId)
  const isTestCyp = table?.isTestCyp === true || selectedId === 'test-cyp'
  const parsedVial = vialInput.trim() === '' ? NaN : Number(vialInput)
  const parsedBac = bacInput.trim() === '' ? NaN : Number(bacInput)
  const parsedDose = doseInput.trim() === '' ? NaN : Number(doseInput)
  const desiredMg = doseUnit === 'mcg' ? parsedDose / 1000 : parsedDose

  useEffect(() => {
    const compound = getReconstitutionCompound(selectedId)
    if (!compound) return
    if (compound.vialMg != null) setVialInput(String(compound.vialMg))
    if (compound.bacMl != null) setBacInput(String(compound.bacMl))
    setDoseUnit(compound.doseUnit === 'mcg' ? 'mcg' : 'mg')
    if (compound.defaultDoseMg != null) setDoseInput(String(compound.defaultDoseMg))
  }, [selectedId])

  const math = useMemo(() => {
    const u100 = u100UnitsFromMg(desiredMg, parsedVial, parsedBac)
    if (u100 == null) {
      return { ready: false, units: 0, conc: 0, ml: 0 }
    }
    const conc = parsedVial / parsedBac
    const ml = mlFromU100Units(u100)
    const scale = parseInt(syringeType, 10)
    const units = scale === 100 ? u100 : Math.round(ml * scale * 2) / 2
    return { ready: true, units, conc, ml }
  }, [desiredMg, parsedVial, parsedBac, syringeType])

  return (
    <section
      className={`rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-white ${className}`}
    >
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="text-emerald-400" size={18} />
        <div>
          <div className="font-medium">Dose Calculator</div>
          <div className="text-xs text-slate-400">Accurate · Private · Tracking only</div>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        <AlertTriangle className="mr-2 inline" size={16} />
        Important: This is for personal tracking only. Not medical advice. Consult your provider.
      </div>

      <label className="mb-2 block text-sm text-zinc-400">Compound</label>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className={`${SELECT} mb-2`}
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
      {table && (
        <p className="mb-4 text-xs text-zinc-500">
          {table.concentrationLabel}
          {table.keyDraws.length
            ? ` · ${table.keyDraws.map((d) => d.label).join(' · ')}`
            : ''}
        </p>
      )}

      {isTestCyp ? (
        <p className="mb-4 text-sm text-slate-300">
          Test Cyp is an oil volume draw. Protocol is 0.75 mL
          {Number.isFinite(parsedDose)
            ? ` → ${testCypMgFromMl(0.75, 200)} mg at 200 mg/mL.`
            : '.'}
        </p>
      ) : (
        <div className="mb-4 grid grid-cols-1 gap-4">
          <div>
            <label className="mb-2 block text-sm text-zinc-400">Vial mg</label>
            <input
              type="text"
              inputMode="decimal"
              value={vialInput}
              onChange={(e) => setVialInput(sanitizeDecimal(e.target.value))}
              className={`${INPUT} w-full`}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-zinc-400">BAC mL</label>
            <input
              type="text"
              inputMode="decimal"
              value={bacInput}
              onChange={(e) => setBacInput(sanitizeDecimal(e.target.value))}
              className={`${INPUT} w-full`}
            />
            <p className="mt-1 text-xs text-zinc-500">
              Presets:{' '}
              {[1, 2, 3, 5].map((ml) => (
                <button
                  key={ml}
                  type="button"
                  className="mr-2 text-emerald-400"
                  onClick={() => setBacInput(String(ml))}
                >
                  {ml} mL
                </button>
              ))}
            </p>
          </div>
          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Desired dose ({doseUnit})
            </label>
            <div className="flex items-stretch gap-2">
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                value={doseInput}
                onChange={(e) => setDoseInput(sanitizeDecimal(e.target.value))}
                className={INPUT}
              />
              <select
                value={doseUnit}
                onChange={(e) => {
                  const next = e.target.value as 'mg' | 'mcg'
                  if (next === doseUnit) return
                  const n = Number(doseInput)
                  if (Number.isFinite(n) && doseInput !== '') {
                    const converted = next === 'mcg' ? n * 1000 : n / 1000
                    setDoseInput(
                      Number.isInteger(converted)
                        ? String(converted)
                        : String(Number(converted.toFixed(6)))
                    )
                  }
                  setDoseUnit(next)
                }}
                className={UNIT_SELECT}
              >
                <option value="mg">mg</option>
                <option value="mcg">mcg</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm text-zinc-400">Syringe Type</label>
            <select
              value={syringeType}
              onChange={(e) =>
                setSyringeType(e.target.value as '30' | '50' | '100')
              }
              className={SELECT}
            >
              <option value="100">U-100 (100 units = 1 mL)</option>
              <option value="50">U-50 (50 units = 0.5 mL)</option>
              <option value="30">U-30 (30 units = 0.3 mL)</option>
            </select>
          </div>
        </div>
      )}

      {table?.id === 'klow' && (
        <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">
          {KLOW_NOTE}
        </div>
      )}

      {table && table.keyDraws.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {table.keyDraws.map((draw) => (
            <button
              key={draw.label}
              type="button"
              onClick={() => {
                setDoseUnit('mg')
                setDoseInput(String(draw.desiredMg))
              }}
              className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300"
            >
              {draw.label}
            </button>
          ))}
        </div>
      )}

      <p className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-xs text-slate-400">
        {U100_FORMULA}
      </p>

      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
        <div className="text-xs uppercase tracking-wide text-emerald-300">Draw</div>
        <div className="mt-1 text-2xl font-semibold text-white">
          {math.ready ? `${math.units} units` : '—'}
        </div>
        <div className="mt-1 text-sm text-slate-400">
          {math.ready
            ? `${math.conc.toFixed(2)} mg/mL · ${math.ml.toFixed(3)} mL`
            : 'Enter vial mg, BAC mL, and desired dose'}
        </div>
      </div>
    </section>
  )
}

export default DoseCalculator
