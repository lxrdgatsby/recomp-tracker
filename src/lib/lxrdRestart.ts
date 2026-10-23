import { KLOW_LXRD_NOTE } from '../constants/reconstitutionTable'
import type { InjectionLog, Peptide, TitrationWeek } from '../types'
import { removedPeptideIdSet } from './removedCompounds'

/** Last day on the pre-pause stack. Oct 4–24 is the pause. */
export const LAST_OLD_STACK_DAY = '2026-10-03'
export const PAUSE_FROM = '2026-10-04'
export const PAUSE_UNTIL = '2026-10-24'
export const RESTART_DATE = '2026-10-25'
/** KLOW’s new 80 mg vial. The Oct 25 stack does not move. */
export const KLOW_80_START = '2026-10-26'
export const AMINO_LOW_UNTIL = '2026-10-27'
export const AMINO_FULL_FROM = '2026-10-28'
export const NAD_VIAL_MG = 1000
export const NAD_DOSE_MG = 50
export const PROTOCOL_NOTE =
  'Paused ~3 weeks. Restarted Oct 25, 2026. TRT resumes December.'

const STOPPED = new Set(['test-cyp', 'retatrutide', 'bpc157', 'ss31', 'ghkcu', 'nad'])

/** Oct 25 vials, plus KLOW from Oct 26. NAD+ is off. */
export const SUNDAY_STACK_IDS = [
  'reta-cagri',
  'tesamorelin',
  'amino1mq',
  'motsc',
  'aod9604',
  'dsip',
  'klow',
] as const

/** These Mixed vials stay in inventory. KLOW opens Oct 26; the rest open Oct 25. */
export const SUNDAY_VIAL_IDS = [
  'vial-reta-cagri',
  'vial-tesa-b',
  'vial-amino1mq-b',
  'vial-mots-b',
  'vial-aod-c',
  'vial-dsip-a',
  'vial-klow-b',
] as const

export const SUNDAY_STACK_NOTE =
  'Sunday Oct 25, 2026 stack: Reta + Cagrilintide 1.5 mg (45 units) weekly, Tesamorelin 15 units (1.0 mg) nightly, 5-Amino-1MQ 15 units daily, MOTS-c about 4 units Mon/Wed/Fri, AOD-9604 20 units morning on the Oct 25 vial (10 mg / 2 mL), DSIP 2 units (100 mcg) nightly before bed. NAD+ is off until a new vial is opened. KLOW starts Oct 26 on a new 80 mg / 3 mL vial at 1 mg ≈ 4 units daily. The old 10 mg KLOW vial stays archived.'

const PAUSE = { from: PAUSE_FROM, until: PAUSE_UNTIL }

function restartTier(
  doseMg: number,
  syringeUnits: number,
  notes: string,
  from = RESTART_DATE,
  until?: string
): TitrationWeek {
  return {
    weeks: 'restart',
    startDate: from,
    endDate: until,
    doseMg,
    doseLabel: `${syringeUnits} units`,
    syringeUnits,
    notes,
  }
}

function closeOpenDatedTiers(tiers: TitrationWeek[]): TitrationWeek[] {
  return tiers.map((tier) =>
    tier.startDate && !tier.endDate ? { ...tier, endDate: LAST_OLD_STACK_DAY } : tier
  )
}

/** Date windows for the Oct 25 restart. Week tiers before that stay as they were. */
export function stampRestartPeptide(peptide: Peptide): Peptide {
  if (STOPPED.has(peptide.id)) {
    return { ...peptide, endsOn: LAST_OLD_STACK_DAY, schedulePause: undefined }
  }

  const protocol = peptide.protocol
  if (!protocol) return { ...peptide, schedulePause: PAUSE }

  const titration = closeOpenDatedTiers(protocol.titration)
  if (peptide.id === 'reta-cagri') {
    return {
      ...peptide,
      startsOn: RESTART_DATE,
      schedulePause: PAUSE,
      timing: 'Sunday evening',
      vialSize: '10mg',
      notes:
        '10 mg Reta + 10 mg Cagrilintide / 3 mL BAC. Dose the Reta portion (≈ 3.33 mg/mL). Start 1.5 mg weekly ≈ 45 units and hold 2 weeks (through Nov 7, 2026). Do not auto-step. Later, if tolerated: 2.5 mg ≈ 75 units, 4 mg ≈ 120 units.',
      protocol: {
        ...protocol,
        vialMg: 10,
        bacWaterUnits: 300,
        bacWaterMl: 3,
        concentrationMgPerMl: 3.33,
        concentrationLabel: '3.33 mg/mL',
        startingDoseMg: 1.5,
        startingSyringeUnits: 45,
        calculationSummary: '10 mg Reta / 3 mL ≈ 3.33 mg/mL → 1.5 mg ≈ 45 units',
        titration: [
          restartTier(
            1.5,
            45,
            '1.5 mg Reta-equivalent ≈ 45 units weekly. Hold through Nov 7, 2026 (first 2 weeks). Do not auto-step. Later if tolerated: 2.5 mg ≈ 75 units, 4 mg ≈ 120 units.'
          ),
        ],
      },
    }
  } else if (peptide.id === 'tesamorelin') {
    titration.push(
      restartTier(
        1,
        15,
        '1.0 mg = 15 units nightly. Optional later step 1.4 mg (21 units). Not auto-advanced.'
      )
    )
  } else if (peptide.id === 'aod9604') {
    titration.push(
      restartTier(
        1,
        20,
        '1.0 mg = 20 units, morning fasted, on the Oct 25 vial (10 mg / 2 mL). Same recon as the Sept 13 vial.'
      )
    )
  } else if (peptide.id === 'amino1mq') {
    titration.push(
      restartTier(
        2.5,
        15,
        '2.5 mg = 15 units daily, morning fasted, on the Oct 25 vial (50 mg / 3 mL).'
      )
    )
  } else if (peptide.id === 'klow') {
    titration.push(
      restartTier(
        1,
        4,
        '1 mg ≈ 4 units daily on the Oct 26 vial (80 mg / 3 mL). Research-use tracking only.',
        KLOW_80_START
      )
    )
    return {
      ...peptide,
      dose: '1mg',
      vialSize: '80mg',
      endsOn: undefined,
      schedulePause: { from: PAUSE_FROM, until: RESTART_DATE },
      notes: KLOW_LXRD_NOTE,
      protocol: {
        ...protocol,
        vialMg: 80,
        bacWaterUnits: 300,
        bacWaterMl: 3,
        concentrationMgPerMl: 80 / 3,
        concentrationLabel: '26.67 mg/mL',
        startingDoseMg: 1,
        startingDoseLabel: '4 units on U-100',
        startingSyringeUnits: 4,
        reconstituted: true,
        calculationSummary: '80 mg / 3 mL ≈ 26.67 mg/mL → 1 mg ≈ 4 units',
        reconstitutionSteps: [
          'Product 80mg reconstituted with 3mL (300 units BAC) on U-100.',
          KLOW_LXRD_NOTE,
        ],
        titration,
      },
    }
  } else if (peptide.id === 'motsc') {
    titration.push(
      restartTier(
        0.5,
        4,
        '0.5 mg ≈ 4 units Mon/Wed/Fri on the Oct 25 vial (40 mg / 3 mL). Not the old 15-unit draw.'
      )
    )
    return {
      ...peptide,
      vialSize: '40mg',
      schedulePause: PAUSE,
      notes:
        'From Oct 25: 0.5 mg ≈ 4 units on 40 mg / 3 mL, Mon/Wed/Fri. Do not use the old 15-unit draw.',
      protocol: {
        ...protocol,
        vialMg: 40,
        bacWaterUnits: 300,
        bacWaterMl: 3,
        concentrationMgPerMl: 13.333,
        concentrationLabel: '13.33 mg/mL',
        startingDoseMg: 0.5,
        startingSyringeUnits: 4,
        calculationSummary: '40 mg / 3 mL ≈ 13.33 mg/mL → 0.5 mg ≈ 4 units',
        titration,
      },
    }
  } else {
    return peptide
  }

  return {
    ...peptide,
    schedulePause: PAUSE,
    protocol: { ...protocol, titration },
  }
}

/** One NAD+ total per day. Dose logs sum. A Done mark with no dose counts as 50 mg, and only if that day has no dose log. */
export function collapseNadLogs(logs: InjectionLog[]): InjectionLog[] {
  const nadDays = new Map<string, InjectionLog[]>()
  const rest: InjectionLog[] = []
  for (const log of logs) {
    const named = `${log.peptideName ?? ''} ${log.peptideId ?? ''}`.toLowerCase()
    if (!named.includes('nad')) {
      rest.push(log)
      continue
    }
    const day = (log.date || '').slice(0, 10)
    if (!day) continue
    const rows = nadDays.get(day) ?? []
    rows.push(log)
    nadDays.set(day, rows)
  }
  for (const [day, rows] of nadDays) {
    const dosed = rows.filter((log) => log.doseMg != null && log.doseMg > 0)
    const doseMg = dosed.length
      ? dosed.reduce((sum, log) => sum + (log.doseMg ?? 0), 0)
      : NAD_DOSE_MG
    const base = dosed[0] ?? rows[0]
    rest.push({
      ...base,
      date: day,
      peptideId: base.peptideId || 'nad',
      doseMg,
    })
  }
  return rest
}

export function nadRemainingFromLogs(logs: InjectionLog[]): {
  remainingMg: number
  doneCount: number
} {
  const counted = collapseNadLogs(logs).filter((log) => {
    const named = `${log.peptideName ?? ''} ${log.peptideId ?? ''}`.toLowerCase()
    if (!named.includes('nad')) return false
    const day = (log.date || '').slice(0, 10)
    return day >= '2026-08-23' && day <= PAUSE_UNTIL
  })
  let doneMg = 0
  for (const log of counted) doneMg += log.doseMg ?? NAD_DOSE_MG
  return {
    remainingMg: Math.max(0, Math.round((NAD_VIAL_MG - doneMg) * 1000) / 1000),
    doneCount: counted.length,
  }
}

/** Last Mon/Wed/Fri on or after Oct 25 that a 50 mg dose still fits. */
export function nadActiveUntil(remainingMg: number): string | undefined {
  const doses = Math.floor(remainingMg / NAD_DOSE_MG + 1e-9)
  if (doses <= 0) return undefined
  let left = doses
  const cursor = new Date(2026, 9, 25)
  let last = RESTART_DATE
  for (let i = 0; i < 400 && left > 0; i++) {
    const dow = cursor.getDay()
    if (dow === 1 || dow === 3 || dow === 5) {
      const y = cursor.getFullYear()
      const m = String(cursor.getMonth() + 1).padStart(2, '0')
      const d = String(cursor.getDate()).padStart(2, '0')
      last = `${y}-${m}-${d}`
      left -= 1
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return last
}

/** Stop NAD+ when the existing vial cannot cover another 50 mg. History before the pause stays. */
export function withNadHorizon<
  T extends {
    peptides: Peptide[]
    injectionLogs: InjectionLog[]
    removedPeptideIds?: string[]
  },
>(state: T): T {
  const nad = state.peptides.find((peptide) => peptide.id === 'nad')
  if (!nad?.schedulePause) return state
  if (removedPeptideIdSet(state.removedPeptideIds).has('nad')) return state
  const { remainingMg } = nadRemainingFromLogs(state.injectionLogs)
  const until = nadActiveUntil(remainingMg)
  const endsOn = until ?? LAST_OLD_STACK_DAY
  const tierEnd = until ?? LAST_OLD_STACK_DAY
  const tier = nad.protocol?.titration.find((entry) => entry.startDate === RESTART_DATE)
  if (nad.endsOn === endsOn && tier?.endDate === tierEnd) return state

  return {
    ...state,
    peptides: state.peptides.map((peptide) => {
      if (peptide.id !== 'nad' || !peptide.protocol) return peptide
      return {
        ...peptide,
        endsOn,
        notes: `${remainingMg} mg left on the existing vial. 50 mg (25 units) Mon/Wed/Fri until it is gone.`,
        protocol: {
          ...peptide.protocol,
          titration: peptide.protocol.titration.map((entry) =>
            entry.startDate === RESTART_DATE ? { ...entry, endDate: tierEnd } : entry
          ),
        },
      }
    }),
  }
}
