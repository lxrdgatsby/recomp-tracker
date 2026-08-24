import { generateId } from './generateId'
import { STORAGE_KEY } from '../constants/defaults'
import {
  getCatalogEntry,
  getCatalogEntryByName,
  recommendedBacWaterForVialMg,
} from '../constants/peptideCatalog'
import type { BacWaterUnits, Peptide, PeptideFrequency, TrackerState } from '../types'
import type { FamiliarityLevel } from '../types/auth'
import {
  buildCalculationSummary,
  buildPeptideWithProtocol,
  formatMg,
  mgToSyringeUnits,
} from '../utils/recompProtocol'

export const VIALS_STORAGE_KEY = 'vials'

export interface InventoryVial {
  id: string
  peptideId: string
  compoundName: string
  vialMg: number
  bacWaterMl: number
  concentrationMgPerMl: number
  mixedDate: string
  isPowder: false
  remainingMg: number
  notes?: string
  createdAt: string
}

export const PROTOCOL_PEPTIDE_OPTIONS: {
  id: string
  name: string
  defaultVialMg: number
  defaultBacMl: number
  targetDoseMg: number
  frequency: PeptideFrequency
  timing: string
  notes: string
}[] = [
  {
    id: 'test-cyp',
    name: 'Test Cyp',
    defaultVialMg: 0,
    defaultBacMl: 0,
    targetDoseMg: 0,
    frequency: 'weekly',
    timing: 'Sunday PM',
    notes: 'Dose stored as volume. Confirm mg/mL on vial.',
  },
  {
    id: 'retatrutide',
    name: 'Retatrutide',
    defaultVialMg: 10,
    defaultBacMl: 2,
    targetDoseMg: 2.5,
    frequency: 'weekly',
    timing: 'Sunday evening',
    notes: '2.5 mg = 50 units.',
  },
  {
    id: 'tesamorelin',
    name: 'Tesamorelin',
    defaultVialMg: 20,
    defaultBacMl: 3,
    targetDoseMg: 0.5,
    frequency: 'daily',
    timing: 'Nightly (2–3h fasted)',
    notes: 'Week 1: 0.5 mg = 7.5 u; Weeks 2–4: 1.0 mg = 15 u.',
  },
  {
    id: 'aod9604',
    name: 'AOD-9604',
    defaultVialMg: 10,
    defaultBacMl: 3,
    targetDoseMg: 0.5,
    frequency: 'daily',
    timing: 'Morning fasted',
    notes: 'Week 1: 0.5 mg = 15 u; Weeks 2–4: 1.0 mg = 30 u.',
  },
  {
    id: 'ss31',
    name: 'SS-31',
    defaultVialMg: 50,
    defaultBacMl: 3,
    targetDoseMg: 2.5,
    frequency: 'daily',
    timing: 'Morning fasted',
    notes: '2.5 mg = 15 units daily.',
  },
  {
    id: 'ghkcu',
    name: 'GHK-Cu',
    defaultVialMg: 100,
    defaultBacMl: 3,
    targetDoseMg: 1,
    frequency: 'daily',
    timing: 'Morning fasted',
    notes: '1 mg = 3 units daily or 5x/week.',
  },
  {
    id: 'motsc',
    name: 'MOTS-c',
    defaultVialMg: 10,
    defaultBacMl: 3,
    targetDoseMg: 0.5,
    frequency: 'mwf',
    timing: 'Morning fasted · Mon/Wed/Fri',
    notes: '0.5 mg = 15 units M/W/F.',
  },
  {
    id: 'bpc157',
    name: 'BPC-157',
    defaultVialMg: 10,
    defaultBacMl: 2,
    targetDoseMg: 0.5,
    frequency: 'daily',
    timing: 'PM or split',
    notes: '500 mcg = 10 units.',
  },
  {
    id: 'klow',
    name: 'KLOW',
    defaultVialMg: 10,
    defaultBacMl: 3,
    targetDoseMg: 0.5,
    frequency: 'daily',
    timing: 'Evening',
    notes: '0.5 mg = 15 units.',
  },
  {
    id: 'nad',
    name: 'NAD+',
    defaultVialMg: 1000,
    defaultBacMl: 5,
    targetDoseMg: 50,
    frequency: 'mwf',
    timing: 'Evening · Mon/Wed/Fri',
    notes: '50 mg = 25 units M/W/F.',
  },
]

const NAME_ALIASES: Record<string, string> = {
  'ss31': 'SS-31',
  'aod9604': 'AOD-9604',
  'ghkcu': 'GHK-Cu',
  'motsc': 'MOTS-c',
  'bpc157': 'BPC-157',
  'test-cyp': 'Test Cyp',
  'nad': 'NAD+',
  'klow': 'KLOW',
  'retatrutide': 'Retatrutide',
  'tesamorelin': 'Tesamorelin',
}

export function displayPeptideName(peptide: { id?: string; name: string }): string {
  if (peptide.id && NAME_ALIASES[peptide.id]) return NAME_ALIASES[peptide.id]
  const byName = PROTOCOL_PEPTIDE_OPTIONS.find(
    (p) => p.name.toLowerCase() === peptide.name.toLowerCase()
  )
  if (byName) return byName.name
  return peptide.name.replace(/\s*\(.*\)\s*$/, '')
}

export function peptideHelperText(peptide: Peptide): string | null {
  if (peptide.notes?.trim()) return peptide.notes.trim()
  const proto = peptide.protocol
  if (!proto || proto.startingDoseMg <= 0) return null
  return `${formatMg(proto.startingDoseMg)} = ${proto.startingSyringeUnits} units`
}

function bacUnitsFromMl(ml: number): BacWaterUnits {
  const units = Math.round(ml * 100)
  if (units <= 100) return 100
  if (units <= 200) return 200
  if (units <= 300) return 300
  return 500
}

export function todayIsoDate(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function slugPeptideId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug ? `custom-${slug}` : `custom-${generateId()}`
}

export function buildPeptideForNewVial(opts: {
  id: string
  name: string
  vialMg: number
  bacWaterMl: number
  targetDoseMg: number
  frequency: PeptideFrequency
  timing: string
  notes: string
  familiarity: FamiliarityLevel
}): Peptide {
  const displayName = displayPeptideName({ id: opts.id, name: opts.name })
  const bacWaterUnits = bacUnitsFromMl(opts.bacWaterMl)
  const catalog =
    getCatalogEntry(opts.id) ?? getCatalogEntryByName(opts.name) ?? getCatalogEntryByName(displayName)

  if (catalog && opts.vialMg > 0) {
    const built = buildPeptideWithProtocol(
      {
        catalogId: catalog.id,
        dose: `${opts.vialMg}mg`,
        status: 'using',
        bacWaterUnits:
          opts.bacWaterMl > 0 ? bacWaterUnits : recommendedBacWaterForVialMg(opts.vialMg),
        reconstituted: false,
      },
      opts.familiarity
    )
    if (built?.protocol) {
      const conc = opts.bacWaterMl > 0 ? opts.vialMg / opts.bacWaterMl : built.protocol.concentrationMgPerMl
      const target = opts.targetDoseMg > 0 ? opts.targetDoseMg : built.protocol.startingDoseMg
      const units = conc > 0 && target > 0 ? mgToSyringeUnits(target, conc) : built.protocol.startingSyringeUnits
      return {
        ...built,
        id: catalog.id,
        name: displayName,
        dose: target > 0 ? formatMg(target) : built.dose,
        notes: opts.notes || built.notes,
        protocol: {
          ...built.protocol,
          vialMg: opts.vialMg,
          bacWaterMl: opts.bacWaterMl || built.protocol.bacWaterMl,
          bacWaterUnits,
          concentrationMgPerMl: conc,
          concentrationLabel: `${Number(conc.toFixed(2))} mg/mL`,
          startingDoseMg: target,
          startingDoseLabel: target > 0 ? formatMg(target) : built.protocol.startingDoseLabel,
          startingSyringeUnits: units,
          calculationSummary: buildCalculationSummary(opts.vialMg, bacWaterUnits, target || built.protocol.startingDoseMg),
        },
      }
    }
  }

  const conc = opts.bacWaterMl > 0 ? opts.vialMg / opts.bacWaterMl : 0
  const target = opts.targetDoseMg
  const units = conc > 0 && target > 0 ? mgToSyringeUnits(target, conc) : 0

  return {
    id: opts.id,
    name: displayName,
    dose: target > 0 ? formatMg(target) : '',
    frequency: opts.frequency,
    timing: opts.timing,
    notes: opts.notes,
    vialSize: opts.vialMg > 0 ? `${opts.vialMg}mg` : undefined,
    protocol:
      opts.vialMg > 0 && opts.bacWaterMl > 0
        ? {
            vialMg: opts.vialMg,
            bacWaterUnits,
            bacWaterMl: opts.bacWaterMl,
            concentrationMgPerMl: conc,
            concentrationLabel: `${Number(conc.toFixed(2))} mg/mL`,
            startingDoseMg: target,
            startingDoseLabel: target > 0 ? formatMg(target) : '',
            startingSyringeUnits: units,
            reconstituted: false,
            calculationSummary: buildCalculationSummary(opts.vialMg, bacWaterUnits, target || 0),
            reconstitutionSteps: [],
            titration: [],
          }
        : undefined,
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function migrateLegacyVial(raw: Record<string, unknown>, fallbackName = 'Peptide'): InventoryVial {
  const vialMg = Number(raw.vialMg) || 0
  const bacWaterMl = Number(raw.bacWaterMl) || 0
  const remainingMg = Number(raw.remainingMg ?? vialMg) || 0
  const createdAt =
    typeof raw.createdAt === 'string'
      ? raw.createdAt
      : typeof raw.dateAdded === 'string'
        ? raw.dateAdded
        : new Date().toISOString()
  return {
    id: typeof raw.id === 'string' ? raw.id : generateId(),
    peptideId: typeof raw.peptideId === 'string' ? raw.peptideId : slugPeptideId(fallbackName),
    compoundName:
      typeof raw.compoundName === 'string' && raw.compoundName.trim()
        ? raw.compoundName
        : fallbackName,
    vialMg,
    bacWaterMl,
    concentrationMgPerMl:
      Number(raw.concentrationMgPerMl) ||
      (bacWaterMl > 0 ? Number((vialMg / bacWaterMl).toFixed(4)) : 0),
    mixedDate:
      typeof raw.mixedDate === 'string' ? raw.mixedDate : createdAt.slice(0, 10),
    isPowder: false,
    remainingMg,
    notes: typeof raw.notes === 'string' ? raw.notes : undefined,
    createdAt,
  }
}

export function loadInventoryVials(): InventoryVial[] {
  const stored = readJson<unknown>(VIALS_STORAGE_KEY, null)
  if (Array.isArray(stored) && stored.length > 0) {
    return stored.map((row) => migrateLegacyVial((row ?? {}) as Record<string, unknown>))
  }

  const calc = readJson<{ vials?: unknown[] }>('doseCalculator', {})
  if (Array.isArray(calc.vials) && calc.vials.length > 0) {
    const migrated = calc.vials.map((row) =>
      migrateLegacyVial((row ?? {}) as Record<string, unknown>)
    )
    saveInventoryVials(migrated)
    return migrated
  }

  return []
}

export function saveInventoryVials(vials: InventoryVial[]) {
  localStorage.setItem(VIALS_STORAGE_KEY, JSON.stringify(vials))
}

export function upsertInventoryVial(vial: InventoryVial): InventoryVial[] {
  const current = loadInventoryVials()
  const next = [...current.filter((v) => v.id !== vial.id), vial]
  saveInventoryVials(next)
  return next
}

export function removeInventoryVial(id: string): InventoryVial[] {
  const next = loadInventoryVials().filter((v) => v.id !== id)
  saveInventoryVials(next)
  return next
}

export function createInventoryVial(input: {
  peptideId: string
  compoundName: string
  vialMg: number
  bacWaterMl: number
  mixedDate: string
  notes?: string
}): InventoryVial {
  const concentrationMgPerMl =
    input.bacWaterMl > 0 ? Number((input.vialMg / input.bacWaterMl).toFixed(4)) : 0
  const now = new Date().toISOString()
  return {
    id: generateId(),
    peptideId: input.peptideId,
    compoundName: input.compoundName,
    vialMg: input.vialMg,
    bacWaterMl: input.bacWaterMl,
    concentrationMgPerMl,
    mixedDate: input.mixedDate,
    isPowder: false,
    remainingMg: input.vialMg,
    notes: input.notes?.trim() ? input.notes.trim() : undefined,
    createdAt: now,
  }
}

export const VIAL_SIZE_MIGRATION_FLAG = 'migration_vial_sizes_v2'

const SIZE_CORRECTIONS: {
  ids: string[]
  names: string[]
  oldMg: number[]
  newMg: number
  bacMl: number
}[] = [
  {
    ids: ['ghkcu'],
    names: ['ghk-cu', 'ghkcu', 'ghk cu'],
    oldMg: [5, 10, 15],
    newMg: 100,
    bacMl: 3,
  },
  {
    ids: ['tesamorelin'],
    names: ['tesamorelin'],
    oldMg: [5, 10],
    newMg: 20,
    bacMl: 3,
  },
  {
    ids: ['ss31'],
    names: ['ss-31', 'ss31', 'elamipretide', 'ss-31 (elamipretide)'],
    oldMg: [5, 10, 15, 20, 30],
    newMg: 50,
    bacMl: 3,
  },
  {
    ids: ['nad', 'nad+'],
    names: ['nad+', 'nad'],
    oldMg: [5, 10, 15, 30, 50, 100],
    newMg: 1000,
    bacMl: 5,
  },
]

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9+]+/g, '')
}

function findSizeCorrection(
  id: string | undefined,
  name: string | undefined
): (typeof SIZE_CORRECTIONS)[number] | null {
  const idKey = (id ?? '').trim().toLowerCase()
  const nameKey = normalizeName(name ?? '')
  return (
    SIZE_CORRECTIONS.find(
      (row) =>
        row.ids.includes(idKey) ||
        row.names.some((n) => normalizeName(n) === nameKey)
    ) ?? null
  )
}

function scaleRemaining(oldMg: number, newMg: number, remaining: number): number {
  if (oldMg <= 0) return newMg
  if (remaining >= oldMg * 0.99) return newMg
  return Number(((remaining / oldMg) * newMg).toFixed(2))
}

function correctInventoryVial(vial: InventoryVial): InventoryVial {
  const fix = findSizeCorrection(vial.peptideId, vial.compoundName)
  if (!fix || !fix.oldMg.includes(vial.vialMg)) return vial
  const remainingMg = scaleRemaining(vial.vialMg, fix.newMg, vial.remainingMg)
  const concentrationMgPerMl =
    fix.bacMl > 0 ? Number((fix.newMg / fix.bacMl).toFixed(4)) : 0
  return {
    ...vial,
    vialMg: fix.newMg,
    bacWaterMl: fix.bacMl,
    concentrationMgPerMl,
    remainingMg,
  }
}

export function migratePeptideVialSizes(peptides: Peptide[]): Peptide[] {
  return peptides.map((peptide) => {
    const proto = peptide.protocol
    if (!proto) return peptide
    const fix = findSizeCorrection(peptide.id, peptide.name)
    if (!fix || !fix.oldMg.includes(proto.vialMg)) return peptide
    const concentrationMgPerMl = fix.bacMl > 0 ? fix.newMg / fix.bacMl : proto.concentrationMgPerMl
    const bacWaterUnits: BacWaterUnits =
      fix.bacMl >= 5 ? 500 : fix.bacMl >= 3 ? 300 : fix.bacMl >= 2 ? 200 : 100
    return {
      ...peptide,
      vialSize: `${fix.newMg}mg`,
      protocol: {
        ...proto,
        vialMg: fix.newMg,
        bacWaterMl: fix.bacMl,
        bacWaterUnits,
        concentrationMgPerMl,
        concentrationLabel: `${Number(concentrationMgPerMl.toFixed(2))} mg/mL`,
      },
    }
  })
}

export function runVialSizeMigrationV2(state?: TrackerState | null): TrackerState | null {
  if (typeof localStorage === 'undefined') return state ?? null
  if (localStorage.getItem(VIAL_SIZE_MIGRATION_FLAG) === 'true') {
    return state ? { ...state, peptides: migratePeptideVialSizes(state.peptides) } : null
  }

  try {
    const vials = loadInventoryVials().map(correctInventoryVial)
    saveInventoryVials(vials)

    const calcRaw = localStorage.getItem('doseCalculator')
    if (calcRaw) {
      const calc = JSON.parse(calcRaw) as {
        selectedPeptideId?: string
        vialMg?: number
        bacWaterMl?: number
        vials?: InventoryVial[]
        [key: string]: unknown
      }
      if (Array.isArray(calc.vials)) {
        calc.vials = calc.vials.map((row) =>
          correctInventoryVial(migrateLegacyVial(row as unknown as Record<string, unknown>))
        )
      }
      const selectedFix = findSizeCorrection(calc.selectedPeptideId, undefined)
      if (selectedFix && typeof calc.vialMg === 'number' && selectedFix.oldMg.includes(calc.vialMg)) {
        calc.vialMg = selectedFix.newMg
        calc.bacWaterMl = selectedFix.bacMl
      }
      localStorage.setItem('doseCalculator', JSON.stringify(calc))
    }

    const trackerRaw = localStorage.getItem(STORAGE_KEY)
    if (trackerRaw) {
      const parsed = JSON.parse(trackerRaw) as TrackerState
      if (Array.isArray(parsed.peptides)) {
        parsed.peptides = migratePeptideVialSizes(parsed.peptides)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
      }
    }

    const stackRaw = localStorage.getItem('activeStack')
    if (stackRaw) {
      const stack = JSON.parse(stackRaw) as Peptide[]
      if (Array.isArray(stack)) {
        localStorage.setItem('activeStack', JSON.stringify(migratePeptideVialSizes(stack)))
      }
    }

    localStorage.setItem(VIAL_SIZE_MIGRATION_FLAG, 'true')
  } catch {
    try {
      localStorage.setItem(VIAL_SIZE_MIGRATION_FLAG, 'true')
    } catch {
      /* ignore */
    }
  }

  if (!state) return null
  return { ...state, peptides: migratePeptideVialSizes(state.peptides) }
}
