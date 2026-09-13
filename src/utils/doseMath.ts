import { U100_FORMULA } from '../constants/reconstitutionTable'

/** U-100: 100 units = 1 mL. Half-unit precision so Tesamorelin 0.5 mg = 7.5 u. */
export function u100UnitsFromMg(
  desiredMg: number,
  vialMg: number,
  bacMl: number
): number | null {
  if (!(vialMg > 0) || !(bacMl > 0)) return null
  if (!Number.isFinite(desiredMg) || desiredMg < 0) return null
  const units = (desiredMg / (vialMg / bacMl)) * 100
  return Math.round(units * 2) / 2
}

export function mlFromU100Units(units: number): number {
  return Math.round((units / 100) * 10000) / 10000
}

export function formatUnits(units: number): string {
  if (Number.isInteger(units)) return String(units)
  return String(Math.round(units * 2) / 2)
}

export function mcgToMg(mcg: number): number {
  return mcg / 1000
}

export function testCypMgFromMl(
  doseMl: number,
  mgPerMl: 200 | 250
): number {
  return Math.round(doseMl * mgPerMl * 10) / 10
}

/** 0.75 mL on a 1 mL U-100 insulin syringe = 75 units. Never implied unless requested. */
export function testCypInsulinUnits(doseMl: number): number {
  return Math.round(doseMl * 100 * 2) / 2
}

export function doseFormulaCopy(): string {
  return U100_FORMULA
}
