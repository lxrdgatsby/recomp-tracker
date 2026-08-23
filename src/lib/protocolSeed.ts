import { format } from 'date-fns'
import { STORAGE_KEY } from '../constants/defaults'
import type {
  Peptide,
  PeptideProtocol,
  RecompPlan,
  TitrationWeek,
  TrackerState,
} from '../types'
import { saveState } from '../utils/storage'

export const SEED_USER = 'lxrdgatsby'
export const SEED_FLAG = 'protocolSeeded_lxrdgatsby'
export const SAFETY_COPY =
  'Research-use only. Not medical advice. Tesamorelin and testosterone are prescription drugs. Retatrutide is investigational. Confirm Test mg/mL and whether KLOW is 10 mg or 80 mg before locking units.'

export const PHASE_NOTES = {
  weeks5to8: [
    'Reta 4 mg = 80 units IF GI stays mild',
    'Tesamorelin 1.4 mg = 21 units',
    'SS-31 5 mg = 30 units if tolerated',
    'MOTS-c 1 mg M/W/F = 30 units',
    'NAD+ 100 mg M/W/F = 50 units if burn tolerated',
    'GHK-Cu optional 2 mg = 6 units',
    'KLOW 1 mg = 30 units if no site issues',
  ],
  weeks9to12: [
    'Reta stay 4 mg unless stall + easy GI, then 5 mg = 100 units. Do not chase 8–12 mg this cycle.',
    'Tesamorelin 2.0 mg = 30 units ONLY if glucose/IGF-1 allow; else stay 21 units.',
  ],
}

function upcomingSunday(now = new Date()): string {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  const add = d.getDay() === 0 ? 0 : 7 - d.getDay()
  d.setDate(d.getDate() + add)
  return format(d, 'yyyy-MM-dd')
}

function protocol(opts: {
  vialMg: number
  bacWaterUnits: 100 | 200 | 300 | 500
  startingDoseMg: number
  startingSyringeUnits: number
  reconstituted?: boolean
  titration?: TitrationWeek[]
  extraSteps?: string[]
}): PeptideProtocol {
  const bacWaterMl = opts.bacWaterUnits / 100
  const concentrationMgPerMl =
    opts.vialMg > 0 && bacWaterMl > 0 ? opts.vialMg / bacWaterMl : 0
  const titration = opts.titration ?? [
    {
      weeks: '1-4',
      doseMg: opts.startingDoseMg,
      doseLabel: `${opts.startingSyringeUnits} units on U-100 syringe`,
      syringeUnits: opts.startingSyringeUnits,
    },
  ]
  return {
    vialMg: opts.vialMg,
    bacWaterUnits: opts.bacWaterUnits,
    bacWaterMl,
    concentrationMgPerMl,
    concentrationLabel:
      concentrationMgPerMl > 0
        ? `${Number(concentrationMgPerMl.toFixed(2))} mg/mL`
        : 'confirm mg/mL on vial',
    startingDoseMg: opts.startingDoseMg,
    startingDoseLabel: `${opts.startingSyringeUnits} units on U-100 syringe`,
    startingSyringeUnits: opts.startingSyringeUnits,
    reconstituted: opts.reconstituted ?? true,
    calculationSummary:
      concentrationMgPerMl > 0
        ? `${opts.vialMg}mg / ${bacWaterMl}mL → ${Number(concentrationMgPerMl.toFixed(2))} mg/mL · start ${opts.startingSyringeUnits} u`
        : 'Dose stored as 0.75 mL. Confirm mg/mL on vial.',
    reconstitutionSteps: [
      `Product ${opts.vialMg}mg reconstituted with ${bacWaterMl}mL (${opts.bacWaterUnits} units BAC) on U-100.`,
      ...(opts.extraSteps ?? []),
    ],
    titration,
  }
}

export function buildLxrdgatsbyStack(startDate: string): {
  peptides: Peptide[]
  recompPlan: RecompPlan
  vials: Record<string, unknown>[]
} {
  const peptides: Peptide[] = [
    {
      id: 'test-cyp',
      name: 'Test Cyp',
      dose: '0.75 mL',
      frequency: 'weekly',
      timing: 'Sunday PM',
      notes: 'confirm mg/mL on vial. Concentration UNKNOWN.',
      vialSize: 'unknown',
      protocol: protocol({
        vialMg: 0,
        bacWaterUnits: 100,
        startingDoseMg: 0,
        startingSyringeUnits: 75,
        extraSteps: ['Do not convert to mg until vial concentration is confirmed.'],
      }),
    },
    {
      id: 'retatrutide',
      name: 'Retatrutide',
      dose: '2.5mg',
      frequency: 'weekly',
      timing: 'Sunday evening (or Monday AM if preferred)',
      notes: 'Investigational. 2.5 mg = 50 units. Rotate sites.',
      vialSize: '10mg',
      protocol: protocol({
        vialMg: 10,
        bacWaterUnits: 200,
        startingDoseMg: 2.5,
        startingSyringeUnits: 50,
      }),
    },
    {
      id: 'tesamorelin',
      name: 'Tesamorelin',
      dose: '0.5mg',
      frequency: 'daily',
      timing: 'Nightly (2–3h fasted)',
      notes: 'Prescription drug. Week 1: 0.5 mg = 7.5 u; Weeks 2–4: 1.0 mg = 15 u.',
      vialSize: '20mg',
      protocol: protocol({
        vialMg: 20,
        bacWaterUnits: 300,
        startingDoseMg: 0.5,
        startingSyringeUnits: 7.5,
        titration: [
          {
            weeks: '1-1',
            doseMg: 0.5,
            doseLabel: '7.5 units on U-100 syringe',
            syringeUnits: 7.5,
            notes: 'Week 1 start',
          },
          {
            weeks: '2-4',
            doseMg: 1,
            doseLabel: '15 units on U-100 syringe',
            syringeUnits: 15,
            notes: 'Weeks 2–4. Later phases are planned, not auto-applied.',
          },
        ],
      }),
    },
    {
      id: 'aod9604',
      name: 'AOD-9604',
      dose: '0.5mg',
      frequency: 'daily',
      timing: 'Morning fasted',
      notes: 'Week 1: 0.5 mg = 15 u; Weeks 2–4: 1.0 mg = 30 u.',
      vialSize: '10mg',
      protocol: protocol({
        vialMg: 10,
        bacWaterUnits: 300,
        startingDoseMg: 0.5,
        startingSyringeUnits: 15,
        titration: [
          {
            weeks: '1-1',
            doseMg: 0.5,
            doseLabel: '15 units on U-100 syringe',
            syringeUnits: 15,
          },
          {
            weeks: '2-4',
            doseMg: 1,
            doseLabel: '30 units on U-100 syringe',
            syringeUnits: 30,
          },
        ],
      }),
    },
    {
      id: 'ss31',
      name: 'SS-31',
      dose: '2.5mg',
      frequency: 'daily',
      timing: 'Morning fasted',
      notes: '2.5 mg = 15 units daily.',
      vialSize: '50mg',
      protocol: protocol({
        vialMg: 50,
        bacWaterUnits: 300,
        startingDoseMg: 2.5,
        startingSyringeUnits: 15,
      }),
    },
    {
      id: 'ghkcu',
      name: 'GHK-Cu',
      dose: '1mg',
      frequency: 'daily',
      timing: 'Morning fasted',
      notes: '1 mg = 3 units daily or 5x/week.',
      vialSize: '100mg',
      protocol: protocol({
        vialMg: 100,
        bacWaterUnits: 300,
        startingDoseMg: 1,
        startingSyringeUnits: 3,
      }),
    },
    {
      id: 'motsc',
      name: 'MOTS-c',
      dose: '0.5mg',
      frequency: 'mwf',
      timing: 'Morning fasted · Mon/Wed/Fri',
      notes: '0.5 mg = 15 units M/W/F.',
      vialSize: '10mg',
      protocol: protocol({
        vialMg: 10,
        bacWaterUnits: 300,
        startingDoseMg: 0.5,
        startingSyringeUnits: 15,
      }),
    },
    {
      id: 'bpc157',
      name: 'BPC-157',
      dose: '500mcg',
      frequency: 'daily',
      timing: 'PM or split',
      notes: '500 mcg = 10 units.',
      vialSize: '10mg',
      protocol: protocol({
        vialMg: 10,
        bacWaterUnits: 200,
        startingDoseMg: 0.5,
        startingSyringeUnits: 10,
      }),
    },
    {
      id: 'klow',
      name: 'KLOW',
      dose: '0.5mg',
      frequency: 'daily',
      timing: 'Evening',
      notes: 'Treated as 10mg product, NOT 80mg blend unless changed later. 0.5 mg = 15 units.',
      vialSize: '10mg',
      protocol: protocol({
        vialMg: 10,
        bacWaterUnits: 300,
        startingDoseMg: 0.5,
        startingSyringeUnits: 15,
        extraSteps: ['Confirm whether KLOW is 10 mg or 80 mg before locking units.'],
      }),
    },
    {
      id: 'nad',
      name: 'NAD+',
      dose: '50mg',
      frequency: 'mwf',
      timing: 'Evening · Mon/Wed/Fri · thigh preferred',
      notes: '50 mg = 25 units M/W/F.',
      vialSize: '1000mg',
      protocol: protocol({
        vialMg: 1000,
        bacWaterUnits: 500,
        startingDoseMg: 50,
        startingSyringeUnits: 25,
      }),
    },
  ]

  const recompPlan: RecompPlan = {
    generatedAt: new Date().toISOString(),
    summary: [
      '90-Day Research Protocol — starts Sunday.',
      'Recomp. Realistic: fat loss + lean preservation. +8lb muscle and 7% BF is stretch.',
      'Weeks 1–4 loaded. Weeks 5–8 and 9–12 are planned only — not auto-applied.',
      SAFETY_COPY,
    ],
    nutritionNotes: [
      'Protein 200–240 g/day (display only, not a medical order).',
      'Calories start 2000–2200, adjust by weekly average weight.',
      'Aim 0.8–1.2 lb/week.',
      'Creatine 5 g daily.',
    ],
    trainingNotes: [
      'Research-use / compounding stack. Not medically supervised.',
      `Weeks 5–8 planned: ${PHASE_NOTES.weeks5to8.join(' | ')}`,
      `Weeks 9–12 planned: ${PHASE_NOTES.weeks9to12.join(' | ')}`,
      'Labs: baseline, week 4–6, week 10–12.',
    ],
    checkInCadence: 'Weekly weigh-in. Labs at baseline, week 4–6, and week 10–12.',
    reconstitutionReminder:
      'U-100: 100 units = 1 mL. Confirm Test mg/mL and whether KLOW is 10 mg or 80 mg before locking units.',
  }

  const vials = peptides.map((p) => ({
    id: `vial-${p.id}`,
    name: p.name,
    compound: p.name,
    productMg: p.protocol?.vialMg ?? null,
    diluentMl: p.protocol?.bacWaterMl ?? null,
    concentrationMgPerMl: p.protocol?.concentrationMgPerMl ?? null,
    remainingMl: p.protocol?.bacWaterMl ?? null,
    remainingUnits: p.protocol ? p.protocol.bacWaterMl * 100 : null,
    syringe: 'U-100',
    notes: p.notes,
  }))

  void startDate
  return { peptides, recompPlan, vials }
}

export function isLxrdgatsbyUser(username?: string | null): boolean {
  return (username ?? '').trim().toLowerCase() === SEED_USER
}

export function hasSeededProtocol(): boolean {
  try {
    return localStorage.getItem(SEED_FLAG) === 'true'
  } catch {
    return false
  }
}

function writeLegacyKeys(startDate: string, state: TrackerState, vials: unknown[]) {
  try {
    localStorage.setItem('protocolStartDate', startDate)
    localStorage.setItem('activeStack', JSON.stringify(state.peptides))
    localStorage.setItem('vials', JSON.stringify(vials))
    localStorage.setItem('scheduledDoses', JSON.stringify(state.peptides))
    localStorage.setItem('checkIns', '[]')
    localStorage.setItem('startWeight', '175')
    localStorage.setItem('targetWeight', '160')
    localStorage.setItem(
      'goalNote',
      'Recomp. Realistic: fat loss + lean preservation. +8lb muscle and 7% BF is stretch.',
    )
    localStorage.setItem(
      'disclaimer',
      'Research-use / compounding stack. Not medically supervised. Tesamorelin and testosterone are prescription drugs. Retatrutide is investigational.',
    )
    localStorage.setItem('phaseNotes', JSON.stringify(PHASE_NOTES))
    localStorage.setItem('safetyCopy', SAFETY_COPY)
    localStorage.setItem(SEED_FLAG, 'true')
    saveState(state)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore quota */
  }
}

/** Run once. Returns seeded state, or null if skipped. */
export function applyLxrdgatsbyProtocolSeed(
  current: TrackerState,
  username?: string | null,
): TrackerState | null {
  if (typeof localStorage === 'undefined') return null
  if (username && !isLxrdgatsbyUser(username)) return null
  const alreadyStacked =
    current.peptides.some((p) => p.id === 'test-cyp') &&
    current.peptides.some((p) => p.id === 'klow')
  if (alreadyStacked) {
    try {
      localStorage.setItem(SEED_FLAG, 'true')
    } catch {
      /* ignore */
    }
    return null
  }
  if (hasSeededProtocol()) return null

  const startDate = upcomingSunday()
  const { peptides, recompPlan, vials } = buildLxrdgatsbyStack(startDate)
  const next: TrackerState = {
    ...current,
    profile: {
      ...current.profile,
      currentWeight: 175,
      goalWeight: 160,
      startDate,
      weeklyLossTarget: 1,
    },
    peptides,
    recompPlan,
    injectionLogs: current.injectionLogs ?? [],
    weightHistory: current.weightHistory ?? [],
    workoutCompletions: current.workoutCompletions ?? [],
  }
  writeLegacyKeys(startDate, next, vials)
  return next
}
