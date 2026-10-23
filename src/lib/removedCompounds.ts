import type { Peptide } from '../types'
import { readLocal, writeLocal } from './protocolStorageScope'

const REMOVED_VIALS_KEY = 'removedVialIds'
const REMOVED_PEPTIDES_KEY = 'removedPeptideIds'

function readIds(key: string): string[] {
  try {
    const raw = readLocal(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)
  } catch {
    return []
  }
}

function writeIds(key: string, ids: string[]): string[] {
  const next = [...new Set(ids)]
  writeLocal(key, JSON.stringify(next))
  return next
}

export function yesterdayIso(today = new Date()): string {
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  day.setDate(day.getDate() - 1)
  const y = day.getFullYear()
  const m = String(day.getMonth() + 1).padStart(2, '0')
  const d = String(day.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function loadRemovedVialIds(): string[] {
  return readIds(REMOVED_VIALS_KEY)
}

export function loadRemovedPeptideIds(): string[] {
  return readIds(REMOVED_PEPTIDES_KEY)
}

export function rememberRemovedVial(id: string): string[] {
  return writeIds(REMOVED_VIALS_KEY, [...loadRemovedVialIds(), id])
}

export function rememberRemovedPeptide(id: string): string[] {
  return writeIds(REMOVED_PEPTIDES_KEY, [...loadRemovedPeptideIds(), id])
}

export function forgetRemovedIds(
  which: 'vials' | 'peptides',
  ids: readonly string[]
): string[] {
  const key = which === 'vials' ? REMOVED_VIALS_KEY : REMOVED_PEPTIDES_KEY
  const drop = new Set<string>(ids)
  return writeIds(
    key,
    readIds(key).filter((id) => !drop.has(id))
  )
}

export function removedVialIdSet(fromState?: string[]): Set<string> {
  return new Set([...(fromState ?? []), ...loadRemovedVialIds()])
}

export function removedPeptideIdSet(fromState?: string[]): Set<string> {
  return new Set([...(fromState ?? []), ...loadRemovedPeptideIds()])
}

export function withoutRemovedVials<T extends { id: string }>(
  vials: T[],
  fromState?: string[]
): T[] {
  const removed = removedVialIdSet(fromState)
  if (removed.size === 0) return vials
  return vials.filter((vial) => !removed.has(vial.id))
}

/** Pull a compound off the active stack and today's schedule. Past days stay. */
export function endPeptideNow(peptide: Peptide, day = yesterdayIso()): Peptide {
  const ends = peptide.endsOn?.slice(0, 10)
  if (ends && ends <= day) return peptide
  return { ...peptide, endsOn: day }
}

export function mergeRemovedIds(fromState: string[] | undefined, fromDisk: string[]): string[] {
  return [...new Set([...(fromState ?? []), ...fromDisk])]
}
