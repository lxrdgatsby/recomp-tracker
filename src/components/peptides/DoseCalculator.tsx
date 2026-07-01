import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Calculator,
  Check,
  Copy,
  Droplet,
  Plus,
  Syringe,
} from 'lucide-react'
import {
  BAC_WATER_OPTIONS,
  defaultCalculatorTargetDoseMg,
  recommendedBacWaterForVialMg,
} from '../../constants/peptideCatalog'
import type { FamiliarityLevel } from '../../types/auth'
import type { BacWaterUnits, Peptide } from '../../types'
import { buildPeptideWithProtocol } from '../../utils/recompProtocol'

const INPUT_CLASS =
  'w-full rounded-2xl border border-white/20 bg-black/40 px-4 py-3 text-lg font-semibold text-white focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30'

const SELECT_CLASS =
  'w-full appearance-none rounded-2xl border border-white/20 bg-black/40 px-4 py-3 text-lg text-white focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30'

const VIAL_OPTIONS = [5, 10, 15, 30] as const
const STORAGE_KEY = 'doseCalculator'

export interface DoseLog {
  peptideId: string
  doseMg: number
  units: number
  date: string
}

interface DoseCalculatorProps {
  peptides?: Peptide[]
  initialPeptideId?: string
  initialVialMg?: number
  initialBacWaterUnits?: BacWaterUnits
  initialTargetDoseMg?: number
  peptideCatalogId?: string
  familiarity?: FamiliarityLevel
  onLogDose?: (log: DoseLog) => void
  className?: string
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

function targetDoseForVial(
  vialMg: number,
  bacWaterUnits: BacWaterUnits,
  peptideCatalogId?: string,
  familiarity?: FamiliarityLevel
): number {
  if (peptideCatalogId && familiarity) {
    const built = buildPeptideWithProtocol(
      {
        catalogId: peptideCatalogId,
        dose: `${vialMg}mg`,
        status: 'using',
        bacWaterUnits,
        reconstituted: false,
      },
      familiarity
    )
    if (built?.protocol) return built.protocol.startingDoseMg
  }
  return defaultCalculatorTargetDoseMg(vialMg)
}

export function DoseCalculator({
  peptides = [],
  initialPeptideId,
  initialVialMg = 10,
  initialBacWaterUnits = 200,
  initialTargetDoseMg = 1,
  peptideCatalogId,
  familiarity = 'beginner',
  onLogDose,
  className = '',
}: DoseCalculatorProps) {
  const defaultPeptideId =
    initialPeptideId ?? peptideCatalogId ?? peptides[0]?.id ?? ''

  const [selectedPeptideId, setSelectedPeptideId] = useState(defaultPeptideId)
  const [vialMg, setVialMg] = useState(() => normalizeVialMg(initialVialMg))
  const [bacWaterUnits, setBacWaterUnits] = useState<BacWaterUnits>(() =>
    normalizeBacUnits(initialBacWaterUnits)
  )
  const [targetDoseMg, setTargetDoseMg] = useState(initialTargetDoseMg)
  const [syringeType, setSyringeType] = useState<'30' | '50' | '100'>('100')
  const [isCopied, setIsCopied] = useState(false)
  const [ready, setReady] = useState(false)

  const selectedPeptide = useMemo(
    () => peptides.find((p) => p.id === selectedPeptideId) ?? peptides[0],
    [peptides, selectedPeptideId]
  )

  const bacWaterMl = bacWaterUnits / 100

  const calculations = useMemo(() => {
    const concentrationMgPerMl =
      bacWaterMl > 0 ? vialMg / bacWaterMl : 0
    const volumePerDoseMl =
      concentrationMgPerMl > 0 ? targetDoseMg / concentrationMgPerMl : 0
    const unitsPerMl = parseInt(syringeType, 10)
    const syringeUnits = Math.round(volumePerDoseMl * unitsPerMl)
    const dosesRemaining =
      targetDoseMg > 0 ? Math.floor(vialMg / targetDoseMg) : 0

    return {
      concentrationMgPerMl: Math.round(concentrationMgPerMl * 100) / 100,
      volumePerDoseMl: Math.round(volumePerDoseMl * 1000) / 1000,
      syringeUnits,
      dosesRemaining: Math.max(0, dosesRemaining),
      concentrationLabel: `${Math.round(concentrationMgPerMl * 100) / 100} mg/mL`,
    }
  }, [vialMg, bacWaterMl, targetDoseMg, syringeType])

  const applyVialSelection = (nextVialMg: (typeof VIAL_OPTIONS)[number]) => {
    const nextBac = recommendedBacWaterForVialMg(nextVialMg)
    const catalogId = selectedPeptide?.id ?? peptideCatalogId
    setVialMg(nextVialMg)
    setBacWaterUnits(nextBac)
    setTargetDoseMg(targetDoseForVial(nextVialMg, nextBac, catalogId, familiarity))
  }

  const handlePeptideChange = (peptideId: string) => {
    setSelectedPeptideId(peptideId)
    const peptide = peptides.find((p) => p.id === peptideId)
    if (peptide?.protocol) {
      setVialMg(normalizeVialMg(peptide.protocol.vialMg))
      setBacWaterUnits(peptide.protocol.bacWaterUnits)
      setTargetDoseMg(peptide.protocol.startingDoseMg)
      return
    }
    const nextVial = normalizeVialMg(vialMg)
    const nextBac = recommendedBacWaterForVialMg(nextVial)
    setTargetDoseMg(targetDoseForVial(nextVial, nextBac, peptideId, familiarity))
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved) as {
          selectedPeptideId?: string
          vialMg?: number
          bacWaterUnits?: number
          bacWaterMl?: number
          targetDoseMg?: number
          syringeType?: '30' | '50' | '100'
        }

        if (data.selectedPeptideId && peptides.some((p) => p.id === data.selectedPeptideId)) {
          setSelectedPeptideId(data.selectedPeptideId)
        }

        if (typeof data.vialMg === 'number') {
          const normalized = normalizeVialMg(data.vialMg)
          const bac =
            typeof data.bacWaterUnits === 'number'
              ? normalizeBacUnits(data.bacWaterUnits)
              : typeof data.bacWaterMl === 'number'
                ? normalizeBacUnits(Math.round(data.bacWaterMl * 100))
                : recommendedBacWaterForVialMg(normalized)
          const catalogId =
            data.selectedPeptideId ?? peptideCatalogId ?? selectedPeptide?.id

          setVialMg(normalized)
          setBacWaterUnits(bac)
          setTargetDoseMg(
            typeof data.targetDoseMg === 'number'
              ? data.targetDoseMg
              : targetDoseForVial(normalized, bac, catalogId, familiarity)
          )
        }

        if (data.syringeType === '30' || data.syringeType === '50' || data.syringeType === '100') {
          setSyringeType(data.syringeType)
        }
      } catch {
        // ignore invalid storage
      }
    }
    setReady(true)
  }, [peptideCatalogId, familiarity, peptides, selectedPeptide?.id])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedPeptideId: selectedPeptide?.id ?? selectedPeptideId,
        vialMg,
        bacWaterUnits,
        targetDoseMg,
        syringeType,
      })
    )
  }, [
    vialMg,
    bacWaterUnits,
    targetDoseMg,
    syringeType,
    selectedPeptide?.id,
    selectedPeptideId,
    ready,
  ])

  const handleCopyUnits = async () => {
    try {
      await navigator.clipboard.writeText(calculations.syringeUnits.toString())
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  const handleLogDose = () => {
    const peptideId = selectedPeptide?.id ?? selectedPeptideId ?? 'custom'
    const log: DoseLog = {
      peptideId,
      doseMg: targetDoseMg,
      units: calculations.syringeUnits,
      date: new Date().toISOString(),
    }

    if (onLogDose) {
      onLogDose(log)
      return
    }

    const name = selectedPeptide?.name ?? 'peptide'
    alert(
      `Logged: ${targetDoseMg}mg (${calculations.syringeUnits} units) of ${name}`
    )
  }

  const reconstitutionSteps =
    selectedPeptide?.protocol?.reconstitutionSteps ?? [
      `Add ${bacWaterUnits} units (${bacWaterMl}mL) bacteriostatic water to the ${vialMg}mg vial`,
      'Gently swirl (do not shake) until fully dissolved',
      'Refrigerate after reconstitution',
    ]

  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/5 p-6 text-white ${className}`}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-emerald-500/15 p-2">
          <Calculator className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Dose Calculator</h2>
          <p className="text-sm text-slate-400">Accurate • Private • For tracking only</p>
        </div>
      </div>

      <div className="mb-6 flex gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <p className="text-sm text-amber-100/90">
          <strong className="text-amber-200">Important:</strong> This tool is for personal
          tracking and educational purposes only. It is{' '}
          <strong className="text-amber-200">not medical advice</strong>. Always consult your
          healthcare provider before using any peptide. Dosing should be determined by a
          qualified professional.
        </p>
      </div>

      {peptides.length > 0 && (
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-300">Peptide</label>
          <select
            value={selectedPeptide?.id ?? selectedPeptideId}
            onChange={(e) => handlePeptideChange(e.target.value)}
            className={SELECT_CLASS}
          >
            {peptides.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.dose}
              </option>
            ))}
          </select>
          {selectedPeptide?.notes && (
            <p className="mt-1 text-xs text-slate-500">{selectedPeptide.notes}</p>
          )}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Vial Size</label>
          <select
            value={vialMg}
            onChange={(e) =>
              applyVialSelection(Number(e.target.value) as (typeof VIAL_OPTIONS)[number])
            }
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
          <label className="mb-2 block text-sm font-medium text-slate-300">
            BAC Water Added
          </label>
          <select
            value={bacWaterUnits}
            onChange={(e) =>
              setBacWaterUnits(Number(e.target.value) as BacWaterUnits)
            }
            className={SELECT_CLASS}
          >
            {BAC_WATER_OPTIONS.map((units) => (
              <option key={units} value={units}>
                {units} units ({units / 100}mL)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Target Dose (mg)
          </label>
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
          <p className="mt-1 text-xs text-slate-500">Example: 0.25 = 250 mcg</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Syringe Type</label>
          <select
            value={syringeType}
            onChange={(e) => setSyringeType(e.target.value as '30' | '50' | '100')}
            className={SELECT_CLASS}
          >
            <option value="100">U-100 (100 units = 1 mL) — Most common</option>
            <option value="50">U-50 (50 units = 0.5 mL)</option>
            <option value="30">U-30 (30 units = 0.3 mL)</option>
          </select>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Syringe className="h-5 w-5 text-emerald-400" />
          <h3 className="font-semibold text-emerald-300">Live Calculations</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs text-slate-400">Concentration</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-emerald-400 md:text-3xl">
              {calculations.concentrationLabel}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs text-slate-400">Volume per Dose</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-emerald-400 md:text-3xl">
              {calculations.volumePerDoseMl} mL
            </div>
          </div>

          <div className="relative rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs text-slate-400">Draw on Syringe</div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-3xl font-bold tabular-nums text-emerald-400 md:text-4xl">
                {calculations.syringeUnits}
              </div>
              <div className="text-lg text-emerald-500/80">units</div>
            </div>
            <button
              type="button"
              onClick={handleCopyUnits}
              className="absolute right-3 top-3 rounded-lg p-1.5 transition-colors hover:bg-emerald-500/15"
              aria-label="Copy syringe units"
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4 text-emerald-400" />
              )}
            </button>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs text-slate-400">Approx. Doses Left in Vial</div>
            <div className="mt-1 text-2xl font-bold tabular-nums text-emerald-400 md:text-3xl">
              {calculations.dosesRemaining}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Droplet className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-white">Reconstitution Steps</h3>
        </div>
        <ol className="space-y-2 text-sm text-slate-300">
          {reconstitutionSteps.map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="w-5 font-mono font-semibold text-emerald-400">
                {index + 1}.
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleLogDose}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-semibold text-white transition-all hover:bg-emerald-500 active:scale-[0.985]"
        >
          <Plus className="h-5 w-5" />
          Log This Dose
        </button>
        <button
          type="button"
          onClick={() => {
            alert('Protocol saved to your plan (connect to store)')
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/20 py-4 font-semibold text-slate-200 transition-all hover:bg-white/5"
        >
          Save to My Protocol
        </button>
      </div>

      <p className="mt-6 text-center text-[10px] text-slate-500">
        Calculations are approximate. Always double-check with your provider. Store peptides
        properly.
      </p>
    </div>
  )
}

export default DoseCalculator