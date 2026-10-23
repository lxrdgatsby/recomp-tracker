import { STORAGE_KEY } from '../constants/defaults'
import { readLocal, writeLocal } from './protocolStorageScope'
import {
  AMINO_1MQ_FULL_DOSE_DATE,
  AMINO_1MQ_START_DATE,
  CURRENT_WEIGHT_LB,
  CYCLE_START_DATE,
  DSIP_NOTE,
  DSIP_START_DATE,
  FAT_LOSS_DRIVERS,
  GOAL_WEIGHT_LB,
  GUIDANCE_CARDS,
  HONEST_OUTCOME_COPY,
  KLOW_NOTE,
  MUSCLE_DRIVERS,
  RESEARCH_DISCLAIMER,
  START_WEIGHT_LB,
  WEEKLY_LOSS_LB,
} from '../constants/reconstitutionTable'
import type {
  Peptide,
  PeptideProtocol,
  RecompPlan,
  TitrationWeek,
  TrackerState,
} from '../types'
import { formatSyringeUnits } from '../utils/recompProtocol'
import { saveState } from '../utils/storage'
import { PROTOCOL_NOTE, stampRestartPeptide, withNadHorizon } from './lxrdRestart'
import { applyLxrdWeightTargets } from './lxrdWeight'
import { endPeptideNow, removedPeptideIdSet } from './removedCompounds'

export const SEED_USER = 'lxrdgatsby'
export const SEED_FLAG = 'protocolSeeded_lxrdgatsby'
export const PROTOCOL_DEFINITION_VERSION = '2026-10-25-dsip-v6'
export const SAFETY_COPY = RESEARCH_DISCLAIMER

export const PHASE_NOTES = {
  weeks1to4: [
    'Test Cyp: 0.75 mL weekly (Sunday PM)',
    'Retatrutide: 2.5 mg weekly = 50 units',
    'Tesamorelin: Week 1 = 0.5 mg (7.5 u); Weeks 2–4 = 1.0 mg (15 u). Nightly, fasted',
    'AOD-9604: Week 1 = 0.5 mg (15 u); Weeks 2–4 through Sept 12 = 1.0 mg (30 u on 3 mL). From Sept 13: 1.0 mg = 20 u on 10 mg / 2 mL',
    'BPC-157: 500 mcg daily = 10 units',
    'SS-31: 2.5 mg = 15 units, morning',
    'GHK-Cu: 1 mg = 3 units, daily or 5×/week AM',
    'KLOW 10 mg: 0.5 mg = 15 units, evening',
    'MOTS-c: 0.5 mg = 15 units, Mon/Wed/Fri morning',
    'NAD+: 50 mg = 25 units, Mon/Wed/Fri evening',
    '5-Amino-1MQ: starts Tue Sept 15. 2.5 mg = 15 u for 2 days, then 5 mg = 30 u morning fasted from Thu Sept 17. Not 50 mg SC.',
  ],
  weeks5to8: [
    'Reta 4 mg = 80 units IF GI stays mild at 2.5 mg; else hold 50 units',
    'Tesamorelin 1.4 mg nightly = 21 units',
    'SS-31 5 mg = 30 units only if sites/energy are fine',
    'MOTS-c 1 mg M/W/F = 30 units',
    'NAD+ 100 mg M/W/F = 50 units if burn is tolerable',
    'GHK-Cu optional 2 mg = 6 units, 3–5×/week',
    'KLOW 1 mg = 30 units if no site issues',
    '5-Amino-1MQ: HOLD 30 units daily',
    'All others: hold',
  ],
  weeks9to12: [
    'Reta stay 4 mg (80 u) unless weight stall AND GI easy, then 5 mg = 100 units. Do not jump to 8–12 mg this cycle.',
    'Tesamorelin 2.0 mg = 30 units only if fasting glucose is good and IGF-1 is not already high; else stay 21 units.',
    'Everything else: hold week 5–8 doses, including 5-Amino-1MQ at 30 u',
    'DSIP: starts Sun Oct 25. 100 mcg = 2 units nightly, 30–60 min before bed. 10 mg / 2 mL.',
  ],
}

function uLabel(units: number): string {
  return formatSyringeUnits(units)
}

function tier(
  weeks: string,
  doseMg: number,
  syringeUnits: number,
  notes?: string
): TitrationWeek {
  return {
    weeks,
    doseMg,
    doseLabel: uLabel(syringeUnits),
    syringeUnits,
    notes,
  }
}

function protocol(opts: {
  vialMg: number
  bacWaterUnits: 100 | 200 | 300 | 500
  startingDoseMg: number
  startingSyringeUnits: number
  startingDoseLabel?: string
  reconstituted?: boolean
  titration?: TitrationWeek[]
  extraSteps?: string[]
}): PeptideProtocol {
  const bacWaterMl = opts.bacWaterUnits / 100
  const concentrationMgPerMl =
    opts.vialMg > 0 && bacWaterMl > 0 ? opts.vialMg / bacWaterMl : 0
  const startingDoseLabel =
    opts.startingDoseLabel ??
    (opts.startingSyringeUnits > 0
      ? uLabel(opts.startingSyringeUnits)
      : '0.75 mL')
  const titration = opts.titration ?? [
    {
      weeks: '1-12',
      doseMg: opts.startingDoseMg,
      doseLabel: startingDoseLabel,
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
        : 'USER LABEL — confirm mg/mL on vial',
    startingDoseMg: opts.startingDoseMg,
    startingDoseLabel,
    startingSyringeUnits: opts.startingSyringeUnits,
    reconstituted: opts.reconstituted ?? true,
    calculationSummary:
      concentrationMgPerMl > 0
        ? `${opts.vialMg}mg / ${bacWaterMl}mL → ${Number(concentrationMgPerMl.toFixed(2))} mg/mL · start ${startingDoseLabel}`
        : 'Dose stored as 0.75 mL. Confirm 200 vs 250 mg/mL on vial. Not a U-100 peptide draw.',
    reconstitutionSteps: [
      opts.vialMg > 0
        ? `Product ${opts.vialMg}mg reconstituted with ${bacWaterMl}mL (${opts.bacWaterUnits} units BAC) on U-100.`
        : 'Test Cyp is an oil vial — draw 0.75 mL. Do not convert to insulin units unless you choose a 1 mL syringe view.',
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
      notes:
        '0.75 mL weekly. 150 mg if 200 mg/mL, or 187.5 mg if 250 mg/mL. Not a U-100 peptide draw.',
      vialSize: 'unknown',
      protocol: protocol({
        vialMg: 0,
        bacWaterUnits: 100,
        startingDoseMg: 0,
        startingSyringeUnits: 0,
        startingDoseLabel: '0.75 mL',
        extraSteps: [
          'Confirm vial label 200 mg/mL vs 250 mg/mL before converting to mg.',
        ],
        titration: [
          {
            weeks: '1-12',
            doseMg: 0,
            doseLabel: '0.75 mL',
            syringeUnits: 0,
            notes: 'Sunday PM. Same day each week.',
          },
        ],
      }),
    },
    {
      id: 'retatrutide',
      name: 'Retatrutide',
      dose: '2.5mg',
      frequency: 'weekly',
      timing: 'Sunday evening with Test (or Monday morning if Sunday is crowded)',
      notes:
        'Fat-loss driver with food + steps. Only advance every 4 weeks. Do not jump to 8–12 mg this cycle.',
      vialSize: '10mg',
      protocol: protocol({
        vialMg: 10,
        bacWaterUnits: 200,
        startingDoseMg: 2.5,
        startingSyringeUnits: 50,
        titration: [
          tier('1-4', 2.5, 50, '2.5 mg weekly = 50 units'),
          tier(
            '5-8',
            4,
            80,
            '4 mg = 80 units IF GI stayed mild at 2.5 mg; else hold 50 units'
          ),
          tier(
            '9-12',
            4,
            80,
            'Stay 4 mg (80 u) unless weight stall AND GI easy, then 5 mg = 100 units'
          ),
        ],
      }),
    },
    {
      id: 'reta-cagri',
      name: 'Reta + Cagrilintide',
      dose: '1.5mg',
      frequency: 'weekly',
      timing: 'Sunday evening',
      startsOn: '2026-10-25',
      notes:
        '10 mg Reta + 10 mg Cagrilintide / 3 mL BAC. Dose the Reta portion. Start 1.5 mg weekly ≈ 45 units and hold 2 weeks.',
      vialSize: '10mg',
      protocol: protocol({
        vialMg: 10,
        bacWaterUnits: 300,
        startingDoseMg: 1.5,
        startingSyringeUnits: 45,
        extraSteps: [
          'Dose the Reta portion. 10 mg Reta + 10 mg Cagrilintide in 3 mL ≈ 3.33 mg/mL. 1.5 mg ≈ 45 u. Hold 2 weeks. 2.5 mg ≈ 75 u. 4 mg ≈ 120 u. Do not auto-step.',
        ],
        titration: [
          tier(
            '1-2',
            1.5,
            45,
            '1.5 mg Reta-equivalent ≈ 45 units weekly. Hold 2 weeks. Do not auto-step.'
          ),
        ],
      }),
    },
    {
      id: 'tesamorelin',
      name: 'Tesamorelin',
      dose: '0.5mg',
      frequency: 'daily',
      timing: 'Night, 2–3 h fasted',
      notes:
        'Abdominal SubQ preferred. Muscle driver with Test + progressive overload. Raises IGF-1. Contraindicated in active malignancy / disrupted pituitary axis.',
      vialSize: '20mg',
      protocol: protocol({
        vialMg: 20,
        bacWaterUnits: 300,
        startingDoseMg: 0.5,
        startingSyringeUnits: 7.5,
        titration: [
          tier('1-1', 0.5, 7.5, 'Week 1 start · Night, 2–3 h fasted'),
          tier('2-4', 1, 15, 'Weeks 2–4 · Night, 2–3 h fasted'),
          tier('5-8', 1.4, 21, '1.4 mg nightly = 21 units'),
          tier(
            '9-12',
            2,
            30,
            '2.0 mg = 30 units only if fasting glucose is good and IGF-1 is not already high; else stay 21 units'
          ),
        ],
      }),
    },
    {
      id: 'aod9604',
      name: 'AOD-9604',
      dose: '0.5mg',
      frequency: 'daily',
      timing: 'Morning, fasted',
      notes:
        'Support compound. Fat-loss engine is Retatrutide + food + steps. New vial from Sept 13 is 10 mg / 2 mL = 5 mg/mL · 1.0 mg = 20 units.',
      vialSize: '10mg',
      protocol: protocol({
        vialMg: 10,
        bacWaterUnits: 200,
        startingDoseMg: 0.5,
        startingSyringeUnits: 15,
        extraSteps: [
          'Vial B from Sept 13: 10 mg / 2 mL = 5 mg/mL. 1.0 mg = 20 units. Do not use the old 3 mL / 30 u math on this vial.',
        ],
        titration: [
          {
            weeks: '1-1',
            startDate: CYCLE_START_DATE,
            endDate: '2026-08-29',
            doseMg: 0.5,
            doseLabel: uLabel(15),
            syringeUnits: 15,
            notes: 'Week 1 · 0.5 mg = 15 units on 10 mg / 3 mL',
          },
          {
            weeks: '2-4',
            startDate: '2026-08-30',
            endDate: '2026-09-12',
            doseMg: 1,
            doseLabel: uLabel(30),
            syringeUnits: 30,
            notes: '1.0 mg = 30 units on 10 mg / 3 mL (old vial)',
          },
          {
            weeks: '4-12',
            startDate: '2026-09-13',
            doseMg: 1,
            doseLabel: uLabel(20),
            syringeUnits: 20,
            notes: '1.0 mg = 20 units on 10 mg / 2 mL (new vial). Hold after week 4.',
          },
        ],
      }),
    },
    {
      id: 'ss31',
      name: 'SS-31 (Elamipretide)',
      dose: '2.5mg',
      frequency: 'daily',
      timing: 'Morning, fasted',
      notes: '2.5 mg = 15 units. Not Forzinity 40 mg. Advance only if sites/energy are fine.',
      vialSize: '50mg',
      protocol: protocol({
        vialMg: 50,
        bacWaterUnits: 300,
        startingDoseMg: 2.5,
        startingSyringeUnits: 15,
        titration: [
          tier('1-4', 2.5, 15, '2.5 mg = 15 units, morning'),
          tier(
            '5-12',
            5,
            30,
            '5 mg = 30 units only if sites/energy are fine; else hold 15 units'
          ),
        ],
      }),
    },
    {
      id: 'amino1mq',
      name: '5-Amino-1MQ',
      dose: '2.5mg',
      frequency: 'daily',
      timing: 'Morning, fasted',
      startsOn: AMINO_1MQ_START_DATE,
      notes:
        'NAD+/NNMT support on top of NAD+ already in the stack — overlap, not a second fat-loss drug. Start 2.5 mg = 15 units Tue–Wed Sept 15–16, then 5 mg = 30 units if sites/energy are fine. Optional later: split 15 u AM + 15 u PM. Do not schedule 50 mg SC.',
      vialSize: '50mg',
      protocol: protocol({
        vialMg: 50,
        bacWaterUnits: 300,
        startingDoseMg: 2.5,
        startingSyringeUnits: 15,
        extraSteps: [
          '50 mg / 3 mL = 16.67 mg/mL. 15 units = 2.5 mg. 30 units = 5 mg. Not 50 mg as the injectable daily dose.',
        ],
        titration: [
          {
            weeks: '4-4',
            startDate: AMINO_1MQ_START_DATE,
            endDate: '2026-09-16',
            doseMg: 2.5,
            doseLabel: uLabel(15),
            syringeUnits: 15,
            notes:
              '2.5 mg = 15 units, morning fasted. First 2 days (Tue–Wed Sept 15–16).',
          },
          {
            weeks: '4-12',
            startDate: AMINO_1MQ_FULL_DOSE_DATE,
            doseMg: 5,
            doseLabel: uLabel(30),
            syringeUnits: 30,
            notes:
              '5 mg = 30 units, morning fasted. Hold. Optional later: split 15 u AM + 15 u PM if sites/energy are fine. Not 50 mg SC.',
          },
        ],
      }),
    },
    {
      id: 'ghkcu',
      name: 'GHK-Cu',
      dose: '1mg',
      frequency: 'daily',
      timing: 'Morning, fasted',
      notes: '1 mg = 3 units daily or 5×/week AM.',
      vialSize: '100mg',
      protocol: protocol({
        vialMg: 100,
        bacWaterUnits: 300,
        startingDoseMg: 1,
        startingSyringeUnits: 3,
        titration: [
          tier('1-4', 1, 3, '1 mg = 3 units, daily or 5×/week AM'),
          tier('5-12', 2, 6, 'Optional 2 mg = 6 units, 3–5×/week'),
        ],
      }),
    },
    {
      id: 'motsc',
      name: 'MOTS-c',
      dose: '0.5mg',
      frequency: 'mwf',
      timing: 'Morning, fasted · Mon/Wed/Fri',
      notes: 'Support compound. Not the primary fat-loss engine.',
      vialSize: '10mg',
      protocol: protocol({
        vialMg: 10,
        bacWaterUnits: 300,
        startingDoseMg: 0.5,
        startingSyringeUnits: 15,
        titration: [
          tier('1-4', 0.5, 15, '0.5 mg = 15 units, Mon/Wed/Fri morning'),
          tier('5-12', 1, 30, '1 mg M/W/F = 30 units'),
        ],
      }),
    },
    {
      id: 'bpc157',
      name: 'BPC-157',
      dose: '500mcg',
      frequency: 'daily',
      timing: 'Peri-training / after first meal (AM or PM)',
      notes: '500 mcg = 10 units. If not taken AM, take evening. Keep at 500 mcg even if KLOW also contains BPC.',
      vialSize: '10mg',
      protocol: protocol({
        vialMg: 10,
        bacWaterUnits: 200,
        startingDoseMg: 0.5,
        startingSyringeUnits: 10,
        titration: [tier('1-12', 0.5, 10, '500 mcg daily = 10 units')],
      }),
    },
    {
      id: 'klow',
      name: 'KLOW',
      dose: '0.5mg',
      frequency: 'daily',
      timing: 'Evening / post-training',
      notes: KLOW_NOTE,
      vialSize: '10mg',
      protocol: protocol({
        vialMg: 10,
        bacWaterUnits: 300,
        startingDoseMg: 0.5,
        startingSyringeUnits: 15,
        extraSteps: [KLOW_NOTE],
        titration: [
          tier('1-4', 0.5, 15, '0.5 mg = 15 units, evening'),
          tier('5-12', 1, 30, '1 mg = 30 units if no site issues'),
        ],
      }),
    },
    {
      id: 'nad',
      name: 'NAD+',
      dose: '50mg',
      frequency: 'mwf',
      timing: 'Evening / post-training · Mon/Wed/Fri · inject slow, thigh preferred, can burn',
      notes: 'Inject slow, thigh preferred, can burn. Support compound — not the fat-loss engine.',
      vialSize: '1000mg',
      protocol: protocol({
        vialMg: 1000,
        bacWaterUnits: 500,
        startingDoseMg: 50,
        startingSyringeUnits: 25,
        titration: [
          tier('1-4', 50, 25, '50 mg = 25 units, Mon/Wed/Fri evening'),
          tier(
            '5-12',
            100,
            50,
            '100 mg M/W/F = 50 units if burn is tolerable'
          ),
        ],
      }),
    },
    {
      id: 'dsip',
      name: 'DSIP',
      dose: '100mcg',
      frequency: 'daily',
      timing: '30–60 min before bed',
      startsOn: DSIP_START_DATE,
      notes: DSIP_NOTE,
      vialSize: '10mg',
      protocol: protocol({
        vialMg: 10,
        bacWaterUnits: 200,
        startingDoseMg: 0.1,
        startingSyringeUnits: 2,
        extraSteps: [
          '10 mg / 2 mL = 5 mg/mL. units = (desired_mcg / 5000) * 100. 100 mcg = 2 units, 250 mcg = 5 units, 500 mcg = 10 units.',
          'Research-use only. Published human data is mostly IV; SC is community practice.',
        ],
        titration: [
          {
            weeks: '10-13',
            startDate: DSIP_START_DATE,
            doseMg: 0.1,
            doseLabel: uLabel(2),
            syringeUnits: 2,
            notes:
              '100 mcg = 2 units, 30–60 min before bed. Nightly from Sun Oct 25.',
          },
        ],
      }),
    },
  ]

  const stack = peptides.map(stampRestartPeptide)

  const recompPlan: RecompPlan = {
    generatedAt: new Date().toISOString(),
    definitionVersion: PROTOCOL_DEFINITION_VERSION,
    summary: [
      `90-Day research protocol · ${CYCLE_START_DATE} → 90 days`,
      `Start ${START_WEIGHT_LB} lb → goal ${GOAL_WEIGHT_LB} lb`,
      HONEST_OUTCOME_COPY,
      `Fat-loss drivers: ${FAT_LOSS_DRIVERS}`,
      `Muscle drivers: ${MUSCLE_DRIVERS}`,
      RESEARCH_DISCLAIMER,
      PROTOCOL_NOTE,
    ],
    nutritionNotes: [
      'Protein 200–240 g/day',
      'Calories start ~2000–2200, adjust by weekly average weight',
      'Aim 0.8–1.2 lb/week average. Faster usually means lean loss',
    ],
    trainingNotes: GUIDANCE_CARDS,
    checkInCadence:
      'Weigh-in every 7 days. Labs at baseline, week 4–6, and week 10–12.',
    reconstitutionReminder:
      'U-100: 100 units = 1 mL. Confirm Test mg/mL and whether KLOW is 10 mg or 80 mg before locking units.',
  }

  const vials = stack.map((p) => ({
    id: `vial-${p.id}`,
    name: p.name,
    compound: p.name,
    productMg: p.protocol?.vialMg ?? null,
    diluentMl: p.protocol?.bacWaterMl ?? null,
    concentrationMgPerMl: p.protocol?.concentrationMgPerMl ?? null,
    remainingMl: p.protocol?.bacWaterMl ?? null,
    remainingUnits: p.protocol ? p.protocol.bacWaterMl * 100 : null,
    syringe: p.id === 'test-cyp' ? 'volume (mL)' : 'U-100',
    notes: p.notes,
  }))

  void startDate
  return { peptides: stack, recompPlan, vials }
}

export function isLxrdgatsbyUser(
  username?: string | null,
  email?: string | null,
): boolean {
  const values = [username, email]
    .map((v) => (v ?? '').trim().toLowerCase())
    .filter(Boolean)
  if (values.some((v) => v === 'itsgatsby@protonmail.com')) return true
  return values.some(
    (v) => v === SEED_USER || v.includes('lxrdgatsby') || v.split('@')[0] === SEED_USER
  )
}

export function hasSeededProtocol(): boolean {
  try {
    return readLocal(SEED_FLAG) === 'true'
  } catch {
    return false
  }
}

function writeLegacyKeys(startDate: string, state: TrackerState, vials: unknown[]) {
  try {
    const existingStart = readLocal('protocolStartDate')
    if (!existingStart) writeLocal('protocolStartDate', startDate)
    writeLocal('activeStack', JSON.stringify(state.peptides))
    writeLocal('vials', JSON.stringify(vials))
    writeLocal('scheduledDoses', JSON.stringify(state.peptides))
    if (readLocal('checkIns') == null) {
      writeLocal('checkIns', '[]')
    }
    writeLocal('startWeight', String(START_WEIGHT_LB))
    writeLocal('targetWeight', String(GOAL_WEIGHT_LB))
    writeLocal('goalNote', HONEST_OUTCOME_COPY)
    writeLocal('disclaimer', RESEARCH_DISCLAIMER)
    writeLocal('phaseNotes', JSON.stringify(PHASE_NOTES))
    writeLocal('safetyCopy', SAFETY_COPY)
    writeLocal('protocolDefinitionVersion', PROTOCOL_DEFINITION_VERSION)
    writeLocal(SEED_FLAG, 'true')
    saveState(state)
    writeLocal(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore quota */
  }
}

function hasStack(state: TrackerState): boolean {
  return (
    state.peptides.some((p) => p.id === 'test-cyp') &&
    state.peptides.some((p) => p.id === 'klow')
  )
}

/** First-time seed only. Never overwrites logs or an existing start date. */
export function applyLxrdgatsbyProtocolSeed(
  current: TrackerState,
  username?: string | null,
  email?: string | null,
): TrackerState | null {
  if (typeof localStorage === 'undefined') return null
  if (!isLxrdgatsbyUser(username, email)) return null
  if (hasStack(current)) {
    try {
      writeLocal(SEED_FLAG, 'true')
    } catch {
      /* ignore */
    }
    return null
  }
  if (hasSeededProtocol()) return null

  const existingStart =
    current.profile.startDate && current.profile.startDate.startsWith('20')
      ? current.profile.startDate
      : CYCLE_START_DATE
  const { peptides, recompPlan, vials } = buildLxrdgatsbyStack(existingStart)
  const next = applyLxrdWeightTargets({
    ...current,
    profile: {
      ...current.profile,
      currentWeight: current.profile.currentWeight || CURRENT_WEIGHT_LB,
      goalWeight: GOAL_WEIGHT_LB,
      startWeight: START_WEIGHT_LB,
      startDate: existingStart,
      weeklyLossTarget: WEEKLY_LOSS_LB,
    },
    peptides,
    recompPlan,
    injectionLogs: current.injectionLogs ?? [],
    weightHistory: current.weightHistory ?? [],
    workoutCompletions: current.workoutCompletions ?? [],
  })
  writeLegacyKeys(existingStart, next, vials)
  return next
}

export function stackNeedsDefinitionRefresh(state: TrackerState): boolean {
  if (!hasStack(state)) return false
  if (state.recompPlan?.definitionVersion === PROTOCOL_DEFINITION_VERSION) {
    return false
  }
  return true
}

/**
 * Update names / timing / units / titration going forward.
 * Keeps start date, injection logs, Mark Done, weight, workouts.
 */
export function refreshProtocolDefinition(
  current: TrackerState,
  username?: string | null,
  email?: string | null,
): TrackerState | null {
  if (!isLxrdgatsbyUser(username, email)) return null
  const removedPeptides = removedPeptideIdSet(current.removedPeptideIds)
  const endedPeptides = current.peptides.map((peptide) =>
    removedPeptides.has(peptide.id) ? endPeptideNow(peptide) : peptide
  )
  const endedState =
    endedPeptides.some((peptide, index) => peptide !== current.peptides[index])
      ? { ...current, peptides: endedPeptides }
      : current

  if (!stackNeedsDefinitionRefresh(endedState) && hasStack(endedState)) {
    const tesa = endedState.peptides.find((p) => p.id === 'tesamorelin')
    const hasLaterPhases = tesa?.protocol?.titration.some((t) =>
      t.weeks.startsWith('5') || t.weeks.startsWith('9')
    )
    if (hasLaterPhases) return endedState === current ? null : endedState
  }

  const startDate =
    endedState.profile.startDate && /^\d{4}-\d{2}-\d{2}/.test(endedState.profile.startDate)
      ? endedState.profile.startDate.slice(0, 10)
      : CYCLE_START_DATE

  const { peptides: fresh, recompPlan, vials } = buildLxrdgatsbyStack(startDate)
  const freshById = new Map(fresh.map((p) => [p.id, p]))

  const merged: Peptide[] = endedState.peptides.map((old) => {
    if (removedPeptides.has(old.id)) return old
    const next = freshById.get(old.id)
    if (!next) return old
    if (!next.protocol) return next
    return {
      ...next,
      protocol: {
        ...next.protocol,
        reconstituted: old.protocol?.reconstituted ?? next.protocol.reconstituted,
      },
    }
  })
  for (const p of fresh) {
    if (removedPeptides.has(p.id)) continue
    if (merged.some((m) => m.id === p.id)) continue
    if (p.id === 'amino1mq') {
      const ssIdx = merged.findIndex((m) => m.id === 'ss31')
      if (ssIdx >= 0) {
        merged.splice(ssIdx + 1, 0, p)
        continue
      }
    }
    if (p.id === 'reta-cagri') {
      const retaIdx = merged.findIndex((m) => m.id === 'retatrutide')
      if (retaIdx >= 0) {
        merged.splice(retaIdx + 1, 0, p)
        continue
      }
    }
    merged.push(p)
  }

  const next = applyLxrdWeightTargets(
    withNadHorizon({
      ...endedState,
      profile: {
        ...endedState.profile,
        startDate,
        startWeight: START_WEIGHT_LB,
        goalWeight: GOAL_WEIGHT_LB,
        weeklyLossTarget: WEEKLY_LOSS_LB,
      },
      peptides: merged,
      recompPlan: {
        ...recompPlan,
        generatedAt: endedState.recompPlan?.generatedAt ?? recompPlan.generatedAt,
      },
      injectionLogs: endedState.injectionLogs ?? [],
      weightHistory: endedState.weightHistory ?? [],
      workoutCompletions: endedState.workoutCompletions ?? [],
    })
  )

  try {
    const existingStart = readLocal('protocolStartDate')
    if (!existingStart) writeLocal('protocolStartDate', startDate)
    writeLocal('activeStack', JSON.stringify(next.peptides))
    const existingVialsRaw = readLocal('vials')
    let mergedVials = vials
    if (existingVialsRaw) {
      try {
        const existingVials = JSON.parse(existingVialsRaw) as Array<
          Record<string, unknown> & { id?: string; remainingMl?: number; remainingUnits?: number }
        >
        mergedVials = vials.map((v) => {
          const prev = existingVials.find((row) => row.id === v.id)
          if (!prev) return v
          return {
            ...v,
            remainingMl: prev.remainingMl ?? v.remainingMl,
            remainingUnits: prev.remainingUnits ?? v.remainingUnits,
          }
        })
      } catch {
        mergedVials = vials
      }
    }
    writeLocal('vials', JSON.stringify(mergedVials))
    writeLocal('startWeight', String(START_WEIGHT_LB))
    writeLocal('targetWeight', String(GOAL_WEIGHT_LB))
    writeLocal('goalNote', HONEST_OUTCOME_COPY)
    writeLocal('disclaimer', RESEARCH_DISCLAIMER)
    writeLocal('phaseNotes', JSON.stringify(PHASE_NOTES))
    writeLocal('safetyCopy', SAFETY_COPY)
    writeLocal('protocolDefinitionVersion', PROTOCOL_DEFINITION_VERSION)
    writeLocal(SEED_FLAG, 'true')
    saveState(next)
  } catch {
    /* ignore quota */
  }

  return next
}
