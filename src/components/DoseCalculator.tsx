import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Calculator,
  Check,
  Clock,
  Copy,
  Droplet,
  FileText,
  Plus,
  Syringe,
} from 'lucide-react'
import jsPDF from 'jspdf'
import {
  BAC_WATER_OPTIONS,
  defaultCalculatorTargetDoseMg,
  getCatalogEntry,
  PEPTIDE_CATALOG,
  recommendedBacWaterForVialMg,
} from '../constants/peptideCatalog'
import type { FamiliarityLevel } from '../types/auth'
import type { BacWaterUnits, Peptide } from '../types'
import { buildPeptideWithProtocol } from '../utils/recompProtocol'

const VIAL_OPTIONS = [5, 10, 15, 30] as const
const STORAGE_KEY = 'doseCalculator'

const INPUT_CLASS =
  'w-full rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-lg text-white focus:border-emerald-500 focus:outline-none'

const SELECT_CLASS =
  'w-full appearance-none rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-lg text-white focus:border-emerald-500 focus:outline-none'

export interface DoseLog {
  peptideId: string
  peptideName: string
  doseMg: number
  units: number
  date: string
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
  familiarity?: FamiliarityLevel
  onLogDose?: (log: DoseLog) => void
  onSaveProtocol?: (protocol: SavedProtocolData) => void
  className?: string
}

function catalogVialDose(catalogId: string): string {
  const entry = getCatalogEntry(catalogId)
  if (!entry) return '10mg'
  const mgOption = entry.doseOptions.find((d) => /mg$/i.test(d.trim()))
  return mgOption ?? '10mg'
}

function buildCatalogPeptides(familiarity: FamiliarityLevel): Peptide[] {
  return PEPTIDE_CATALOG.map((entry) =>
    buildPeptideWithProtocol(
      {
        catalogId: entry.id,
        dose: catalogVialDose(entry.id),
        status: 'using',
        bacWaterUnits: recommendedBacWaterForVialMg(
          parseFloat(catalogVialDose(entry.id)) || 10
        ),
        reconstituted: false,
      },
      familiarity
    )
  ).filter((p): p is Peptide => p !== null)
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
  peptides = [],
  initialPeptideId,
  initialVialMg = 5,
  initialBacWaterUnits = 200,
  initialTargetDoseMg = 0.25,
  peptideCatalogId,
  familiarity = 'beginner',
  onLogDose,
  onSaveProtocol,
  className = '',
}: DoseCalculatorProps) {
  const catalogPeptides = useMemo(
    () => buildCatalogPeptides(familiarity),
    [familiarity]
  )

  const availablePeptides = peptides.length > 0 ? peptides : catalogPeptides

  const defaultPeptideId =
    initialPeptideId ??
    peptideCatalogId ??
    availablePeptides[0]?.id ??
    'bpc157'

  const [selectedPeptideId, setSelectedPeptideId] = useState(defaultPeptideId)
  const [vialMg, setVialMg] = useState(() => normalizeVialMg(initialVialMg))
  const [bacWaterMl, setBacWaterMl] = useState(initialBacWaterUnits / 100)
  const [targetDoseMg, setTargetDoseMg] = useState(initialTargetDoseMg)
  const [syringeType, setSyringeType] = useState<'30' | '50' | '100'>('100')
  const [isCopied, setIsCopied] = useState(false)
  const [vialsUsed, setVialsUsed] = useState(1)
  const [ready, setReady] = useState(false)

  const selectedPeptide = useMemo(
    () =>
      availablePeptides.find((p) => p.id === selectedPeptideId) ??
      availablePeptides[0],
    [availablePeptides, selectedPeptideId]
  )

  useEffect(() => {
    if (selectedPeptide?.protocol) {
      setVialMg(normalizeVialMg(selectedPeptide.protocol.vialMg || 5))
      setBacWaterMl(selectedPeptide.protocol.bacWaterMl || 2)
      setTargetDoseMg(selectedPeptide.protocol.startingDoseMg || 0.25)
    }
  }, [selectedPeptide])

  const currentTitration = useMemo(() => {
    return selectedPeptide?.protocol?.titration?.[0] ?? null
  }, [selectedPeptide])

  const calculations = useMemo(() => {
    if (bacWaterMl <= 0 || vialMg <= 0) {
      return {
        concentrationMgPerMl: 0,
        volumePerDoseMl: 0,
        syringeUnits: 0,
        dosesRemaining: 0,
        concentrationLabel: '0 mg/mL',
      }
    }

    const concentrationMgPerMl = vialMg / bacWaterMl
    const volumePerDoseMl = targetDoseMg / concentrationMgPerMl
    const unitsPerMl = parseInt(syringeType, 10)
    const syringeUnits = Math.max(0, Math.round(volumePerDoseMl * unitsPerMl))
    const dosesRemaining = Math.max(0, Math.floor(vialMg / targetDoseMg))

    return {
      concentrationMgPerMl: Math.round(concentrationMgPerMl * 100) / 100,
      volumePerDoseMl: Math.round(volumePerDoseMl * 1000) / 1000,
      syringeUnits,
      dosesRemaining,
      concentrationLabel: `${Math.round(concentrationMgPerMl * 100) / 100} mg/mL`,
    }
  }, [vialMg, bacWaterMl, targetDoseMg, syringeType])

  const applyVialSelection = (nextVialMg: (typeof VIAL_OPTIONS)[number]) => {
    const nextBac = recommendedBacWaterForVialMg(nextVialMg)
    setVialMg(nextVialMg)
    setBacWaterMl(nextBac / 100)
    if (selectedPeptide?.protocol) {
      setTargetDoseMg(selectedPeptide.protocol.startingDoseMg)
    } else {
      setTargetDoseMg(defaultCalculatorTargetDoseMg(nextVialMg))
    }
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
          vialsUsed?: number
        }

        if (
          data.selectedPeptideId &&
          availablePeptides.some((p) => p.id === data.selectedPeptideId)
        ) {
          setSelectedPeptideId(data.selectedPeptideId)
        }

        if (typeof data.vialMg === 'number') {
          setVialMg(normalizeVialMg(data.vialMg))
        }

        if (typeof data.bacWaterMl === 'number') {
          setBacWaterMl(data.bacWaterMl)
        } else if (typeof data.bacWaterUnits === 'number') {
          setBacWaterMl(normalizeBacUnits(data.bacWaterUnits) / 100)
        }

        if (typeof data.targetDoseMg === 'number') {
          setTargetDoseMg(data.targetDoseMg)
        }

        if (
          data.syringeType === '30' ||
          data.syringeType === '50' ||
          data.syringeType === '100'
        ) {
          setSyringeType(data.syringeType)
        }

        if (typeof data.vialsUsed === 'number' && data.vialsUsed >= 1) {
          setVialsUsed(data.vialsUsed)
        }
      } catch {
        // ignore invalid storage
      }
    }
    setReady(true)
  }, [availablePeptides])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedPeptideId: selectedPeptide?.id ?? selectedPeptideId,
        vialMg,
        bacWaterUnits: normalizeBacUnits(Math.round(bacWaterMl * 100)),
        bacWaterMl,
        targetDoseMg,
        syringeType,
        vialsUsed,
      })
    )
  }, [
    vialMg,
    bacWaterMl,
    targetDoseMg,
    syringeType,
    vialsUsed,
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
    if (!selectedPeptide) return

    const logData: DoseLog = {
      peptideId: selectedPeptide.id,
      peptideName: selectedPeptide.name,
      doseMg: targetDoseMg,
      units: calculations.syringeUnits,
      date: new Date().toISOString(),
    }

    if (onLogDose) {
      onLogDose(logData)
    } else {
      console.log('Dose logged:', logData)
      alert(
        `✅ Logged ${targetDoseMg}mg (${calculations.syringeUnits} units) of ${selectedPeptide.name}`
      )
    }
  }

  const handleSaveToProtocol = () => {
    if (!selectedPeptide) return

    const protocolData: SavedProtocolData = {
      peptideId: selectedPeptide.id,
      peptideName: selectedPeptide.name,
      vialMg,
      bacWaterMl,
      targetDoseMg,
      syringeType,
      lastUpdated: new Date().toISOString(),
    }

    console.log('Saving protocol:', protocolData)
    onSaveProtocol?.(protocolData)
    alert(`✅ Protocol for ${selectedPeptide.name} has been saved to your plan!`)
  }

  const reconstitutionSteps = selectedPeptide?.protocol?.reconstitutionSteps ?? [
    `Add ${bacWaterMl}mL bacteriostatic water slowly to the ${vialMg}mg vial.`,
    'Gently swirl (do not shake vigorously) until fully dissolved.',
    'Refrigerate and use within recommended period.',
  ]

  const exportToPDF = () => {
    if (!selectedPeptide) return

    const doc = new jsPDF()
    const date = new Date().toLocaleDateString()
    const safeDate = date.replace(/\//g, '-')

    doc.setFontSize(18)
    doc.text(`PepTrack Protocol - ${selectedPeptide.name}`, 20, 20)

    doc.setFontSize(12)
    doc.text(`Generated: ${date}`, 20, 35)
    doc.text(`Vial Size: ${vialMg}mg`, 20, 50)
    doc.text(`BAC Water: ${bacWaterMl}mL`, 20, 60)
    doc.text(
      `Target Dose: ${targetDoseMg}mg (${calculations.syringeUnits} units)`,
      20,
      70
    )
    doc.text(`Concentration: ${calculations.concentrationLabel}`, 20, 80)
    doc.text(`Syringe Type: U-${syringeType}`, 20, 90)
    doc.text(`Vials on hand: ${vialsUsed}`, 20, 100)

    if (currentTitration) {
      doc.text(
        `Titration: ${currentTitration.doseLabel}${currentTitration.notes ? ` (${currentTitration.notes})` : ''}`,
        20,
        110
      )
    }

    const stepsStartY = currentTitration ? 125 : 115
    doc.text('Reconstitution Steps:', 20, stepsStartY)
    reconstitutionSteps.forEach((step, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${step}`, 170)
      let y = stepsStartY + 15 + i * 12
      for (const line of lines) {
        if (y > 270) {
          doc.addPage()
          y = 20
        }
        doc.text(line, 20, y)
        y += 8
      }
    })

    doc.save(`${selectedPeptide.name}_Protocol_${safeDate}.pdf`)
    alert('✅ PDF exported successfully!')
  }

  return (
    <div className={`rounded-3xl bg-zinc-900 p-6 text-white ${className}`}>
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-500/10 p-2">
          <Calculator className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Dose Calculator</h2>
          <p className="text-sm text-zinc-400">Accurate • Private • Tracking only</p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-amber-800 bg-amber-950 p-4 text-sm text-amber-300">
        <AlertTriangle className="mb-2 inline h-4 w-4 text-amber-400" />{' '}
        <strong>Important:</strong> This is for personal tracking only. Not medical advice.
        Consult your provider.
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm text-zinc-400">Peptide</label>
        <select
          value={selectedPeptide?.id ?? selectedPeptideId}
          onChange={(e) => setSelectedPeptideId(e.target.value)}
          className={SELECT_CLASS}
        >
          {availablePeptides.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.dose}
            </option>
          ))}
        </select>
        {selectedPeptide?.notes && (
          <p className="mt-1 text-xs text-zinc-500">{selectedPeptide.notes}</p>
        )}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Vial Size</label>
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
          <label className="mb-2 block text-sm text-zinc-400">BAC Water Added</label>
          <select
            value={normalizeBacUnits(Math.round(bacWaterMl * 100))}
            onChange={(e) => setBacWaterMl(Number(e.target.value) / 100)}
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
          <label className="mb-2 block text-sm text-zinc-400">Target Dose (mg)</label>
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
          <p className="mt-1 text-xs text-zinc-500">Example: 0.25 = 250 mcg</p>
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">Syringe Type</label>
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

      {currentTitration && (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-zinc-800 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <span className="font-medium text-amber-400">Titration Schedule</span>
          </div>
          <p className="text-sm text-zinc-300">
            Current recommended:{' '}
            <strong className="text-white">{currentTitration.doseLabel}</strong>
            {currentTitration.notes ? ` (${currentTitration.notes})` : ''}
          </p>
        </div>
      )}

      <div className="mb-8 rounded-3xl border border-emerald-500/30 bg-zinc-800 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-semibold">Live Results</h3>
          </div>
          <div className="text-xs text-emerald-400">Real-time</div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-zinc-900 p-4">
            <div className="text-xs text-zinc-400">Concentration</div>
            <div className="mt-1 text-3xl font-bold tabular-nums text-white">
              {calculations.concentrationLabel}
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-4">
            <div className="text-xs text-zinc-400">Volume to Draw</div>
            <div className="mt-1 text-3xl font-bold tabular-nums text-white">
              {calculations.volumePerDoseMl} mL
            </div>
          </div>

          <div className="relative rounded-2xl bg-zinc-900 p-4">
            <div className="text-xs text-zinc-400">Syringe Units</div>
            <div className="flex items-baseline">
              <span className="text-5xl font-bold tabular-nums text-emerald-400">
                {calculations.syringeUnits}
              </span>
              <span className="ml-1 text-2xl text-zinc-400">U</span>
            </div>
            <button
              type="button"
              onClick={handleCopyUnits}
              className="absolute right-4 top-4 text-emerald-400 transition-colors hover:text-emerald-300"
              aria-label="Copy syringe units"
            >
              {isCopied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-zinc-900 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs text-zinc-400">Vials on hand</div>
              <div className="mt-1 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setVialsUsed((v) => Math.max(1, v - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 text-zinc-300 transition-colors hover:bg-zinc-800"
                  aria-label="Decrease vials"
                >
                  −
                </button>
                <span className="min-w-[2ch] text-center text-xl font-semibold tabular-nums text-white">
                  {vialsUsed}
                </span>
                <button
                  type="button"
                  onClick={() => setVialsUsed((v) => v + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 text-zinc-300 transition-colors hover:bg-zinc-800"
                  aria-label="Increase vials"
                >
                  +
                </button>
              </div>
            </div>
            {calculations.dosesRemaining > 0 && (
              <div className="text-sm text-emerald-400">
                ≈ {calculations.dosesRemaining} doses left per vial
                {vialsUsed > 1 && (
                  <span className="block text-zinc-400">
                    ~{calculations.dosesRemaining * vialsUsed} total across {vialsUsed}{' '}
                    vials
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Droplet className="h-5 w-5 text-zinc-400" />
          <h3 className="font-semibold">Reconstitution Steps</h3>
        </div>
        <ol className="space-y-2 text-sm text-zinc-300">
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

      <div className="flex flex-col gap-3">
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
            onClick={handleSaveToProtocol}
            className="w-full rounded-2xl border border-zinc-700 py-4 font-medium transition-colors hover:bg-zinc-800 sm:flex-1"
          >
            Save to My Protocol
          </button>
        </div>
        <button
          type="button"
          onClick={exportToPDF}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-700 py-4 font-medium transition-colors hover:bg-zinc-800"
        >
          <FileText size={18} />
          Export PDF Report
        </button>
      </div>

      <p className="mt-6 text-center text-[10px] text-zinc-500">
        Calculations are approximate. Always double-check with your provider. Store peptides
        properly.
      </p>
    </div>
  )
}

export default DoseCalculator