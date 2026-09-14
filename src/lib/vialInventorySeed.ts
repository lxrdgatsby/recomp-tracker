import { CYCLE_START_DATE } from '../constants/reconstitutionTable'
import type { TrackerState } from '../types'
import type { Vial } from '../types/v2'
import {
  loadVials,
  saveVials,
} from '../utils/inventoryStorage'
import { isLxrdgatsbyUser } from './protocolSeed'

export const VIAL_SEED_FLAG = 'vialInventorySeeded_lxrdgatsby_v1'
export const VIAL_LEDGER_KEY = 'pt-v2-vial-ledger'
/** Remaining already includes scheduled use through this date. */
export const VIAL_SEED_THROUGH = '2026-09-14'

type Ledger = Record<string, { vialId: string; doseMg: number; doseMl?: number }>

function ledgerKey(date: string, peptideId: string): string {
  return `${date}:${peptideId}`
}

export function loadVialLedger(): Ledger {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(VIAL_LEDGER_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Ledger
  } catch {
    return {}
  }
}

export function saveVialLedger(ledger: Ledger): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(VIAL_LEDGER_KEY, JSON.stringify(ledger))
}

function vial(partial: Vial): Vial {
  const isTest = partial.compoundId === 'test-cyp'
  return {
    ...partial,
    depleted: partial.depleted ?? (!isTest && partial.remainingMg <= 0.001),
  }
}

function emptyVial(opts: {
  id: string
  peptideId: string
  name: string
  vialMg: number
  bacMl: number
  conc: number
  opened: string
  emptyDate: string
  notes?: string
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
    remainingMg: 0,
    createdAt: `${opts.opened}T12:00:00.000Z`,
    depleted: true,
    finishedAt: opts.emptyDate,
    notes: opts.notes,
  })
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
  })
}

export function buildLxrdgatsbyVials(): Vial[] {
  const opened = CYCLE_START_DATE
  return [
    emptyVial({
      id: 'vial-ss31-a',
      peptideId: 'ss31',
      name: 'SS-31 (Elamipretide)',
      vialMg: 50,
      bacMl: 3,
      conc: 16.67,
      opened,
      emptyDate: '2026-09-13',
      notes: 'Vial A · ran out Sept 13, 2026',
    }),
    activeVial({
      id: 'vial-ss31-b',
      peptideId: 'ss31',
      name: 'SS-31 (Elamipretide)',
      vialMg: 50,
      bacMl: 3,
      conc: 16.67,
      opened: '2026-09-13',
      remainingMg: 45,
      notes: 'Vial B · mixed Sept 13. Sept 13 + Sept 14 already drawn (5 mg).',
    }),
    emptyVial({
      id: 'vial-aod-a',
      peptideId: 'aod9604',
      name: 'AOD-9604',
      vialMg: 10,
      bacMl: 3,
      conc: 3.33,
      opened,
      emptyDate: '2026-09-13',
      notes: 'Vial A · 10 mg / 3 mL · ran out Sept 13, 2026',
    }),
    activeVial({
      id: 'vial-aod-b',
      peptideId: 'aod9604',
      name: 'AOD-9604',
      vialMg: 10,
      bacMl: 2,
      conc: 5,
      opened: '2026-09-13',
      remainingMg: 8,
      notes: 'Vial B · 10 mg / 2 mL = 5 mg/mL · 1.0 mg = 20 u. Sept 13 + Sept 14 already drawn.',
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
      notes: 'Mixed Sept 14. First dose Tue Sept 15. Do not decrement today.',
    }),
    emptyVial({
      id: 'vial-reta-a',
      peptideId: 'retatrutide',
      name: 'Retatrutide',
      vialMg: 10,
      bacMl: 2,
      conc: 5,
      opened,
      emptyDate: '2026-09-13',
      notes: 'Vial A · 2.5 mg × 4 Sundays (Aug 23, 30, Sept 6, 13) = 10 mg. Add a replacement vial.',
    }),
    activeVial({
      id: 'vial-tesa-a',
      peptideId: 'tesamorelin',
      name: 'Tesamorelin',
      vialMg: 20,
      bacMl: 3,
      conc: 6.67,
      opened,
      remainingMg: 0.5,
      notes: 'Week 1 0.5 mg × 7 + Aug 30–Sept 14 1.0 mg × 16 = 19.5 mg used. Almost empty.',
    }),
    emptyVial({
      id: 'vial-bpc-a',
      peptideId: 'bpc157',
      name: 'BPC-157',
      vialMg: 10,
      bacMl: 2,
      conc: 5,
      opened,
      emptyDate: '2026-09-11',
      notes: 'Vial A · 0.5 mg daily emptied after 20 days. Add a replacement vial.',
    }),
    activeVial({
      id: 'vial-ghk-a',
      peptideId: 'ghkcu',
      name: 'GHK-Cu',
      vialMg: 100,
      bacMl: 3,
      conc: 33.3,
      opened,
      remainingMg: 77,
      notes: '1 mg daily × 23 days = 23 mg used.',
    }),
    emptyVial({
      id: 'vial-klow-a',
      peptideId: 'klow',
      name: 'KLOW',
      vialMg: 10,
      bacMl: 3,
      conc: 3.33,
      opened,
      emptyDate: '2026-09-11',
      notes: 'Vial A · 0.5 mg daily emptied after 20 days. Add a replacement vial.',
    }),
    activeVial({
      id: 'vial-mots-a',
      peptideId: 'motsc',
      name: 'MOTS-c',
      vialMg: 10,
      bacMl: 3,
      conc: 3.33,
      opened,
      remainingMg: 5.5,
      notes: '0.5 mg M/W/F × 9 doses through Sept 14 (no MOTS Sept 14) = 4.5 mg used.',
    }),
    activeVial({
      id: 'vial-nad-a',
      peptideId: 'nad',
      name: 'NAD+',
      vialMg: 1000,
      bacMl: 5,
      conc: 200,
      opened,
      remainingMg: 550,
      notes: '50 mg M/W/F × 9 doses = 450 mg used.',
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
      drawsUsed: 4,
      startingMl: null,
      remainingMl: null,
      notes:
        '4 draws of 0.75 mL used (Aug 23, 30, Sept 6, 13). Set starting mL to track remaining volume.',
    }),
  ]
}

function eachDate(from: string, to: string): string[] {
  const out: string[] = []
  const [fy, fm, fd] = from.split('-').map(Number)
  const end = to
  const cur = new Date(fy, (fm ?? 1) - 1, fd ?? 1)
  for (let i = 0; i < 120; i++) {
    const y = cur.getFullYear()
    const m = String(cur.getMonth() + 1).padStart(2, '0')
    const d = String(cur.getDate()).padStart(2, '0')
    const iso = `${y}-${m}-${d}`
    if (iso > end) break
    out.push(iso)
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

function isSunday(iso: string): boolean {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1).getDay() === 0
}

function isMwf(iso: string): boolean {
  const [y, m, d] = iso.split('-').map(Number)
  const dow = new Date(y, (m ?? 1) - 1, d ?? 1).getDay()
  return dow === 1 || dow === 3 || dow === 5
}

export function buildLxrdgatsbyVialLedger(): Ledger {
  const ledger: Ledger = {}
  const mark = (date: string, peptideId: string, vialId: string, doseMg: number, doseMl?: number) => {
    ledger[ledgerKey(date, peptideId)] = { vialId, doseMg, doseMl }
  }

  for (const date of eachDate(CYCLE_START_DATE, VIAL_SEED_THROUGH)) {
    if (date <= '2026-09-12') mark(date, 'ss31', 'vial-ss31-a', 2.5)
    if (date === '2026-09-13' || date === '2026-09-14') mark(date, 'ss31', 'vial-ss31-b', 2.5)

    if (date <= '2026-09-12') mark(date, 'aod9604', 'vial-aod-a', date < '2026-08-30' ? 0.5 : 1)
    if (date === '2026-09-13' || date === '2026-09-14') mark(date, 'aod9604', 'vial-aod-b', 1)

    if (date < '2026-08-30') mark(date, 'tesamorelin', 'vial-tesa-a', 0.5)
    else mark(date, 'tesamorelin', 'vial-tesa-a', 1)

    if (date <= '2026-09-11') {
      mark(date, 'bpc157', 'vial-bpc-a', 0.5)
      mark(date, 'klow', 'vial-klow-a', 0.5)
    }

    mark(date, 'ghkcu', 'vial-ghk-a', 1)

    if (isMwf(date) && date !== '2026-09-14') {
      mark(date, 'motsc', 'vial-mots-a', 0.5)
      mark(date, 'nad', 'vial-nad-a', 50)
    }

    if (isSunday(date)) {
      mark(date, 'retatrutide', 'vial-reta-a', 2.5)
      mark(date, 'test-cyp', 'vial-test-a', 0, 0.75)
    }
  }
  return ledger
}

export function applyLxrdgatsbyVialInventorySeed(
  current: TrackerState,
  username?: string | null,
): TrackerState | null {
  if (typeof localStorage === 'undefined') return null
  if (username && !isLxrdgatsbyUser(username)) return null

  if (current.vialInventory && current.vialInventory.length > 0) {
    saveVials(current.vialInventory)
    if (!localStorage.getItem(VIAL_LEDGER_KEY)) {
      saveVialLedger(buildLxrdgatsbyVialLedger())
    }
    try {
      localStorage.setItem(VIAL_SEED_FLAG, 'true')
    } catch {
      /* ignore */
    }
    return null
  }

  const existing = loadVials()
  if (existing.length > 0) {
    try {
      localStorage.setItem(VIAL_SEED_FLAG, 'true')
    } catch {
      /* ignore */
    }
    if (!localStorage.getItem(VIAL_LEDGER_KEY)) {
      saveVialLedger(buildLxrdgatsbyVialLedger())
    }
    return { ...current, vialInventory: existing }
  }

  const vials = buildLxrdgatsbyVials()
  saveVials(vials)
  saveVialLedger(buildLxrdgatsbyVialLedger())
  try {
    localStorage.setItem(VIAL_SEED_FLAG, 'true')
  } catch {
    /* ignore */
  }
  return { ...current, vialInventory: vials }
}
