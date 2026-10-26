import { CYCLE_START_DATE, DSIP_NOTE, DSIP_START_DATE } from '../constants/reconstitutionTable'
import type { InjectionLog, Peptide, TrackerState } from '../types'
import type { Vial } from '../types/v2'
import {
  loadVials,
  saveVials,
} from '../utils/inventoryStorage'
import {
  isReplacedVial,
  recalculateVialInventory,
  remainingDosesForVial,
  vialIsClosed,
} from '../utils/vialUsage'
import { saveInventoryVials, type InventoryVial } from './vialInventory'
import { writeLocal } from './protocolStorageScope'
import { isLxrdgatsbyUser } from './protocolSeed'
import { rememberRemovedVial, removedVialIdSet, withoutRemovedVials } from './removedCompounds'
import { KLOW_80_START, SUNDAY_VIAL_IDS } from './lxrdRestart'

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
      remainingMg: 0,
      depleted: true,
      replacedAt: '2026-10-25',
      finishedAt: '2026-10-25',
      notes: 'Vial B · archived Oct 25. Stopped. 50 mg / 3 mL.',
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
      remainingMg: 0,
      depleted: true,
      replacedAt: '2026-10-25',
      finishedAt: '2026-10-25',
      notes: 'Vial B · archived Oct 25. 10 mg / 2 mL = 5 mg/mL · 1.0 mg = 20 u.',
    }),
    activeVial({
      id: 'vial-aod-c',
      peptideId: 'aod9604',
      name: 'AOD-9604',
      vialMg: 10,
      bacMl: 2,
      conc: 5,
      opened: '2026-10-25',
      remainingMg: 10,
      notes: 'Vial C · mixed Oct 25 · 10 mg / 2 mL = 5 mg/mL · 1.0 mg = 20 u · full',
    }),
    activeVial({
      id: 'vial-amino1mq-a',
      peptideId: 'amino1mq',
      name: '5-Amino-1MQ',
      vialMg: 50,
      bacMl: 3,
      conc: 16.67,
      opened: '2026-09-14',
      remainingMg: 0,
      depleted: true,
      replacedAt: '2026-10-25',
      finishedAt: '2026-10-25',
      notes: 'Vial A · replaced Oct 25. Archived.',
    }),
    activeVial({
      id: 'vial-amino1mq-b',
      peptideId: 'amino1mq',
      name: '5-Amino-1MQ',
      vialMg: 50,
      bacMl: 3,
      conc: 16.67,
      opened: '2026-10-25',
      remainingMg: 50,
      notes: 'Vial B · mixed Oct 25 · 50 mg / 3 mL · full',
    }),
    activeVial({
      id: 'vial-reta-a',
      peptideId: 'retatrutide',
      name: 'Retatrutide',
      vialMg: 10,
      bacMl: 2,
      conc: 5,
      opened,
      remainingMg: 0,
      depleted: true,
      replacedAt: '2026-10-25',
      finishedAt: '2026-10-25',
      notes: 'Vial A · replaced Oct 25. Archived.',
    }),
    activeVial({
      id: 'vial-reta-b',
      peptideId: 'retatrutide',
      name: 'Retatrutide',
      vialMg: 10,
      bacMl: 2,
      conc: 5,
      opened: '2026-10-25',
      remainingMg: 0,
      depleted: true,
      replacedAt: '2026-10-25',
      finishedAt: '2026-10-25',
      notes: 'Vial B · archived Oct 25. Plain Retatrutide stopped. 10 mg / 2 mL.',
    }),
    activeVial({
      id: 'vial-reta-cagri',
      peptideId: 'reta-cagri',
      name: 'Reta + Cagrilintide',
      vialMg: 10,
      bacMl: 3,
      conc: 3.33,
      opened: '2026-10-25',
      remainingMg: 10,
      notes:
        'Mixed Oct 25 · 10 mg Reta + 10 mg Cagrilintide / 3 mL · 1.5 mg Reta-equivalent ≈ 45 u · full',
    }),
    activeVial({
      id: 'vial-tesa-a',
      peptideId: 'tesamorelin',
      name: 'Tesamorelin',
      vialMg: 20,
      bacMl: 3,
      conc: 6.67,
      opened,
      remainingMg: 0,
      depleted: true,
      replacedAt: '2026-10-25',
      finishedAt: '2026-10-25',
      notes: 'Vial A · replaced Oct 25. Archived.',
    }),
    activeVial({
      id: 'vial-tesa-b',
      peptideId: 'tesamorelin',
      name: 'Tesamorelin',
      vialMg: 20,
      bacMl: 3,
      conc: 6.67,
      opened: '2026-10-25',
      remainingMg: 20,
      notes: 'Vial B · mixed Oct 25 · 20 mg / 3 mL · 1.0 mg = 15 u · full',
    }),
    activeVial({
      id: 'vial-bpc-a',
      peptideId: 'bpc157',
      name: 'BPC-157',
      vialMg: 10,
      bacMl: 2,
      conc: 5,
      opened,
      remainingMg: 0,
      depleted: true,
      replacedAt: '2026-10-25',
      finishedAt: '2026-10-25',
      notes: 'Vial A · archived Oct 25. BPC-157 stopped. 10 mg / 2 mL.',
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
      remainingMg: 0,
      depleted: true,
      replacedAt: '2026-10-25',
      finishedAt: '2026-10-25',
      notes: 'Vial A · archived Oct 25. KLOW stopped. 10 mg / 3 mL.',
    }),
    activeVial({
      id: 'vial-klow-b',
      peptideId: 'klow',
      name: 'KLOW',
      vialMg: 80,
      bacMl: 3,
      conc: 80 / 3,
      opened: KLOW_80_START,
      remainingMg: 80,
      notes: 'Vial B · mixed Oct 26 · 80 mg / 3 mL · 1 mg ≈ 4 u · full',
    }),
    activeVial({
      id: 'vial-mots-a',
      peptideId: 'motsc',
      name: 'MOTS-c',
      vialMg: 10,
      bacMl: 3,
      conc: 3.33,
      opened,
      remainingMg: 0,
      depleted: true,
      replacedAt: '2026-10-25',
      finishedAt: '2026-10-25',
      notes: 'Vial A · replaced Oct 25. Archived. Old 10 mg / 3 mL recon.',
    }),
    activeVial({
      id: 'vial-mots-b',
      peptideId: 'motsc',
      name: 'MOTS-c',
      vialMg: 40,
      bacMl: 3,
      conc: 13.33,
      opened: '2026-10-25',
      remainingMg: 40,
      notes: 'Vial B · mixed Oct 25 · 40 mg / 3 mL · 0.5 mg ≈ 4 u · full',
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
      id: 'vial-dsip-a',
      peptideId: 'dsip',
      name: 'DSIP',
      vialMg: 10,
      bacMl: 2,
      conc: 5,
      opened: DSIP_START_DATE,
      remainingMg: 10,
      notes: `Mixed Oct 25. 10 mg / 2 mL = 5 mg/mL. 100 mcg = 2 units nightly before bed. ${DSIP_NOTE}`,
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
    writeLocal(VIAL_SEED_FLAG, 'true')
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent('pt-data-updated', { detail: 'vials' }))
  } catch {
    /* ignore */
  }
}

const SUNDAY_VIAL_ID_SET = new Set<string>(SUNDAY_VIAL_IDS)

/** Archived KLOW from the pre-Oct 25 stack. Never merged back by login or + Add. */
export const LXRD_PERMANENT_VIAL_IDS = ['vial-klow-a'] as const

/** Sunday vials stay. Archived template vials stay out. A live vial the user added stays. */
function keepCurrentStackVial(vial: Vial, templateIds: ReadonlySet<string>): boolean {
  if ((LXRD_PERMANENT_VIAL_IDS as readonly string[]).includes(vial.id)) return false
  if (SUNDAY_VIAL_ID_SET.has(vial.id)) return true
  if (templateIds.has(vial.id)) return false
  if (vialIsClosed(vial)) return false
  return true
}

function mergeVialTemplates(
  existing: Vial[],
  templates: Vial[],
  removed: Set<string>
): Vial[] {
  const byId = new Map(
    existing.filter((vial) => !removed.has(vial.id)).map((vial) => [vial.id, vial])
  )
  const out: Vial[] = []
  for (const t of templates) {
    if (removed.has(t.id)) continue
    if (!SUNDAY_VIAL_ID_SET.has(t.id) && vialIsClosed(t)) continue
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

function isAodVial(vial: Vial): boolean {
  const compound = (vial.compoundId || '').trim().toLowerCase()
  const name = vial.compoundName.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  return compound === 'aod9604' || name === 'aod9604'
}

function aodOpenedKey(vial: Vial): string {
  return `${(vial.mixedDate || '').slice(0, 10)} ${vial.createdAt || ''}`
}

function aodDosesLeft(
  vial: Vial,
  peptide: Peptide | undefined,
  startDate: string,
): number {
  if (peptide) return remainingDosesForVial(vial, peptide, startDate)
  if (isReplacedVial(vial) || vial.isPowder || vial.remainingMg <= 0.001) return 0
  return Math.floor(vial.remainingMg)
}

function aodMixedWithStock(vial: Vial): boolean {
  return !vial.isPowder && !isReplacedVial(vial) && !vial.depleted && vial.remainingMg > 0.001
}

/** Prefer the vial that shows 9 doses. A tie keeps the newest mixed vial. */
function selectAodVialToKeep(
  vials: Vial[],
  peptide: Peptide | undefined,
  startDate: string,
): Vial | undefined {
  if (vials.length === 0) return undefined
  const nine = vials.filter((vial) => aodDosesLeft(vial, peptide, startDate) === 9)
  const nineMixed = nine.filter(aodMixedWithStock)
  const mixed = vials.filter(aodMixedWithStock)
  const pool =
    nineMixed.length > 0 ? nineMixed : nine.length > 0 ? nine : mixed.length > 0 ? mixed : vials
  return [...pool].sort((a, b) => aodOpenedKey(b).localeCompare(aodOpenedKey(a)))[0]
}

function liveAodVial(vial: Vial): boolean {
  return isAodVial(vial) && !vialIsClosed(vial)
}

/**
 * Doses logged against a removed AOD vial stay in history.
 * They are left out of the math so they cannot drain the vial that remains.
 * Untagged Oct 25+ doses stay on Vial C while that vial is still in the list.
 */
function aodLogsForShownVials(logs: InjectionLog[], vials: Vial[]): InjectionLog[] {
  const ids = new Set(vials.map((vial) => vial.id))
  const sundayPresent = ids.has('vial-aod-c')
  return logs.filter((log) => {
    if (log.peptideId !== 'aod9604') return true
    if (log.vialId) return ids.has(log.vialId)
    return sundayPresent
  })
}

function pinAodNine(vial: Vial, source: Vial): Vial {
  return {
    ...vial,
    remainingMg: source.remainingMg,
    depleted: false,
    finishedAt: undefined,
  }
}

function collapseExtraAodVials(
  vials: Vial[],
  source: Vial[],
  peptide: Peptide | undefined,
  startDate: string,
  removed: Set<string>,
): Vial[] {
  const postAod = vials.filter(isAodVial)
  const sourceById = new Map(source.filter(isAodVial).map((vial) => [vial.id, vial]))
  const candidates: Vial[] = postAod.map((vial) => sourceById.get(vial.id) ?? vial)
  for (const vial of source) {
    if (!liveAodVial(vial)) continue
    if (candidates.some((row) => row.id === vial.id)) continue
    candidates.push(vial)
  }
  if (candidates.length < 2) return vials
  const keeper = selectAodVialToKeep(candidates, peptide, startDate)
  if (!keeper) return vials
  const sourceKeeper = sourceById.get(keeper.id) ?? keeper
  const keepNine = aodDosesLeft(sourceKeeper, peptide, startDate) === 9

  const dropIds = new Set<string>()
  for (const vial of postAod) {
    if (vial.id !== keeper.id) dropIds.add(vial.id)
  }
  for (const vial of source) {
    if (!isAodVial(vial) || vial.id === keeper.id) continue
    if (vialIsClosed(vial) && !postAod.some((row) => row.id === vial.id)) continue
    dropIds.add(vial.id)
  }
  if (dropIds.size === 0) return vials

  for (const id of dropIds) {
    removed.add(id)
    rememberRemovedVial(id)
  }

  let next = vials.filter((vial) => !dropIds.has(vial.id))
  if (!next.some((vial) => vial.id === keeper.id)) {
    next = [...next, keepNine ? pinAodNine(sourceKeeper, sourceKeeper) : sourceKeeper]
  } else if (keepNine) {
    next = next.map((vial) => (vial.id === keeper.id ? pinAodNine(vial, sourceKeeper) : vial))
  }
  return next
}

export function applyLxrdgatsbyVialInventorySeed(
  current: TrackerState,
  username?: string | null,
  email?: string | null,
): TrackerState | null {
  if (typeof localStorage === 'undefined') return null
  if (!isLxrdgatsbyUser(username, email)) return null

  const removed = new Set([
    ...removedVialIdSet(current.removedVialIds),
    ...LXRD_PERMANENT_VIAL_IDS,
  ])
  const fromState = withoutRemovedVials(current.vialInventory ?? [], [...removed])
  const fromStorage = withoutRemovedVials(loadVials(), [...removed])
  const existing = fromState.length > 0 ? fromState : fromStorage
  const templates = buildLxrdgatsbyVials()
  const templateIds = new Set(templates.map((vial) => vial.id))
  const merged = mergeVialTemplates(existing, templates, removed)
  const startDate = current.profile.startDate || CYCLE_START_DATE
  const kept = recalculateVialInventory({
    vials: merged,
    logs: aodLogsForShownVials(current.injectionLogs ?? [], merged),
    peptides: current.peptides,
    startDate,
  }).filter((vial) => keepCurrentStackVial(vial, templateIds))
  const droppedKlow: string[] = []
  const withoutExtraKlow = kept.filter((vial) => {
    const compound = (vial.compoundId || '').trim().toLowerCase()
    const name = vial.compoundName.trim().toLowerCase()
    const isKlow = compound === 'klow' || name === 'klow'
    if (!isKlow || vial.id === 'vial-klow-b') return true
    droppedKlow.push(vial.id)
    return false
  })
  for (const id of droppedKlow) {
    removed.add(id)
    rememberRemovedVial(id)
  }
  const aodPeptide = current.peptides.find((peptide) => peptide.id === 'aod9604')
  const vials = collapseExtraAodVials(
    withoutExtraKlow,
    existing,
    aodPeptide,
    startDate,
    removed,
  )
  const removedVialIds = [...removed]
  persistLocalVials(vials)
  return { ...current, vialInventory: vials, removedVialIds }
}
