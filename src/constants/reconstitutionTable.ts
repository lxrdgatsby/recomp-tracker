/** Source of truth for Dose Calculator + 90-day protocol draws. U-100: 100 units = 1 mL. */

export const CYCLE_START_DATE = '2026-08-23'
export const AMINO_1MQ_START_DATE = '2026-09-15'
export const AMINO_1MQ_FULL_DOSE_DATE = '2026-09-17'
export const DSIP_START_DATE = '2026-10-25'
export const START_WEIGHT_LB = 165
export const GOAL_WEIGHT_LB = 145
/** Latest known weigh-in. A newer log replaces this. */
export const CURRENT_WEIGHT_LB = 156
export const WEIGHT_AS_OF = '2026-10-21'
/** 20 lb over 90 days. */
export const WEEKLY_LOSS_LB = 1.6

export const RESEARCH_DISCLAIMER =
  'Research-use / compounding stack tracker. Not a medically supervised protocol. Tesamorelin and testosterone are prescription drugs with labeled uses; retatrutide is still investigational; other compounds have limited or no approved human recomp dosing. This app maps math + published ranges. Get labs and a clinician before changing doses.'

export const HONEST_OUTCOME_COPY =
  'Scale target is −20 lb (~1.6 lb/week). Muscle target is preserve lean / maybe +2–4 lb. 7% BF is a stretch; 9–12% is the realistic landing.'

export const FAT_LOSS_DRIVERS = 'Retatrutide + food + steps'
export const MUSCLE_DRIVERS = 'Test + Tesamorelin + progressive overload + protein'

export const KLOW_NOTE =
  'Classic KLOW is often an 80 mg blend. This plan treats the vial as 10 mg. If the label is 80 mg, units are wrong. Standalone BPC-157 is already in the stack — if KLOW also contains BPC, user is stacking BPC twice. Keep standalone BPC at 500 mcg and KLOW conservative.'

export const DSIP_NOTE =
  'Research-use only. Published human data is mostly IV; SC is community practice. 10 mg vial + 2.0 mL BAC = 5 mg/mL. Conservative start 100 mcg = 2 units on U-100 (or 250 mcg = 5 units). 30–60 min before bed. Nightly or 5 nights/week. units = (desired_mcg / 5000) * 100.'

/** Library default. lxrdgatsby’s saved 10 mg vial keeps KLOW_NOTE. */
export const KLOW_80_NOTE =
  '80 mg / 3 mL BAC ≈ 26.67 mg/mL. 1 mg ≈ 3.75 units on U-100 (4 units on the half-unit draw). You can override units on the form.'

export const U100_FORMULA = 'units = (desired_mg / (vial_mg / bac_ml)) * 100'

export type DoseUnit = 'mg' | 'mcg' | 'ml'

export interface KeyDraw {
  label: string
  desiredMg: number
  units: number
}

export interface ReconstitutionCompound {
  id: string
  name: string
  vialMg: number | null
  bacMl: number | null
  concentrationLabel: string
  /** Default desired dose in mg (mcg stored as mg). Test Cyp uses mL instead. */
  defaultDoseMg: number | null
  defaultDoseMl: number | null
  doseUnit: DoseUnit
  keyDraws: KeyDraw[]
  isTestCyp?: boolean
  /** Shown under the calculator when this compound is selected. */
  note?: string
}

export const RECONSTITUTION_TABLE: ReconstitutionCompound[] = [
  {
    id: 'retatrutide',
    name: 'Reta',
    vialMg: 10,
    bacMl: 2,
    concentrationLabel: '5 mg/mL',
    defaultDoseMg: 2.5,
    defaultDoseMl: null,
    doseUnit: 'mg',
    keyDraws: [
      { label: '10 u = 0.5 mg', desiredMg: 0.5, units: 10 },
      { label: '50 u = 2.5 mg', desiredMg: 2.5, units: 50 },
      { label: '80 u = 4 mg', desiredMg: 4, units: 80 },
      { label: '100 u = 5 mg', desiredMg: 5, units: 100 },
    ],
  },
  {
    id: 'reta-cagri',
    name: 'Reta + Cagrilintide',
    vialMg: 10,
    bacMl: 3,
    concentrationLabel: '3.33 mg/mL',
    defaultDoseMg: 1.5,
    defaultDoseMl: null,
    doseUnit: 'mg',
    keyDraws: [
      { label: '45 u ≈ 1.5 mg', desiredMg: 1.5, units: 45 },
      { label: '75 u ≈ 2.5 mg', desiredMg: 2.5, units: 75 },
      { label: '120 u ≈ 4 mg', desiredMg: 4, units: 120 },
    ],
  },
  {
    id: 'tesamorelin',
    name: 'Tesamorelin',
    vialMg: 20,
    bacMl: 3,
    concentrationLabel: '6.67 mg/mL',
    defaultDoseMg: 1,
    defaultDoseMl: null,
    doseUnit: 'mg',
    keyDraws: [
      { label: '7.5 u ≈ 0.5 mg', desiredMg: 0.5, units: 7.5 },
      { label: '15 u = 1.0 mg', desiredMg: 1, units: 15 },
      { label: '21 u ≈ 1.4 mg', desiredMg: 1.4, units: 21 },
      { label: '30 u = 2.0 mg', desiredMg: 2, units: 30 },
    ],
  },
  {
    id: 'bpc157',
    name: 'BPC-157',
    vialMg: 10,
    bacMl: 2,
    concentrationLabel: '5 mg/mL',
    defaultDoseMg: 0.5,
    defaultDoseMl: null,
    doseUnit: 'mcg',
    keyDraws: [{ label: '10 u = 500 mcg', desiredMg: 0.5, units: 10 }],
  },
  {
    id: 'aod9604',
    name: 'AOD-9604',
    vialMg: 10,
    bacMl: 2,
    concentrationLabel: '5 mg/mL',
    defaultDoseMg: 1,
    defaultDoseMl: null,
    doseUnit: 'mg',
    keyDraws: [
      { label: '10 u = 0.5 mg', desiredMg: 0.5, units: 10 },
      { label: '20 u = 1.0 mg', desiredMg: 1, units: 20 },
    ],
  },
  {
    id: 'ss31',
    name: 'SS-31 (Elamipretide)',
    vialMg: 50,
    bacMl: 3,
    concentrationLabel: '16.67 mg/mL',
    defaultDoseMg: 2.5,
    defaultDoseMl: null,
    doseUnit: 'mg',
    keyDraws: [
      { label: '15 u = 2.5 mg', desiredMg: 2.5, units: 15 },
      { label: '30 u = 5 mg', desiredMg: 5, units: 30 },
      { label: '60 u = 10 mg', desiredMg: 10, units: 60 },
    ],
  },
  {
    id: 'amino1mq',
    name: '5-Amino-1MQ',
    vialMg: 50,
    bacMl: 3,
    concentrationLabel: '16.67 mg/mL',
    defaultDoseMg: 2.5,
    defaultDoseMl: null,
    doseUnit: 'mg',
    keyDraws: [
      { label: '15 u = 2.5 mg', desiredMg: 2.5, units: 15 },
      { label: '30 u = 5 mg', desiredMg: 5, units: 30 },
    ],
  },
  {
    id: 'ghkcu',
    name: 'GHK-Cu',
    vialMg: 100,
    bacMl: 3,
    concentrationLabel: '33.3 mg/mL',
    defaultDoseMg: 1,
    defaultDoseMl: null,
    doseUnit: 'mg',
    keyDraws: [
      { label: '3 u ≈ 1 mg', desiredMg: 1, units: 3 },
      { label: '6 u ≈ 2 mg', desiredMg: 2, units: 6 },
    ],
  },
  {
    id: 'klow',
    name: 'KLOW',
    vialMg: 80,
    bacMl: 3,
    concentrationLabel: '26.67 mg/mL',
    defaultDoseMg: 1,
    defaultDoseMl: null,
    doseUnit: 'mg',
    keyDraws: [{ label: '4 u ≈ 1 mg (precise 3.75)', desiredMg: 1, units: 4 }],
    note: KLOW_80_NOTE,
  },
  {
    id: 'motsc',
    name: 'MOTS-c',
    vialMg: 40,
    bacMl: 3,
    concentrationLabel: '13.33 mg/mL',
    defaultDoseMg: 0.5,
    defaultDoseMl: null,
    doseUnit: 'mg',
    keyDraws: [{ label: '4 u ≈ 0.5 mg', desiredMg: 0.5, units: 4 }],
  },
  {
    id: 'nad',
    name: 'NAD+',
    vialMg: 1000,
    bacMl: 5,
    concentrationLabel: '200 mg/mL',
    defaultDoseMg: 50,
    defaultDoseMl: null,
    doseUnit: 'mg',
    keyDraws: [
      { label: '25 u = 50 mg', desiredMg: 50, units: 25 },
      { label: '50 u = 100 mg', desiredMg: 100, units: 50 },
    ],
  },
  {
    id: 'selank-semax',
    name: 'Selank + Semax',
    vialMg: 10,
    bacMl: 3,
    concentrationLabel: '3.33 mg/mL each',
    defaultDoseMg: 0.25,
    defaultDoseMl: null,
    doseUnit: 'mcg',
    keyDraws: [
      { label: '7.5 u ≈ 250 mcg each', desiredMg: 0.25, units: 7.5 },
      { label: '15 u ≈ 500 mcg each', desiredMg: 0.5, units: 15 },
    ],
    note:
      'Human data is primarily nasal. No published human SC trials. Research-use only. Start 250 mcg of each (~7.5–8 u) once daily and hold 1–2 weeks.',
  },
  {
    id: 'dsip',
    name: 'DSIP',
    vialMg: 10,
    bacMl: 2,
    concentrationLabel: '5 mg/mL',
    defaultDoseMg: 0.1,
    defaultDoseMl: null,
    doseUnit: 'mcg',
    keyDraws: [
      { label: '2 u = 100 mcg', desiredMg: 0.1, units: 2 },
      { label: '5 u = 250 mcg', desiredMg: 0.25, units: 5 },
      { label: '10 u = 500 mcg', desiredMg: 0.5, units: 10 },
    ],
    note: DSIP_NOTE,
  },
  {
    id: 'test-cyp',
    name: 'Test Cyp',
    vialMg: null,
    bacMl: null,
    concentrationLabel: 'USER LABEL',
    defaultDoseMg: null,
    defaultDoseMl: 0.75,
    doseUnit: 'ml',
    keyDraws: [],
    isTestCyp: true,
  },
]

export const GUIDANCE_CARDS = [
  'Driver of fat loss: Retatrutide + deficit + steps',
  'Driver of muscle: Test + Tesamorelin + progressive overload + 200–240 g protein',
  'Calories: start ~2000–2200, adjust by weekly average weight',
  'Aim 0.8–1.2 lb/week average. Faster usually means lean loss',
  'Weigh-in every 7 days',
  'Only advance Reta every 4 weeks, not weekly',
  'Only advance Tesamorelin if sides are manageable and glucose is stable',
  'Labs: CBC, CMP, fasting glucose + insulin or HbA1c, lipids, IGF-1, total/free T, estradiol, prolactin if symptomatic, hs-CRP — baseline, week 4–6, week 10–12',
  'Tesamorelin contraindication note: active malignancy / disrupted pituitary axis; it raises IGF-1',
  '5-Amino-1MQ is NAD+/NNMT support on top of NAD+ already in the stack — overlap, not a second fat-loss drug. Drivers stay Reta + food + steps for fat, Test + Tesamorelin + lifting for muscle.',
]

export function getReconstitutionCompound(
  id: string
): ReconstitutionCompound | undefined {
  return RECONSTITUTION_TABLE.find((c) => c.id === id)
}
