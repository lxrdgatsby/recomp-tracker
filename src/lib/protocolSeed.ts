import { STORAGE_KEY } from '../constants/defaults'
import {
  AMINO_1MQ_FULL_DOSE_DATE,
  AMINO_1MQ_START_DATE,
  CYCLE_START_DATE,
  FAT_LOSS_DRIVERS,
  GOAL_WEIGHT_LB,
  GUIDANCE_CARDS,
  HONEST_OUTCOME_COPY,
  KLOW_NOTE,
  MUSCLE_DRIVERS,
  RESEARCH_DISCLAIMER,
  START_WEIGHT_LB,
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

export const SEED_USER = 'lxrdgatsby'
export const SEED_FLAG = 'protocolSeeded_lxrdgatsby'
export const PROTOCOL_DEFINITION_VERSION = '2026-09-14-aod20-vials-v5'
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
  ]

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

  const vials = peptides.map((p) => ({
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
    const existingStart = localStorage.getItem('protocolStartDate')
    if (!existingStart) localStorage.setItem('protocolStartDate', startDate)
    localStorage.setItem('activeStack', JSON.stringify(state.peptides))
    localStorage.setItem('vials', JSON.stringify(vials))
    localStorage.setItem('scheduledDoses', JSON.stringify(state.peptides))
    if (localStorage.getItem('checkIns') == null) {
      localStorage.setItem('checkIns', '[]')
    }
    if (localStorage.getItem('startWeight') == null) {
      localStorage.setItem('startWeight', String(START_WEIGHT_LB))
    }
    if (localStorage.getItem('targetWeight') == null) {
      localStorage.setItem('targetWeight', String(GOAL_WEIGHT_LB))
    }
    localStorage.setItem('goalNote', HONEST_OUTCOME_COPY)
    localStorage.setItem('disclaimer', RESEARCH_DISCLAIMER)
    localStorage.setItem('phaseNotes', JSON.stringify(PHASE_NOTES))
    localStorage.setItem('safetyCopy', SAFETY_COPY)
    localStorage.setItem('protocolDefinitionVersion', PROTOCOL_DEFINITION_VERSION)
    localStorage.setItem(SEED_FLAG, 'true')
    saveState(state)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
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
): TrackerState | null {
  if (typeof localStorage === 'undefined') return null
  if (username && !isLxrdgatsbyUser(username)) return null
  if (hasStack(current)) {
    try {
      localStorage.setItem(SEED_FLAG, 'true')
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
  const next: TrackerState = {
    ...current,
    profile: {
      ...current.profile,
      currentWeight: current.profile.currentWeight || START_WEIGHT_LB,
      goalWeight: current.profile.goalWeight || GOAL_WEIGHT_LB,
      startDate: existingStart,
      weeklyLossTarget: current.profile.weeklyLossTarget || 1.2,
    },
    peptides,
    recompPlan,
    injectionLogs: current.injectionLogs ?? [],
    weightHistory: current.weightHistory ?? [],
    workoutCompletions: current.workoutCompletions ?? [],
  }
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
): TrackerState | null {
  if (username && !isLxrdgatsbyUser(username)) return null
  if (!hasStack(current) && !isLxrdgatsbyUser(username)) return null
  if (!stackNeedsDefinitionRefresh(current) && hasStack(current)) {
    const tesa = current.peptides.find((p) => p.id === 'tesamorelin')
    const hasLaterPhases = tesa?.protocol?.titration.some((t) =>
      t.weeks.startsWith('5') || t.weeks.startsWith('9')
    )
    if (hasLaterPhases) return null
  }

  const startDate =
    current.profile.startDate && /^\d{4}-\d{2}-\d{2}/.test(current.profile.startDate)
      ? current.profile.startDate.slice(0, 10)
      : CYCLE_START_DATE

  const { peptides: fresh, recompPlan, vials } = buildLxrdgatsbyStack(startDate)
  const freshById = new Map(fresh.map((p) => [p.id, p]))

  const merged: Peptide[] = current.peptides.map((old) => {
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
    if (merged.some((m) => m.id === p.id)) continue
    if (p.id === 'amino1mq') {
      const ssIdx = merged.findIndex((m) => m.id === 'ss31')
      if (ssIdx >= 0) {
        merged.splice(ssIdx + 1, 0, p)
        continue
      }
    }
    merged.push(p)
  }

  const next: TrackerState = {
    ...current,
    profile: {
      ...current.profile,
      startDate,
      goalWeight: current.profile.goalWeight || GOAL_WEIGHT_LB,
    },
    peptides: merged,
    recompPlan: {
      ...recompPlan,
      generatedAt: current.recompPlan?.generatedAt ?? recompPlan.generatedAt,
    },
    injectionLogs: current.injectionLogs ?? [],
    weightHistory: current.weightHistory ?? [],
    workoutCompletions: current.workoutCompletions ?? [],
  }

  try {
    const existingStart = localStorage.getItem('protocolStartDate')
    if (!existingStart) localStorage.setItem('protocolStartDate', startDate)
    localStorage.setItem('activeStack', JSON.stringify(next.peptides))
    const existingVialsRaw = localStorage.getItem('vials')
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
    localStorage.setItem('vials', JSON.stringify(mergedVials))
    localStorage.setItem('goalNote', HONEST_OUTCOME_COPY)
    localStorage.setItem('disclaimer', RESEARCH_DISCLAIMER)
    localStorage.setItem('phaseNotes', JSON.stringify(PHASE_NOTES))
    localStorage.setItem('safetyCopy', SAFETY_COPY)
    localStorage.setItem('protocolDefinitionVersion', PROTOCOL_DEFINITION_VERSION)
    localStorage.setItem(SEED_FLAG, 'true')
    saveState(next)
  } catch {
    /* ignore quota */
  }

  return next
}
