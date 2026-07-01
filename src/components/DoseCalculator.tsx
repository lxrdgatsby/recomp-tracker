import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Calculator,
  Check,
  Clock,
  Copy,
  Droplet,
  FileText,
  Package,
  Plus,
  Syringe,
  Target,
  Trash2,
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
import type { BacWaterUnits, Peptide, TitrationWeek } from '../types'
import { InjectionSiteMap } from './peptides/InjectionSiteMap'
import { buildPeptideWithProtocol } from '../utils/recompProtocol'

const VIAL_OPTIONS = [5, 10, 15, 30] as const
const STORAGE_KEY = 'doseCalculator'

const DEFAULT_TITRATION_STEPS: TitrationWeek[] = [
  {
    weeks: 'Week 1-2',
    doseMg: 0.25,
    doseLabel: '250 mcg',
    syringeUnits: 10,
    notes: 'Starting dose',
  },
  {
    weeks: 'Week 3-4',
    doseMg: 0.5,
    doseLabel: '500 mcg',
    syringeUnits: 20,
    notes: 'Therapeutic dose',
  },
]

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

export interface Vial {
  id: string
  peptideId: string
  vialMg: number
  remainingMg: number
  dateAdded: string
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

function createVial(peptideId: string, sizeMg: number): Vial {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    peptideId,
    vialMg: sizeMg,
    remainingMg: sizeMg,
    dateAdded: new Date().toISOString(),
  }
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
  const [vials, setVials] = useState<Vial[]>([])
  const [activeVialId, setActiveVialId] = useState<string | null>(null)
  const [currentTitrationWeek, setCurrentTitrationWeek] = useState(0)
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

  useEffect(() => {
    setCurrentTitrationWeek(0)
  }, [selectedPeptide?.id])

  const titrationSteps = useMemo(() => {
    const fromProtocol = selectedPeptide?.protocol?.titration
    if (fromProtocol && fromProtocol.length > 0) return fromProtocol
    return DEFAULT_TITRATION_STEPS
  }, [selectedPeptide])

  const currentStep = titrationSteps[currentTitrationWeek] ?? titrationSteps[0]
  const progressPercent = Math.round(
    ((currentTitrationWeek + 1) / titrationSteps.length) * 100
  )

  const peptideVials = useMemo(
    () =>
      selectedPeptide
        ? vials.filter((v) => v.peptideId === selectedPeptide.id)
        : [],
    [vials, selectedPeptide]
  )

  const activeVial = useMemo(
    () => peptideVials.find((v) => v.id === activeVialId) ?? null,
    [peptideVials, activeVialId]
  )

  useEffect(() => {
    if (!selectedPeptide || !ready) return

    if (peptideVials.length === 0) {
      const newVial = createVial(selectedPeptide.id, vialMg)
      setVials((prev) => [...prev, newVial])
      setActiveVialId(newVial.id)
      return
    }

    if (!activeVialId || !peptideVials.some((v) => v.id === activeVialId)) {
      setActiveVialId(peptideVials[0].id)
    }
  }, [selectedPeptide, ready, vialMg, peptideVials, activeVialId])

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
    const remainingMg = activeVial?.remainingMg ?? vialMg
    const dosesRemaining =
      targetDoseMg > 0 ? Math.max(0, Math.floor(remainingMg / targetDoseMg)) : 0

    return {
      concentrationMgPerMl: Math.round(concentrationMgPerMl * 100) / 100,
      volumePerDoseMl: Math.round(volumePerDoseMl * 1000) / 1000,
      syringeUnits,
      dosesRemaining,
      concentrationLabel: `${Math.round(concentrationMgPerMl * 100) / 100} mg/mL`,
    }
  }, [vialMg, bacWaterMl, targetDoseMg, syringeType, activeVial?.remainingMg])

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
          vials?: Vial[]
          activeVialId?: string | null
          currentTitrationWeek?: number
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

        if (Array.isArray(data.vials)) {
          setVials(data.vials)
        }

        if (typeof data.activeVialId === 'string') {
          setActiveVialId(data.activeVialId)
        }

        if (
          typeof data.currentTitrationWeek === 'number' &&
          data.currentTitrationWeek >= 0
        ) {
          setCurrentTitrationWeek(data.currentTitrationWeek)
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
        vials,
        activeVialId,
        currentTitrationWeek,
      })
    )
  }, [
    vialMg,
    bacWaterMl,
    targetDoseMg,
    syringeType,
    vials,
    activeVialId,
    currentTitrationWeek,
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
    }

    if (activeVialId) {
      setVials((prev) =>
        prev.map((vial) =>
          vial.id === activeVialId
            ? {
                ...vial,
                remainingMg: Math.max(0, vial.remainingMg - targetDoseMg),
              }
            : vial
        )
      )
    }

    alert(`✅ Logged ${targetDoseMg}mg for ${selectedPeptide.name}`)
  }

  const addNewVial = () => {
    if (!selectedPeptide) return
    const newVial = createVial(selectedPeptide.id, vialMg)
    setVials((prev) => [...prev, newVial])
    setActiveVialId(newVial.id)
  }

  const deleteVial = (id: string) => {
    setVials((prev) => {
      const next = prev.filter((v) => v.id !== id)
      if (activeVialId === id) {
        const remainingForPeptide = next.filter(
          (v) => v.peptideId === selectedPeptide?.id
        )
        setActiveVialId(remainingForPeptide[0]?.id ?? null)
      }
      return next
    })
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
    const pageWidth = doc.internal.pageSize.getWidth()
    const date = new Date().toLocaleDateString()

    doc.setFontSize(20)
    doc.setTextColor(0, 150, 100)
    doc.text('PepTrack Protocol Report', pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(
      `Generated: ${date} • ${selectedPeptide.name}`,
      pageWidth / 2,
      30,
      { align: 'center' }
    )

    doc.setFillColor(240, 248, 244)
    doc.rect(20, 40, pageWidth - 40, 45, 'F')

    doc.setTextColor(0)
    doc.setFontSize(12)
    doc.text(`Vial: ${vialMg}mg`, 30, 50)
    doc.text(`BAC Water: ${bacWaterMl}mL`, 30, 58)
    doc.text(
      `Target Dose: ${targetDoseMg}mg (${calculations.syringeUnits} units on U-${syringeType})`,
      30,
      66
    )
    doc.text(`Concentration: ${calculations.concentrationLabel}`, 30, 74)

    doc.setFontSize(13)
    doc.text('Reconstitution Steps', 20, 100)

    doc.setFontSize(11)
    let stepY = 115
    reconstitutionSteps.forEach((step, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${step}`, pageWidth - 40)
      for (const line of lines) {
        if (stepY > 265) {
          doc.addPage()
          stepY = 20
        }
        doc.text(line, 20, stepY)
        stepY += 8
      }
    })

    doc.setFontSize(10)
    doc.setTextColor(150)
    doc.text('This is a personal tracking tool. Not medical advice.', 20, 280)
    doc.text('Always consult your healthcare provider.', 20, 288)

    doc.save(`${selectedPeptide.name}_Protocol_${date.replace(/\//g, '-')}.pdf`)

    alert('✅ Professional PDF exported successfully!')
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

      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold">Vial Inventory</h3>
          </div>
          <button
            type="button"
            onClick={addNewVial}
            className="flex items-center gap-1 text-sm text-emerald-400 transition-colors hover:text-emerald-300"
          >
            <Plus size={16} />
            Add New Vial
          </button>
        </div>

        {peptideVials.length > 0 ? (
          <div className="space-y-2">
            {peptideVials.map((vial) => {
              const percentLeft = Math.round((vial.remainingMg / vial.vialMg) * 100)
              const isActive = vial.id === activeVialId
              return (
                <div
                  key={vial.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveVialId(vial.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setActiveVialId(vial.id)
                  }}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-950/30'
                      : 'border-zinc-700 bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{vial.vialMg}mg vial</div>
                      <div className="text-sm text-zinc-400">
                        {vial.remainingMg.toFixed(1)}mg remaining ({percentLeft}%)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteVial(vial.id)
                      }}
                      className="p-1 text-red-400 transition-colors hover:text-red-500"
                      aria-label="Delete vial"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-700">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${percentLeft}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-zinc-400">
            No vials tracked yet. Add one above.
          </div>
        )}
      </div>

      {titrationSteps.length > 0 && currentStep && (
        <div className="mb-8 rounded-3xl border border-amber-500/20 bg-zinc-800 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-semibold">Titration Schedule</h3>
          </div>

          <div className="mb-4">
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-zinc-300">Progress</span>
              <span className="text-emerald-400">{progressPercent}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-zinc-700">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mb-4 rounded-2xl bg-zinc-900 p-4">
            <div className="mb-1 text-xs text-amber-400">CURRENT STEP</div>
            <div className="text-2xl font-bold text-white">{currentStep.doseLabel}</div>
            {currentStep.notes && (
              <div className="mt-1 text-sm text-zinc-400">{currentStep.notes}</div>
            )}
            <div className="mt-2 text-sm text-zinc-300">
              Recommended:{' '}
              <span className="text-emerald-400">{currentStep.syringeUnits} units</span>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {titrationSteps.map((step, index) => (
              <button
                key={`${step.weeks}-${index}`}
                type="button"
                onClick={() => setCurrentTitrationWeek(index)}
                className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm transition-all ${
                  currentTitrationWeek === index
                    ? 'bg-amber-500 font-medium text-black'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                {step.weeks}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <Target className="h-5 w-5 text-emerald-400" />
            Injection Site Rotation
          </h3>
          <button
            type="button"
            className="text-xs text-emerald-400 transition-colors hover:text-emerald-300"
          >
            View Full Map →
          </button>
        </div>

        <InjectionSiteMap
          embedded
          selectedPeptide={selectedPeptide}
          onSiteSelect={(site) => console.log('Selected site:', site)}
        />
      </div>

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

        {calculations.dosesRemaining > 0 && (
          <p className="mt-4 text-center text-sm text-emerald-400">
            ≈ {calculations.dosesRemaining} doses left
            {activeVial ? ' in active vial' : ' in this vial'}
            {peptideVials.length > 1 && (
              <span className="block text-zinc-400">
                {peptideVials.length} vials tracked for {selectedPeptide?.name}
              </span>
            )}
          </p>
        )}
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
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 py-4 font-medium transition-all hover:bg-emerald-950"
        >
          <FileText size={18} />
          Export Professional PDF Report
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