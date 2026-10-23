import type { Peptide, RecompPlan, TrackerState } from '../types'
import type { Vial } from '../types/v2'
import { u100UnitsFromMg } from '../utils/doseMath'

/** Bubblesmama only. Day 1 of the current stack. */
export const BUBBLES_STACK_START = '2026-10-24'
export const BUBBLES_KLOW_VERSION = '2026-10-24-bubbles-klow'
export const BUBBLES_VIAL_ID = 'vial-bubbles-klow'
export const BUBBLES_KLOW_VIAL_MG = 80
export const BUBBLES_KLOW_BAC_ML = 3
export const BUBBLES_KLOW_DOSE_MG = 1

const DAY_BEFORE_START = '2026-10-23'

export const BUBBLES_ASSISTANT_NOTE =
  'Bubblesmama current stack Day 1 is October 24, 2026. KLOW is on the active stack from that date: 80 mg vial + 3 mL BAC ≈ 26.67 mg/mL, mixed and active, opened October 24, 2026, remaining full (80 mg). Starting dose 1 mg daily ≈ 3.75 units on U-100, scheduled as 4 units on the half-unit draw. Do not use lxrdgatsby’s historical 10 mg KLOW math or his off-dates. Do not delete or rewrite historical injection logs. Research-use tracking only.'

export function isBubblesmamaUser(
  username?: string | null,
  email?: string | null
): boolean {
  const values = [username, email]
    .map((value) => (value ?? '').trim().toLowerCase())
    .filter(Boolean)
  return values.some((value) => identity(value) === 'bubblesmama')
}

function identity(value: string): string {
  return value.split('@')[0].replace(/[\s._-]+/g, '')
}

function ymd(value?: string | null): string {
  return (value ?? '').slice(0, 10)
}

function isCurrentOn(peptide: Peptide, day: string): boolean {
  const ended = ymd(peptide.endsOn)
  return !ended || ended >= day
}

function isKlowPeptide(peptide: Peptide): boolean {
  return peptide.id === 'klow' || peptide.name.trim().toLowerCase() === 'klow'
}

function klowUnits(): number {
  return u100UnitsFromMg(BUBBLES_KLOW_DOSE_MG, BUBBLES_KLOW_VIAL_MG, BUBBLES_KLOW_BAC_ML) ?? 3.75
}

function stackTiming(peptides: Peptide[]): string {
  const timings = peptides
    .filter(
      (peptide) =>
        !isKlowPeptide(peptide) &&
        peptide.frequency === 'daily' &&
        isCurrentOn(peptide, BUBBLES_STACK_START) &&
        peptide.timing?.trim()
    )
    .map((peptide) => peptide.timing!.trim())
  if (timings.length === 0) return 'Daily'
  const counts = new Map<string, number>()
  for (const timing of timings) counts.set(timing, (counts.get(timing) ?? 0) + 1)
  let best = timings[0]
  let bestCount = 0
  for (const [timing, count] of counts) {
    if (count > bestCount) {
      best = timing
      bestCount = count
    }
  }
  return best
}

/** Pull a current peptide onto Oct 24 without touching compounds that already ended. */
function alignCurrentPeptide(peptide: Peptide): Peptide {
  if (!isCurrentOn(peptide, BUBBLES_STACK_START)) return peptide
  let next = peptide
  const start = ymd(peptide.startsOn)
  if (!start || start > BUBBLES_STACK_START) {
    next = { ...next, startsOn: BUBBLES_STACK_START }
  }
  const pause = next.schedulePause
  if (pause && pause.from <= BUBBLES_STACK_START && pause.until >= BUBBLES_STACK_START) {
    if (pause.from < BUBBLES_STACK_START) {
      next = {
        ...next,
        schedulePause: { from: pause.from, until: DAY_BEFORE_START },
      }
    } else {
      const { schedulePause: _pause, ...rest } = next
      next = rest
    }
  }
  return next
}

function buildKlowPeptide(timing: string): Peptide {
  const units = klowUnits()
  const concentration = BUBBLES_KLOW_VIAL_MG / BUBBLES_KLOW_BAC_ML
  return {
    id: 'klow',
    name: 'KLOW',
    dose: '1mg',
    frequency: 'daily',
    timing,
    startsOn: BUBBLES_STACK_START,
    notes:
      '80 mg / 3 mL BAC ≈ 26.67 mg/mL. 1 mg daily ≈ 3.75 units, scheduled as 4 units. Mixed Oct 24, 2026. Research-use tracking only.',
    vialSize: '80mg',
    protocol: {
      vialMg: BUBBLES_KLOW_VIAL_MG,
      bacWaterUnits: 300,
      bacWaterMl: BUBBLES_KLOW_BAC_ML,
      concentrationMgPerMl: concentration,
      concentrationLabel: '26.67 mg/mL',
      startingDoseMg: BUBBLES_KLOW_DOSE_MG,
      startingDoseLabel: '1 mg',
      startingSyringeUnits: units,
      reconstituted: true,
      calculationSummary:
        '80 mg / 3 mL ≈ 26.67 mg/mL. 1 mg ≈ 3.75 units on U-100.',
      reconstitutionSteps: [
        '80 mg vial + 3.0 mL bacteriostatic water ≈ 26.67 mg/mL.',
        '1 mg ≈ 3.75 units on a U-100 syringe. This tracker’s half-unit draw schedules 4 units. Override on the form if you want 3.75.',
      ],
      titration: [
        {
          weeks: '1-13',
          doseMg: BUBBLES_KLOW_DOSE_MG,
          doseLabel: '1 mg',
          syringeUnits: units,
          notes: '1 mg daily ≈ 3.75 units, scheduled as 4 units, from Oct 24, 2026.',
        },
      ],
    },
  }
}

function withKlowSchedule(peptide: Peptide, timing: string): Peptide {
  const fresh = buildKlowPeptide(timing)
  return {
    ...fresh,
    id: peptide.id || fresh.id,
    endsOn: peptide.endsOn,
  }
}

function buildKlowVial(): Vial {
  return {
    id: BUBBLES_VIAL_ID,
    compoundName: 'KLOW',
    compoundId: 'klow',
    vialMg: BUBBLES_KLOW_VIAL_MG,
    bacWaterMl: BUBBLES_KLOW_BAC_ML,
    concentrationMgPerMl: BUBBLES_KLOW_VIAL_MG / BUBBLES_KLOW_BAC_ML,
    mixedDate: BUBBLES_STACK_START,
    isPowder: false,
    remainingMg: BUBBLES_KLOW_VIAL_MG,
    depleted: false,
    notes:
      'Mixed / Active. 80 mg / 3 mL BAC. Opened Oct 24, 2026. Remaining 80 mg. 1 mg ≈ 3.75 units, scheduled as 4.',
    createdAt: '2026-10-24T19:00:00.000Z',
  }
}

function hasFullKlowVial(vials: Vial[]): boolean {
  return vials.some(
    (vial) =>
      !vial.depleted &&
      !vial.replacedAt &&
      vial.vialMg === BUBBLES_KLOW_VIAL_MG &&
      vial.bacWaterMl === BUBBLES_KLOW_BAC_ML &&
      ymd(vial.mixedDate) === BUBBLES_STACK_START &&
      (vial.compoundId === 'klow' || vial.compoundName.trim().toLowerCase() === 'klow')
  )
}

function nextDefinitionVersion(plan?: RecompPlan): string {
  const previous = plan?.definitionVersion ?? ''
  if (!previous) return BUBBLES_KLOW_VERSION
  if (previous.includes(BUBBLES_KLOW_VERSION)) return previous
  return `${previous}+${BUBBLES_KLOW_VERSION}`
}

/**
 * Adds KLOW 80 mg to Bubblesmama only.
 * Keeps injection logs, weight history, workouts, and peptides that already ended.
 * Returns null for every other user, and null once this version is already on the plan.
 */
export function applyBubblesmamaKlow(
  state: TrackerState,
  username?: string | null,
  email?: string | null
): TrackerState | null {
  if (!isBubblesmamaUser(username, email)) return null
  if (state.recompPlan?.definitionVersion?.includes(BUBBLES_KLOW_VERSION)) return null

  const timing = stackTiming(state.peptides ?? [])
  const aligned = (state.peptides ?? []).map(alignCurrentPeptide)
  const currentKlow = aligned.find(
    (peptide) => isKlowPeptide(peptide) && isCurrentOn(peptide, BUBBLES_STACK_START)
  )
  const peptides = currentKlow
    ? aligned.map((peptide) =>
        peptide === currentKlow ? withKlowSchedule(peptide, timing) : peptide
      )
    : [...aligned, buildKlowPeptide(timing)]

  const existingVials = state.vialInventory ?? []
  const vialInventory = hasFullKlowVial(existingVials)
    ? existingVials
    : [...existingVials, buildKlowVial()]

  const summary = [...(state.recompPlan?.summary ?? [])]
  const stackLine =
    'Day 1 of the current stack is Oct 24, 2026. KLOW 80 mg / 3 mL, 1 mg daily ≈ 3.75 units (scheduled as 4), starts that day.'
  if (!summary.includes(stackLine)) summary.push(stackLine)

  return {
    ...state,
    profile: {
      ...state.profile,
      startDate: BUBBLES_STACK_START,
    },
    peptides,
    vialInventory,
    injectionLogs: state.injectionLogs ?? [],
    weightHistory: state.weightHistory ?? [],
    workoutCompletions: state.workoutCompletions ?? [],
    recompPlan: {
      generatedAt: state.recompPlan?.generatedAt ?? '2026-10-24T19:00:00.000Z',
      summary,
      nutritionNotes: state.recompPlan?.nutritionNotes ?? [],
      trainingNotes: state.recompPlan?.trainingNotes ?? [],
      checkInCadence: state.recompPlan?.checkInCadence ?? '',
      reconstitutionReminder: state.recompPlan?.reconstitutionReminder,
      definitionVersion: nextDefinitionVersion(state.recompPlan),
    },
  }
}
