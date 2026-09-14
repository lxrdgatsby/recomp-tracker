import { afterEach, describe, expect, it } from 'vitest'
import { buildLxrdgatsbyStack } from './protocolSeed'
import {
  buildLxrdgatsbyVials,
  VIAL_SEED_THROUGH,
} from './vialInventorySeed'
import { remainingDosesForVial } from '../utils/vialUsage'
import { getInjectionsForDate } from '../utils/peptideSchedule'

describe('lxrdgatsby vial inventory seed', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('seeds SS-31 empty A + active B at 45 mg / 18 doses', () => {
    const vials = buildLxrdgatsbyVials()
    const empty = vials.find((v) => v.id === 'vial-ss31-a')!
    const active = vials.find((v) => v.id === 'vial-ss31-b')!
    expect(empty.depleted).toBe(true)
    expect(empty.remainingMg).toBe(0)
    expect(empty.finishedAt).toBe('2026-09-13')
    expect(active.depleted).toBe(false)
    expect(active.remainingMg).toBe(45)
    expect(active.mixedDate).toBe('2026-09-13')
    expect(active.bacWaterMl).toBe(3)
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const ss31 = peptides.find((p) => p.id === 'ss31')!
    expect(
      remainingDosesForVial(active, ss31, '2026-08-23', new Date(2026, 8, 14))
    ).toBe(18)
  })

  it('seeds AOD empty A + active 10 mg / 2 mL B at 8 mg / 8 doses', () => {
    const vials = buildLxrdgatsbyVials()
    const empty = vials.find((v) => v.id === 'vial-aod-a')!
    const active = vials.find((v) => v.id === 'vial-aod-b')!
    expect(empty.depleted).toBe(true)
    expect(empty.bacWaterMl).toBe(3)
    expect(active.bacWaterMl).toBe(2)
    expect(active.concentrationMgPerMl).toBe(5)
    expect(active.remainingMg).toBe(8)
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const aod = peptides.find((p) => p.id === 'aod9604')!
    expect(
      remainingDosesForVial(active, aod, '2026-08-23', new Date(2026, 8, 14))
    ).toBe(8)
  })

  it('seeds 5-Amino-1MQ mixed Sept 14 at 50 mg with first use Sept 15', () => {
    const vials = buildLxrdgatsbyVials()
    const amino = vials.find((v) => v.id === 'vial-amino1mq-a')!
    expect(amino.mixedDate).toBe('2026-09-14')
    expect(amino.remainingMg).toBe(50)
    expect(amino.depleted).toBe(false)
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const peptide = peptides.find((p) => p.id === 'amino1mq')!
    const sept14 = getInjectionsForDate(
      peptides,
      new Date(2026, 8, 14),
      '2026-08-23'
    )
    expect(sept14.some((s) => s.peptideId === 'amino1mq')).toBe(false)
    const left = remainingDosesForVial(
      amino,
      peptide,
      '2026-08-23',
      new Date(2026, 8, 14)
    )
    expect(left).toBe(11)
  })

  it('marks Reta / BPC / KLOW empty and Tesamorelin almost empty', () => {
    const vials = buildLxrdgatsbyVials()
    expect(vials.find((v) => v.id === 'vial-reta-a')?.depleted).toBe(true)
    expect(vials.find((v) => v.id === 'vial-bpc-a')?.depleted).toBe(true)
    expect(vials.find((v) => v.id === 'vial-klow-a')?.depleted).toBe(true)
    const tesa = vials.find((v) => v.id === 'vial-tesa-a')!
    expect(tesa.depleted).toBe(false)
    expect(tesa.remainingMg).toBe(0.5)
    expect(vials.find((v) => v.id === 'vial-ghk-a')?.remainingMg).toBe(77)
    expect(vials.find((v) => v.id === 'vial-mots-a')?.remainingMg).toBe(5.5)
    expect(vials.find((v) => v.id === 'vial-nad-a')?.remainingMg).toBe(550)
    expect(vials.find((v) => v.id === 'vial-test-a')?.drawsUsed).toBe(4)
    expect(vials.find((v) => v.id === 'vial-test-a')?.depleted).toBe(false)
  })

  it('does not invent a second Reta vial', () => {
    const reta = buildLxrdgatsbyVials().filter((v) => v.compoundId === 'retatrutide')
    expect(reta).toHaveLength(1)
    expect(reta[0].depleted).toBe(true)
  })

  it('accounts scheduled use through Sept 14', () => {
    expect(VIAL_SEED_THROUGH).toBe('2026-09-14')
  })
})
