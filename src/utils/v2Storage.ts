/**
 * Compatibility layer — re-exports inventory storage + remaining v2 keys.
 * Prefer inventoryStorage for vials / dose logs.
 */

import { generateId } from '../lib/generateId'
import type {
  AdaptivePlanState,
  Blend,
  CheckIn,
  DoseLog,
  PeptideCompound,
  Vial,
} from '../types/v2'
import {
  addDoseLog as addDoseLogCore,
  addVial as addVialCore,
  deductFromVial,
  getActiveVials,
  loadDoseLogs,
  loadVials,
  markVialFinished,
  saveDoseLogs,
  saveVials,
  updateVial,
  type NewDoseLogInput,
  type NewVialInput,
} from './inventoryStorage'

export {
  loadVials,
  saveVials,
  updateVial,
  deductFromVial,
  loadDoseLogs,
  saveDoseLogs,
}

export const activeVials = getActiveVials
export const markVialDepleted = markVialFinished

export function addVial(
  input: NewVialInput & Partial<Vial> & { compoundId?: string }
): Vial {
  return addVialCore({
    compoundName: input.compoundName,
    vialMg: input.vialMg,
    bacWaterMl: input.bacWaterMl ?? 0,
    mixedDate: input.mixedDate,
    isPowder: input.isPowder,
    notes: input.notes,
    remainingMg: input.remainingMg,
  })
}

export function addDoseLog(
  input: NewDoseLogInput & Partial<DoseLog>
): DoseLog {
  return addDoseLogCore({
    date: input.date,
    compoundName: input.compoundName,
    doseMg: input.doseMg,
    units: input.units,
    vialId: input.vialId,
    injectionSite: input.injectionSite,
    notes: input.notes,
    taken: input.taken,
    compoundId: input.compoundId,
  })
}

export function doseLogsSince(days: number): DoseLog[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return loadDoseLogs().filter((l) => {
    const t = new Date(l.date).getTime()
    return !Number.isNaN(t) && t >= cutoff
  })
}

// ── Other v2 keys (blends, check-ins, compounds, adaptive plan) ────

const KEYS = {
  blends: 'pt-v2-blends',
  checkIns: 'pt-v2-check-ins',
  compounds: 'pt-v2-compounds',
  adaptivePlan: 'pt-v2-adaptive-plan',
} as const

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadCompounds(): PeptideCompound[] {
  return readJson(KEYS.compounds, [])
}

export function saveCompounds(list: PeptideCompound[]): void {
  writeJson(KEYS.compounds, list)
}

export function loadBlends(): Blend[] {
  return readJson(KEYS.blends, [])
}

export function saveBlends(list: Blend[]): void {
  writeJson(KEYS.blends, list)
}

export function loadV2CheckIns(): CheckIn[] {
  return readJson(KEYS.checkIns, [])
}

export function saveV2CheckIns(list: CheckIn[]): void {
  writeJson(KEYS.checkIns, list)
}

export function addV2CheckIn(
  input: Omit<CheckIn, 'id'> & { id?: string }
): CheckIn {
  const row: CheckIn = { ...input, id: input.id ?? generateId() }
  const list = loadV2CheckIns()
  list.push(row)
  list.sort((a, b) => a.date.localeCompare(b.date))
  saveV2CheckIns(list)
  return row
}

export function loadAdaptivePlan(): AdaptivePlanState | null {
  return readJson(KEYS.adaptivePlan, null)
}

export function saveAdaptivePlan(state: AdaptivePlanState): void {
  writeJson(KEYS.adaptivePlan, state)
}
