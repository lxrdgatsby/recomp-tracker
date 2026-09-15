/**
 * Vial inventory + dose log persistence (localStorage).
 * Modular helpers for inventory UI and adherence.
 */

import { generateId } from '../lib/generateId'
import type { DoseLog, Vial } from '../types/v2'
import { calcConcentrationMgPerMl } from './vialMath'

const KEYS = {
  vials: 'pt-v2-vials',
  doseLogs: 'pt-v2-dose-logs',
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

function nowIso(): string {
  return new Date().toISOString()
}

// ── Normalize legacy rows ──────────────────────────────────────────

function normalizeVial(raw: Partial<Vial> & { id?: string }): Vial | null {
  if (!raw || typeof raw !== 'object') return null
  const compoundName = String(raw.compoundName || '').trim()
  if (!compoundName) return null
  const compoundId = raw.compoundId
  const vialMg = Number(raw.vialMg) || 0
  const bacWaterMl = Number(raw.bacWaterMl) || 0
  const isPowder = Boolean(raw.isPowder)
  const concentrationMgPerMl =
    Number(raw.concentrationMgPerMl) ||
    (isPowder ? 0 : calcConcentrationMgPerMl(vialMg, bacWaterMl))
  const remainingMg =
    raw.remainingMg != null ? Number(raw.remainingMg) : vialMg
  const createdAt = raw.createdAt || raw.mixedDate || nowIso()
  return {
    id: raw.id || generateId(),
    compoundName,
    compoundId: raw.compoundId,
    vialMg,
    bacWaterMl,
    concentrationMgPerMl,
    mixedDate: raw.mixedDate || createdAt,
    isPowder,
    remainingMg,
    notes: raw.notes,
    createdAt,
    depleted: raw.depleted || (compoundId !== 'test-cyp' && remainingMg <= 0.001),
    finishedAt: raw.finishedAt,
    replacedAt: raw.replacedAt,
    remainingMl: raw.remainingMl,
    startingMl: raw.startingMl,
    drawsUsed: raw.drawsUsed,
  }
}

function normalizeDoseLog(
  raw: Partial<DoseLog> & { id?: string }
): DoseLog | null {
  if (!raw || typeof raw !== 'object') return null
  const compoundName = String(raw.compoundName || '').trim()
  if (!compoundName) return null
  const date = raw.date || nowIso()
  return {
    id: raw.id || generateId(),
    date,
    compoundName,
    compoundId: raw.compoundId,
    doseMg: Number(raw.doseMg) || 0,
    units: Number(raw.units) || 0,
    vialId: raw.vialId,
    injectionSite: raw.injectionSite,
    notes: raw.notes,
    taken: Boolean(raw.taken),
    createdAt: raw.createdAt || date,
  }
}

// ── Vials ──────────────────────────────────────────────────────────

export function loadVials(): Vial[] {
  const raw = readJson<unknown[]>(KEYS.vials, [])
  if (!Array.isArray(raw)) return []
  const list = raw
    .map((r) => normalizeVial(r as Partial<Vial>))
    .filter((v): v is Vial => v != null)
  // Persist migration once if needed
  if (
    list.length !== raw.length ||
    list.some((_, i) => !(raw[i] as Partial<Vial>)?.createdAt)
  ) {
    writeJson(KEYS.vials, list)
  }
  return list
}

export function saveVials(list: Vial[]): void {
  writeJson(KEYS.vials, list)
}

export type NewVialInput = {
  compoundName: string
  vialMg: number
  bacWaterMl: number
  mixedDate: string
  isPowder: boolean
  notes?: string
  remainingMg?: number
  compoundId?: string
}

export function addVial(input: NewVialInput): Vial {
  const concentrationMgPerMl = input.isPowder
    ? 0
    : calcConcentrationMgPerMl(input.vialMg, input.bacWaterMl)
  const vial: Vial = {
    id: generateId(),
    compoundName: input.compoundName.trim(),
    compoundId: input.compoundId,
    vialMg: input.vialMg,
    bacWaterMl: input.isPowder ? 0 : input.bacWaterMl,
    concentrationMgPerMl,
    mixedDate: input.mixedDate,
    isPowder: input.isPowder,
    remainingMg: input.remainingMg ?? input.vialMg,
    notes: input.notes?.trim() || undefined,
    createdAt: nowIso(),
    depleted: false,
  }
  const list = loadVials()
  list.unshift(vial)
  saveVials(list)
  return vial
}

export function updateVial(id: string, patch: Partial<Vial>): Vial | null {
  const list = loadVials()
  const idx = list.findIndex((v) => v.id === id)
  if (idx < 0) return null
  const next: Vial = { ...list[idx], ...patch, id: list[idx].id }
  if (
    patch.vialMg != null ||
    patch.bacWaterMl != null ||
    patch.isPowder != null
  ) {
    next.concentrationMgPerMl = next.isPowder
      ? 0
      : calcConcentrationMgPerMl(next.vialMg, next.bacWaterMl)
  }
  if (next.remainingMg <= 0.001) {
    next.depleted = true
    next.finishedAt = next.finishedAt || nowIso()
  }
  list[idx] = next
  saveVials(list)
  return next
}

export function markVialFinished(id: string): void {
  updateVial(id, {
    remainingMg: 0,
    depleted: true,
    finishedAt: nowIso(),
  })
}

export function deleteVial(id: string): void {
  saveVials(loadVials().filter((v) => v.id !== id))
}

/** Subtract dose from vial when a taken dose is logged. */
export function deductFromVial(vialId: string, doseMg: number): Vial | null {
  const list = loadVials()
  const idx = list.findIndex((v) => v.id === vialId)
  if (idx < 0) return null
  const remaining = Math.max(0, Math.round((list[idx].remainingMg - doseMg) * 1000) / 1000)
  list[idx] = {
    ...list[idx],
    remainingMg: remaining,
    depleted: remaining <= 0.001,
    finishedAt: remaining <= 0.001 ? nowIso() : list[idx].finishedAt,
  }
  saveVials(list)
  return list[idx]
}

export function getActiveVials(): Vial[] {
  return loadVials().filter(
    (v) => !v.depleted && (v.compoundId === 'test-cyp' || v.remainingMg > 0.001)
  )
}

export function getFinishedVials(): Vial[] {
  return loadVials().filter(
    (v) => v.depleted || (v.compoundId !== 'test-cyp' && v.remainingMg <= 0.001)
  )
}

// ── Dose logs ──────────────────────────────────────────────────────

export function loadDoseLogs(): DoseLog[] {
  const raw = readJson<unknown[]>(KEYS.doseLogs, [])
  if (!Array.isArray(raw)) return []
  return raw
    .map((r) => normalizeDoseLog(r as Partial<DoseLog>))
    .filter((l): l is DoseLog => l != null)
}

export function saveDoseLogs(list: DoseLog[]): void {
  writeJson(KEYS.doseLogs, list)
}

export type NewDoseLogInput = {
  date?: string
  compoundName: string
  doseMg: number
  units: number
  vialId?: string
  injectionSite?: string
  notes?: string
  taken: boolean
  compoundId?: string
}

export function addDoseLog(input: NewDoseLogInput): DoseLog {
  const createdAt = nowIso()
  const log: DoseLog = {
    id: generateId(),
    date: input.date || createdAt,
    compoundName: input.compoundName.trim(),
    compoundId: input.compoundId,
    doseMg: input.doseMg,
    units: input.units,
    vialId: input.vialId,
    injectionSite: input.injectionSite,
    notes: input.notes?.trim() || undefined,
    taken: input.taken,
    createdAt,
  }
  const list = loadDoseLogs()
  list.unshift(log)
  saveDoseLogs(list)

  if (log.taken && log.vialId && log.doseMg > 0) {
    deductFromVial(log.vialId, log.doseMg)
  }

  return log
}

export function getDoseLogsSince(days: number): DoseLog[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return loadDoseLogs().filter((l) => {
    const t = new Date(l.date).getTime()
    return !Number.isNaN(t) && t >= cutoff
  })
}

/** Pure dose-log adherence (taken / total logged). */
export function calcDoseLogAdherence(days: number): {
  pct: number
  taken: number
  total: number
  streak: number
  logs: DoseLog[]
} {
  const logs = getDoseLogsSince(days)
  const taken = logs.filter((l) => l.taken).length
  const total = logs.length
  const pct = total > 0 ? Math.round((taken / total) * 100) : 100

  // Streak: consecutive calendar days with ≥1 taken and 0 missed, ending today
  const byDay = new Map<string, { taken: number; missed: number }>()
  for (const l of loadDoseLogs()) {
    const day = l.date.slice(0, 10)
    const cur = byDay.get(day) || { taken: 0, missed: 0 }
    if (l.taken) cur.taken++
    else cur.missed++
    byDay.set(day, cur)
  }
  let streak = 0
  const d = new Date()
  for (let i = 0; i < 90; i++) {
    const key = d.toISOString().slice(0, 10)
    const cell = byDay.get(key)
    if (!cell) {
      if (i === 0) {
        d.setDate(d.getDate() - 1)
        continue
      }
      break
    }
    if (cell.taken > 0 && cell.missed === 0) {
      streak++
      d.setDate(d.getDate() - 1)
      continue
    }
    if (cell.taken > 0 && cell.missed > 0) {
      streak++ // partial day still counts toward effort streak lightly
      d.setDate(d.getDate() - 1)
      continue
    }
    break
  }

  return { pct, taken, total, streak, logs }
}
