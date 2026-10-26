import type { BacWaterUnits } from '../types'

export const RECONSTITUTION_FAQ_QUESTION =
  'How to Reconstitute My Peptides?' as const

export interface BacWaterGuideRow {
  vialMg: number
  units: BacWaterUnits
  ml: number
}

/** 80 mg vial + 3.0 mL BAC. Exact draw is 3.75 units per mg; show ~4. */
export const EIGHTY_MG_VIAL = 80
export const EIGHTY_MG_BAC_ML = 3
export const EIGHTY_MG_CONCENTRATION = 26.67
export const EIGHTY_MG_UNITS_EXACT = 3.75
export const EIGHTY_MG_UNITS_DISPLAY = 4

export const EIGHTY_MG_ONBOARDING_NOTE =
  '80 mg vial + 3 mL BAC ≈ 26.67 mg/mL. 1 mg ≈ 4 units.'

export const EIGHTY_MG_CONCENTRATION_LINE =
  'Concentration = 80 mg ÷ 3 mL = 26.67 mg/mL'

export const EIGHTY_MG_UNITS_LINE =
  'Units for desired mg = (desired_mg / 26.67) * 100'

export const EIGHTY_MG_UNITS_NOTE =
  '1 mg ≈ 3.75 units on U-100 (display as ~4 units).'

/** Display + onboarding table. U-100: 100 units = 1 mL. */
export const BAC_WATER_GUIDE_ROWS: BacWaterGuideRow[] = [
  { vialMg: 5, units: 100, ml: 1 },
  { vialMg: 10, units: 200, ml: 2 },
  { vialMg: 15, units: 300, ml: 3 },
  { vialMg: 20, units: 300, ml: 3 },
  { vialMg: 50, units: 300, ml: 3 },
  { vialMg: 80, units: 300, ml: 3 },
  { vialMg: 100, units: 300, ml: 3 },
  { vialMg: 1000, units: 500, ml: 5 },
]

export function formatBacWaterGuideLine(row: BacWaterGuideRow): string {
  return `${row.vialMg}mg vial: ${row.units} units (${row.ml}mL)`
}

export function formatBacWaterGuideCompact(): string {
  return BAC_WATER_GUIDE_ROWS.map(
    (row) => `${row.vialMg}mg → ${row.units}u (${row.ml}mL)`
  ).join(', ')
}

export const BAC_WATER_GUIDE_TEXT = BAC_WATER_GUIDE_ROWS.map(
  formatBacWaterGuideLine
).join('\n')

/**
 * Standard BAC pairing used by onboarding, vial defaults, and the calculator.
 * 5mg → 1mL, 10mg → 2mL, 15–999mg → 3mL, 1000mg+ → 5mL.
 */
export function recommendedBacWaterUnitsForVialMg(vialMg: number): BacWaterUnits {
  if (!Number.isFinite(vialMg) || vialMg <= 0) return 200
  if (vialMg >= 1000) return 500
  if (vialMg <= 5) return 100
  if (vialMg <= 10) return 200
  return 300
}
