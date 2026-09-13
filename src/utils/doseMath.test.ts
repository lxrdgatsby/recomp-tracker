import { describe, expect, it } from 'vitest'
import {
  formatUnits,
  mlFromU100Units,
  testCypInsulinUnits,
  testCypMgFromMl,
  u100UnitsFromMg,
} from './doseMath'

describe('dose calculator reconstitution math', () => {
  it('Tesamorelin 0.5 / 1.0 / 1.4 / 2.0 mg → 7.5 / 15 / 21 / 30 units', () => {
    expect(u100UnitsFromMg(0.5, 20, 3)).toBe(7.5)
    expect(u100UnitsFromMg(1.0, 20, 3)).toBe(15)
    expect(u100UnitsFromMg(1.4, 20, 3)).toBe(21)
    expect(u100UnitsFromMg(2.0, 20, 3)).toBe(30)
  })

  it('Reta 2.5 / 4 / 5 mg → 50 / 80 / 100 units', () => {
    expect(u100UnitsFromMg(2.5, 10, 2)).toBe(50)
    expect(u100UnitsFromMg(4, 10, 2)).toBe(80)
    expect(u100UnitsFromMg(5, 10, 2)).toBe(100)
  })

  it('BPC-157 500 mcg → 10 units', () => {
    expect(u100UnitsFromMg(0.5, 10, 2)).toBe(10)
  })

  it('AOD 0.5 / 1.0 mg → 15 / 30 units', () => {
    expect(u100UnitsFromMg(0.5, 10, 3)).toBe(15)
    expect(u100UnitsFromMg(1.0, 10, 3)).toBe(30)
  })

  it('SS-31 2.5 / 5 mg → 15 / 30 units', () => {
    expect(u100UnitsFromMg(2.5, 50, 3)).toBe(15)
    expect(u100UnitsFromMg(5, 50, 3)).toBe(30)
  })

  it('GHK-Cu 1 / 2 mg → 3 / 6 units', () => {
    expect(u100UnitsFromMg(1, 100, 3)).toBe(3)
    expect(u100UnitsFromMg(2, 100, 3)).toBe(6)
  })

  it('KLOW 0.5 / 1.0 mg → 15 / 30 units', () => {
    expect(u100UnitsFromMg(0.5, 10, 3)).toBe(15)
    expect(u100UnitsFromMg(1.0, 10, 3)).toBe(30)
  })

  it('MOTS-c 0.5 / 1.0 mg → 15 / 30 units', () => {
    expect(u100UnitsFromMg(0.5, 10, 3)).toBe(15)
    expect(u100UnitsFromMg(1.0, 10, 3)).toBe(30)
  })

  it('NAD+ 50 / 100 mg → 25 / 50 units', () => {
    expect(u100UnitsFromMg(50, 1000, 5)).toBe(25)
    expect(u100UnitsFromMg(100, 1000, 5)).toBe(50)
  })

  it('does not invent numbers when vial or BAC is blank', () => {
    expect(u100UnitsFromMg(1, 0, 3)).toBeNull()
    expect(u100UnitsFromMg(1, 20, 0)).toBeNull()
    expect(u100UnitsFromMg(1, Number.NaN, 3)).toBeNull()
  })

  it('Test Cyp 0.75 mL is volume, with optional mg from 200 vs 250', () => {
    expect(testCypMgFromMl(0.75, 200)).toBe(150)
    expect(testCypMgFromMl(0.75, 250)).toBe(187.5)
    expect(testCypInsulinUnits(0.75)).toBe(75)
  })

  it('formats half units and mL', () => {
    expect(formatUnits(7.5)).toBe('7.5')
    expect(formatUnits(15)).toBe('15')
    expect(mlFromU100Units(15)).toBe(0.15)
    expect(mlFromU100Units(50)).toBe(0.5)
  })
})
