import type { Peptide, RecompPlan, TrackerState } from '../types'
import type { Vial } from '../types/v2'
import { u100UnitsFromMg } from '../utils/doseMath'

/** Family planning sheet dated 25 September 2026. Her plan only. */
export const MAGGIE_EMAIL = 'maggiebella714@yahoo.com'
export const MAGGIE_DEFINITION_VERSION = '2026-09-25-maggie-reta'
export const MAGGIE_HEIGHT = '5′1″'
export const MAGGIE_START_LB = 180
export const MAGGIE_GOAL_LB = 145
/** Slow-titration pace toward ~162–168 lb. 145 lb is the longer horizon. */
export const MAGGIE_WEEKLY_LOSS_LB = 1.2
export const MAGGIE_VIAL_ID = 'vial-maggie-reta'

export const MAGGIE_HONEST_NOTE =
  '145 lb in 90 days is a stretch. Conservative expected range at Day 90 is roughly 162–168 lb if staying on a slow titration. Treat 145 lb as a longer horizon if 4 mg is later tolerated.'

export const MAGGIE_DISCLAIMER =
  'Investigational medicine. Physician clearance required before any dose. Not a prescription.'

export const MAGGIE_PHASE_LINES = [
  'Weeks 1–2: 0.5 mg weekly = 10 units',
  'Weeks 3–4: 1.0 mg weekly = 20 units',
  'Weeks 5–8: 2.0 mg weekly = 40 units (hold the full 4 weeks)',
  'Weeks 9–12: stay at 2.0 mg (40 units). Move to 4.0 mg (80 units) only if prior weeks were clean (GI quiet, no vomiting, BP stable, no stone symptoms). Do not auto-escalate. Escalation is clinician-driven.',
]

export const MAGGIE_MAIN_GOAL =
  'Conservative Retatrutide plan. Start 180 lb, longer-horizon goal 145 lb. Day-90 range about 162–168 lb on a slow titration.'

export const MAGGIE_TRAINING =
  'Resistance training 2–3x/week once cleared'

export const MAGGIE_TRACKING_NOTE =
  'Track each check-in: dose (mg + units + site), scale weight, blood pressure (SBP/DBP), heart rate (seated and standing), water (liters), protein (grams), GI score, urine color, flank pain yes/no, steps, resistance sessions.'

const MAGGIE_SUMMARY = [
  MAGGIE_DISCLAIMER,
  '51-year-old woman · height 5′1″ · start 180 lb → goal 145 lb.',
  MAGGIE_HONEST_NOTE,
  'Retatrutide only. 10 mg vial + 2.0 mL bacteriostatic water = 5 mg/mL. Weeks 1–2: 0.5 mg = 10 units. Weeks 3–4: 1.0 mg = 20 units. Weeks 5–8: 2.0 mg = 40 units. Weeks 9–12: stay at 2.0 mg (40 units) unless a clinician moves to 4.0 mg (80 units) after clean weeks.',
  'Conservative start at 0.5 mg, not the published TRIUMPH 2 mg start, because of post-surgery status and sensitivity.',
  'Recent kidney-stone surgery (~2 weeks recovered at the 25 September 2026 sheet). Hydration priority (aim ~2.5–3 L). On metoprolol for blood pressure. Do not change BP meds without her clinician.',
  'Hard stops: vomiting/diarrhea with inability to keep fluids, dark/less urine, new flank pain, lightheadedness, severe right-rib pain, unexpected HR jump.',
  'Protein target ~100–120 g/day. Calories roughly 1,400–1,600 to start. Resistance training 2–3x/week once cleared.',
  'Labs recommended: CMP/eGFR baseline and at weeks 4, 8, 12.',
  MAGGIE_TRACKING_NOTE,
  'Weekly injection, same day each week. Rotate sites. Do not auto-escalate.',
]

export const MAGGIE_ADDITIONAL_INFO = MAGGIE_SUMMARY.join('\n')
export const MAGGIE_ASSISTANT_NOTE = MAGGIE_ADDITIONAL_INFO

export function isMaggieUser(email?: string | null): boolean {
  return (email ?? '').trim().toLowerCase() === MAGGIE_EMAIL
}

function localYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Upcoming Sunday, or today when today is Sunday. Local calendar, not UTC. */
export function upcomingSunday(from = new Date()): string {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const dow = date.getDay()
  if (dow !== 0) date.setDate(date.getDate() + (7 - dow))
  return localYmd(date)
}

export function maggiePhaseLabel(week: number): string {
  if (week <= 2) return 'Weeks 1–2'
  if (week <= 4) return 'Weeks 3–4'
  if (week <= 8) return 'Weeks 5–8'
  return 'Weeks 9–12'
}

function retaUnits(mg: number): number {
  const units = u100UnitsFromMg(mg, 10, 2)
  if (units == null) return 0
  return units
}

function buildMaggiePeptide(): Peptide {
  return {
    id: 'retatrutide',
    name: 'Retatrutide',
    dose: '0.5mg',
    frequency: 'weekly',
    timing: 'Weekly — same day each week. Rotate sites.',
    notes:
      'Retatrutide only. 10 mg / 2 mL = 5 mg/mL. Start 0.5 mg = 10 units. Do not auto-escalate. Escalation is clinician-driven. Investigational medicine. Not a prescription.',
    vialSize: '10mg',
    protocol: {
      vialMg: 10,
      bacWaterUnits: 200,
      bacWaterMl: 2,
      concentrationMgPerMl: 5,
      concentrationLabel: '5 mg/mL',
      startingDoseMg: 0.5,
      startingDoseLabel: '0.5 mg',
      startingSyringeUnits: retaUnits(0.5),
      reconstituted: true,
      calculationSummary:
        '10 mg / 2 mL → 5 mg/mL. 0.5 mg = 10 units. 1.0 mg = 20 units. 2.0 mg = 40 units. 4.0 mg = 80 units.',
      reconstitutionSteps: [
        '10 mg vial + 2.0 mL bacteriostatic water = 5 mg/mL.',
        '0.5 mg = 10 units. 1.0 mg = 20 units. 2.0 mg = 40 units. 4.0 mg = 80 units.',
        'Do not auto-escalate. A move to 4.0 mg is clinician-driven and only after clean weeks.',
      ],
      titration: [
        {
          weeks: '1-2',
          doseMg: 0.5,
          doseLabel: '0.5 mg',
          syringeUnits: retaUnits(0.5),
          notes: MAGGIE_PHASE_LINES[0],
        },
        {
          weeks: '3-4',
          doseMg: 1,
          doseLabel: '1.0 mg',
          syringeUnits: retaUnits(1),
          notes: MAGGIE_PHASE_LINES[1],
        },
        {
          weeks: '5-8',
          doseMg: 2,
          doseLabel: '2.0 mg',
          syringeUnits: retaUnits(2),
          notes: MAGGIE_PHASE_LINES[2],
        },
        {
          weeks: '9-12',
          doseMg: 2,
          doseLabel: '2.0 mg',
          syringeUnits: retaUnits(2),
          notes: MAGGIE_PHASE_LINES[3],
        },
      ],
    },
  }
}

function isRetatrutideVial(vial: Vial): boolean {
  if (vial.compoundId === 'reta-cagri') return false
  if (vial.compoundId === 'retatrutide') return true
  return vial.compoundName.trim().toLowerCase() === 'retatrutide'
}

function buildMaggieVial(opened: string): Vial {
  return {
    id: MAGGIE_VIAL_ID,
    compoundName: 'Retatrutide',
    compoundId: 'retatrutide',
    vialMg: 10,
    bacWaterMl: 2,
    concentrationMgPerMl: 5,
    mixedDate: opened,
    isPowder: false,
    remainingMg: 10,
    depleted: false,
    notes:
      '10 mg vial + 2.0 mL bacteriostatic water = 5 mg/mL. Full. Opened on plan start. 0.5 mg = 10 units.',
    createdAt: `${opened}T12:00:00.000Z`,
  }
}

function buildMaggiePlan(startDate: string): RecompPlan {
  return {
    generatedAt: new Date().toISOString(),
    definitionVersion: MAGGIE_DEFINITION_VERSION,
    summary: [`90-day plan from ${startDate}.`, ...MAGGIE_SUMMARY],
    nutritionNotes: [
      'Protein target ~100–120 g/day',
      'Calories roughly 1,400–1,600 to start',
      'Water aim ~2.5–3 L/day',
    ],
    trainingNotes: [
      'Resistance training 2–3x/week once cleared.',
      'Weekly injection, same day each week. Rotate sites.',
      'Do not auto-escalate. 4.0 mg (80 units) is clinician-driven only after GI quiet, no vomiting, BP stable, and no stone symptoms.',
      'Hard stops: vomiting/diarrhea with inability to keep fluids, dark/less urine, new flank pain, lightheadedness, severe right-rib pain, unexpected HR jump.',
    ],
    checkInCadence: MAGGIE_TRACKING_NOTE,
    reconstitutionReminder:
      '10 mg / 2 mL = 5 mg/mL. 0.5 mg = 10 units, 1.0 mg = 20 units, 2.0 mg = 40 units, 4.0 mg = 80 units.',
  }
}

function latestWeight(state: TrackerState): number | null {
  const history = state.weightHistory ?? []
  if (history.length === 0) return null
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date))
  return sorted[0]?.weight ?? null
}

/**
 * Conservative Retatrutide plan for maggiebella714@yahoo.com only.
 * Returns null for every other email, and null once her definition is already applied.
 * Does not delete logs, weight history, or existing vials.
 */
export function applyMaggiePlan(
  state: TrackerState,
  email?: string | null,
  options?: { preserveStartDate?: boolean; today?: Date }
): TrackerState | null {
  if (!isMaggieUser(email)) return null
  if (state.recompPlan?.definitionVersion === MAGGIE_DEFINITION_VERSION) return null

  const startDate =
    options?.preserveStartDate && /^\d{4}-\d{2}-\d{2}/.test(state.profile.startDate)
      ? state.profile.startDate.slice(0, 10)
      : upcomingSunday(options?.today ?? new Date())

  const existingVials = state.vialInventory ?? []
  const vialInventory = existingVials.some(isRetatrutideVial)
    ? existingVials
    : [...existingVials, buildMaggieVial(startDate)]

  const logged = latestWeight(state)

  return {
    ...state,
    profile: {
      ...state.profile,
      startWeight: MAGGIE_START_LB,
      goalWeight: MAGGIE_GOAL_LB,
      currentWeight: logged ?? MAGGIE_START_LB,
      height: MAGGIE_HEIGHT,
      startDate,
      weeklyLossTarget: MAGGIE_WEEKLY_LOSS_LB,
    },
    peptides: [buildMaggiePeptide()],
    recompPlan: buildMaggiePlan(startDate),
    weightHistory: state.weightHistory ?? [],
    injectionLogs: state.injectionLogs ?? [],
    workoutCompletions: state.workoutCompletions ?? [],
    vialInventory,
  }
}
