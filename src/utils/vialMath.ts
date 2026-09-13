import type { Vial } from '../types/v2'

/** Concentration (mg/mL) from powder amount and BAC water volume. */
export function calcConcentrationMgPerMl(
  vialMg: number,
  bacWaterMl: number
): number {
  if (!bacWaterMl || bacWaterMl <= 0 || !vialMg || vialMg <= 0) return 0
  return Math.round((vialMg / bacWaterMl) * 1000) / 1000
}

/**
 * U-100 insulin syringe: 100 units = 1 mL.
 * units = (doseMg / concentrationMgPerMl) * 100
 */
export function doseMgToUnits(
  doseMg: number,
  concentrationMgPerMl: number
): number {
  if (!concentrationMgPerMl || concentrationMgPerMl <= 0 || doseMg <= 0) return 0
  return Math.round((doseMg / concentrationMgPerMl) * 100 * 10) / 10
}

export function unitsToDoseMg(
  units: number,
  concentrationMgPerMl: number
): number {
  if (!concentrationMgPerMl || concentrationMgPerMl <= 0 || units <= 0) return 0
  return Math.round((units / 100) * concentrationMgPerMl * 1000) / 1000
}

/** Estimated remaining full doses at a given dose size. */
export function estimatedDosesLeft(vial: Vial, doseMg: number): number {
  if (!doseMg || doseMg <= 0 || vial.remainingMg <= 0) return 0
  return Math.floor(vial.remainingMg / doseMg)
}

export function formatMg(mg: number): string {
  if (mg >= 1) return `${Math.round(mg * 100) / 100} mg`
  return `${Math.round(mg * 1000)} mcg`
}
