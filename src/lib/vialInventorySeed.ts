import { CYCLE_START_DATE } from '../constants/reconstitutionTable'
import type { TrackerState } from '../types'
import type { Vial } from '../types/v2'
import {
  loadVials,
  saveVials,
} from '../utils/inventoryStorage'
import { recalculateVialInventory } from '../utils/vialUsage'
import { saveInventoryVials, type InventoryVial } from './vialInventory'
import { isLxrdgatsbyUser } from './protocolSeed'

export const VIAL_SEED_FLAG = 'vialInventorySeeded_lxrdgatsby_v4'

function vial(partial: Vial): Vial {
  const isTest = partial.compoundId === 'test-cyp'
  return {
    ...partial,
    depleted: partial.depleted ?? (!isTest && partial.remainingMg <= 0.001),
  }
}

function activeVial(opts: {
  id: string
  peptideId: string
  name: string
  vialMg: number
  bacMl: number
  conc: number
  opened: string
  remainingMg: number
  notes?: string
  remainingMl?: number | null
  startingMl?: number | null
  drawsUsed?: number
  depleted?: boolean
  replacedAt?: string
  finishedAt?: string
}): Vial {
  return vial({
    id: opts.id,
    compoundName: opts.name,
    compoundId: opts.peptideId,
    vialMg: opts.vialMg,
    bacWaterMl: opts.bacMl,
    concentrationMgPerMl: opts.conc,
    mixedDate: opts.opened,
    isPowder: false,
    remainingMg: opts.remainingMg,
    createdAt: `${opts.opened}T12:00:00.000Z`,
    depleted: opts.depleted ?? opts.remainingMg <= 0.001,
    remainingMl: opts.remainingMl,
    startingMl: opts.startingMl,
    drawsUsed: opts.drawsUsed,
    notes: opts.notes,
    replacedAt: opts.replacedAt,
    finishedAt: opts.finishedAt,
  })
}

export function buildLxrdgatsbyVials(): Vial[] {
  const opened = CYCLE_START_DATE
  return [
    activeVial({
      id: 'vial-ss31-a',
      peptideId: 'ss31',
      name: 'SS-31 (Elamipretide)',
      vialMg: 50,
      bacMl: 3,
      conc: 16.67,
      opened,
      remainingMg: 0,
      depleted: true,
      replacedAt: '2026-09-13',
      finishedAt: '2026-09-13',
      notes: 'Vial A · replaced Sept 13. Archived.',
    }),
    activeVial({
      id: 'vial-ss31-b',
      peptideId: 'ss31',
      name: 'SS-31 (Elamipretide)',
      vialMg: 50,
      bacMl: 3,
      conc: 16.67,
      opened: '2026-09-13',
      remainingMg: 50,
      notes: 'Vial B · mixed Sept 13 · 50 mg / 3 mL',
    }),
    activeVial({
      id: 'vial-aod-a',
      peptideId: 'aod9604',
      name: 'AOD-9604',
      vialMg: 10,
      bacMl: 3,
      conc: 3.33,
      opened,
      remainingMg: 0,
      depleted: true,
      replacedAt: '2026-09-13',
      finishedAt: '2026-09-13',
      notes: 'Vial A · replaced Sept 13. Archived. Old 10 mg / 3 mL recon.',
    }),
    activeVial({
      id: 'vial-aod-b',
      peptideId: 'aod9604',
      name: 'AOD-9604',
      vialMg: 10,
      bacMl: 2,
      conc: 5,
      opened: '2026-09-13',
      remainingMg: 10,
      notes: 'Vial B · 10 mg / 2 mL = 5 mg/mL · 1.0 mg = 20 u',
    }),
    activeVial({
      id: 'vial-amino1mq-a',
      peptideId: 'amino1mq',
      name: '5-Amino-1MQ',
      vialMg: 50,
      bacMl: 3,
      conc: 16.67,
      opened: '2026-09-14',
      remainingMg: 50,
      notes: 'Mixed Sept 14. First dose Tue Sept 15.',
    }),
    activeVial({
      id: 'vial-reta-a',
      peptideId: 'retatrutide',
      name: 'Retatrutide',
      vialMg: 10,
      bacMl: 2,
      conc: 5,
      opened,
      remainingMg: 10,
      notes: 'Vial A · 10 mg / 2 mL · 2.5 mg = 50 u weekly',
    }),
    activeVial({
      id: 'vial-tesa-a',
      peptideId: 'tesamorelin',
      name: 'Tesamorelin',
      vialMg: 20,
      bacMl: 3,
      conc: 6.67,
      opened,
      remainingMg: 20,
      notes: 'Vial A · 20 mg / 3 mL',
    }),
    activeVial({
      id: 'vial-bpc-a',
      peptideId: 'bpc157',
      name: 'BPC-157',
      vialMg: 10,
      bacMl: 2,
      conc: 5,
      opened,
      remainingMg: 10,
      notes: 'Vial A · 10 mg / 2 mL · 500 mcg = 10 u',
    }),
    activeVial({
      id: 'vial-ghk-a',
      peptideId: 'ghkcu',
      name: 'GHK-Cu',
      vialMg: 100,
      bacMl: 3,
      conc: 33.3,
      opened,
      remainingMg: 100,
      notes: 'Vial A · 100 mg / 3 mL · 1 mg = 3 u',
    }),
    activeVial({
      id: 'vial-klow-a',
      peptideId: 'klow',
      name: 'KLOW',
      vialMg: 10,
      bacMl: 3,
      conc: 3.33,
      opened,
      remainingMg: 10,
      notes: 'Vial A · 10 mg / 3 mL · 0.5 mg = 15 u',
    }),
    activeVial({
      id: 'vial-mots-a',
      peptideId: 'motsc',
      name: 'MOTS-c',
      vialMg: 10,
      bacMl: 3,
      conc: 3.33,
      opened,
      remainingMg: 10,
      notes: 'Vial A · 10 mg / 3 mL · 0.5 mg M/W/F',
    }),
    activeVial({
      id: 'vial-nad-a',
      peptideId: 'nad',
      name: 'NAD+',
      vialMg: 1000,
      bacMl: 5,
      conc: 200,
      opened,
      remainingMg: 1000,
      notes: 'Vial A · 1000 mg / 5 mL · 50 mg M/W/F',
    }),
    activeVial({
      id: 'vial-test-a',
      peptideId: 'test-cyp',
      name: 'Test Cyp',
      vialMg: 0,
      bacMl: 0,
      conc: 0,
      opened,
      remainingMg: 0,
      depleted: false,
      drawsUsed: 0,
      startingMl: null,
      remainingMl: null,
      notes:
        'Draws counted from checked Sunday doses only. Set starting mL to track remaining volume.',
    }),
  ]
}

function looksLikeLxrdgatsbyStack(state: TrackerState): boolean {
  const ids = new Set(state.peptides.map((p) => p.id))
  return ids.has('test-cyp') && ids.has('klow') && ids.has('tesamorelin')
}

function toCalculatorVial(v: Vial): InventoryVial {
  return {
    id: v.id,
    peptideId: v.compoundId || v.id,
    compoundName: v.compoundName,
    vialMg: v.vialMg,
    bacWaterMl: v.bacWaterMl,
    concentrationMgPerMl: v.concentrationMgPerMl,
    mixedDate: (v.mixedDate || '').slice(0, 10),
    isPowder: false,
    remainingMg: v.remainingMg,
    notes: v.notes,
    createdAt: v.createdAt,
  }
}

function persistLocalVials(vials: Vial[]) {
  saveVials(vials)
  saveInventoryVials(vials.map(toCalculatorVial))
  try {
    localStorage.setItem(VIAL_SEED_FLAG, 'true')
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent('pt-data-updated', { detail: 'vials' }))
  } catch {
    /* ignore */
  }
}

function mergeVialTemplates(existing: Vial[], templates: Vial[]): Vial[] {
  const byId = new Map(existing.map((v) => [v.id, v]))
  const out: Vial[] = []
  for (const t of templates) {
    const prev = byId.get(t.id)
    if (prev) {
      out.push({
        ...t,
        mixedDate: prev.mixedDate || t.mixedDate,
        bacWaterMl: prev.bacWaterMl || t.bacWaterMl,
        vialMg: prev.vialMg || t.vialMg,
        concentrationMgPerMl: prev.concentrationMgPerMl || t.concentrationMgPerMl,
        compoundName: prev.compoundName || t.compoundName,
        compoundId: prev.compoundId || t.compoundId,
        notes: t.notes,
        startingMl: prev.startingMl ?? t.startingMl,
        replacedAt: t.replacedAt ?? prev.replacedAt,
        finishedAt: t.finishedAt ?? prev.finishedAt,
      })
      byId.delete(t.id)
    } else {
      out.push(t)
    }
  }
  for (const extra of byId.values()) out.push(extra)
  return out
}

export function applyLxrdgatsbyVialInventorySeed(
  current: TrackerState,
  username?: string | null,
  email?: string | null,
): TrackerState | null {
  if (typeof localStorage === 'undefined') return null
  const allowed =
    isLxrdgatsbyUser(username, email) || looksLikeLxrdgatsbyStack(current)
  if (!allowed) return null

  const fromState = current.vialInventory ?? []
  const fromStorage = loadVials()
  const existing = fromState.length > 0 ? fromState : fromStorage
  const merged = mergeVialTemplates(existing, buildLxrdgatsbyVials())
  const vials = recalculateVialInventory({
    vials: merged,
    logs: current.injectionLogs ?? [],
    peptides: current.peptides,
    startDate: current.profile.startDate || CYCLE_START_DATE,
  })
  persistLocalVials(vials)
  return { ...current, vialInventory: vials }
}
