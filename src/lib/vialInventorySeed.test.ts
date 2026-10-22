import { afterEach, describe, expect, it } from 'vitest'
import { buildLxrdgatsbyStack } from './protocolSeed'
import {
  applyLxrdgatsbyVialInventorySeed,
  buildLxrdgatsbyVials,
} from './vialInventorySeed'
import {
  addReplacementVial,
  applyVialToggle,
  getActiveVialForPeptide,
  isReplacedVial,
  recalculateVialInventory,
  remainingDosesForVial,
  retireVial,
  vialIdForDate,
} from '../utils/vialUsage'
import { getInjectionsForDate } from '../utils/peptideSchedule'
import type { InjectionLog } from '../types'

describe('lxrdgatsby vial inventory from logged doses', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('keeps SS-31 and AOD Vial A replaced even with no Done logs', () => {
    const vials = buildLxrdgatsbyVials()
    expect(vials.find((v) => v.id === 'vial-ss31-a')?.replacedAt).toBe('2026-09-13')
    expect(vials.find((v) => v.id === 'vial-aod-a')?.replacedAt).toBe('2026-09-13')
    expect(vials.find((v) => v.id === 'vial-ss31-b')?.remainingMg).toBe(0)
    expect(vials.find((v) => v.id === 'vial-ss31-b')?.replacedAt).toBe('2026-10-25')
    expect(vials.find((v) => v.id === 'vial-aod-b')?.remainingMg).toBe(0)
    expect(vials.find((v) => v.id === 'vial-aod-b')?.replacedAt).toBe('2026-10-25')
    expect(vials.find((v) => v.id === 'vial-aod-c')?.remainingMg).toBe(10)
    expect(vials.find((v) => v.id === 'vial-aod-c')?.bacWaterMl).toBe(2)
    expect(vials.find((v) => v.id === 'vial-reta-a')?.remainingMg).toBe(0)
    expect(vials.find((v) => v.id === 'vial-reta-a')?.replacedAt).toBe('2026-10-25')
    expect(vials.find((v) => v.id === 'vial-reta-b')?.remainingMg).toBe(0)
    expect(vials.find((v) => v.id === 'vial-reta-b')?.replacedAt).toBe('2026-10-25')
    expect(vials.find((v) => v.id === 'vial-reta-cagri')?.remainingMg).toBe(10)
    expect(vials.find((v) => v.id === 'vial-reta-cagri')?.bacWaterMl).toBe(3)
    expect(vials.find((v) => v.id === 'vial-amino1mq-a')?.replacedAt).toBe('2026-10-25')
    expect(vials.find((v) => v.id === 'vial-amino1mq-b')?.remainingMg).toBe(50)
    expect(vials.find((v) => v.id === 'vial-tesa-b')?.remainingMg).toBe(20)
    expect(vials.find((v) => v.id === 'vial-mots-b')?.remainingMg).toBe(40)
    expect(vials.find((v) => v.id === 'vial-nad-a')?.replacedAt).toBeUndefined()
    expect(vials.find((v) => v.id === 'vial-test-a')?.replacedAt).toBeUndefined()
  })

  it('only subtracts Done logs, not missed scheduled days', () => {
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const logs: InjectionLog[] = [
      { date: '2026-08-23', peptideId: 'ss31' },
      { date: '2026-08-24', peptideId: 'ss31' },
      { date: '2026-08-23', peptideId: 'aod9604' },
      { date: '2026-08-23', peptideId: 'retatrutide' },
      { date: '2026-08-23', peptideId: 'bpc157' },
      { date: '2026-08-23', peptideId: 'klow' },
    ]
    const vials = recalculateVialInventory({
      vials: buildLxrdgatsbyVials(),
      logs,
      peptides,
      startDate: '2026-08-23',
    })
    expect(vials.find((v) => v.id === 'vial-ss31-a')?.remainingMg).toBe(0)
    expect(vials.find((v) => v.id === 'vial-ss31-a')?.depleted).toBe(true)
    expect(vials.find((v) => v.id === 'vial-ss31-b')?.remainingMg).toBe(0)
    expect(vials.find((v) => v.id === 'vial-aod-a')?.remainingMg).toBe(0)
    expect(vials.find((v) => v.id === 'vial-aod-b')?.remainingMg).toBe(0)
    expect(vials.find((v) => v.id === 'vial-reta-a')?.remainingMg).toBe(0)
    expect(vials.find((v) => v.id === 'vial-reta-a')?.replacedAt).toBe('2026-10-25')
    expect(vials.find((v) => v.id === 'vial-reta-b')?.remainingMg).toBe(0)
    expect(vials.find((v) => v.id === 'vial-bpc-a')?.remainingMg).toBe(0)
    expect(vials.find((v) => v.id === 'vial-klow-a')?.remainingMg).toBe(0)
    expect(vials.find((v) => v.id === 'vial-ghk-a')?.remainingMg).toBe(100)
  })

  it('assigns pre-Sept 13 Done doses to Vial A and Sept 13+ to Vial B', () => {
    expect(vialIdForDate(buildLxrdgatsbyVials(), 'ss31', '2026-09-12')).toBe(
      'vial-ss31-a'
    )
    expect(vialIdForDate(buildLxrdgatsbyVials(), 'ss31', '2026-09-13')).toBe(
      'vial-ss31-b'
    )
    expect(vialIdForDate(buildLxrdgatsbyVials(), 'aod9604', '2026-09-12')).toBe(
      'vial-aod-a'
    )
    expect(vialIdForDate(buildLxrdgatsbyVials(), 'aod9604', '2026-09-13')).toBe(
      'vial-aod-b'
    )
    expect(vialIdForDate(buildLxrdgatsbyVials(), 'aod9604', '2026-10-25')).toBe(
      'vial-aod-c'
    )
  })

  it('keeps replacement vials and does not empty A when misses exist', () => {
    localStorage.clear()
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const next = applyLxrdgatsbyVialInventorySeed(
      {
        profile: {
          currentWeight: 175,
          goalWeight: 160,
          startDate: '2026-08-23',
          weeklyLossTarget: 1.2,
        },
        peptides,
        weightHistory: [],
        injectionLogs: [
          { date: '2026-08-23', peptideId: 'ss31' },
          { date: '2026-09-13', peptideId: 'ss31' },
        ],
        workoutCompletions: [],
      },
      'lxrdgatsby',
      null,
    )
    const a = next?.vialInventory?.find((v) => v.id === 'vial-ss31-a')
    const b = next?.vialInventory?.find((v) => v.id === 'vial-ss31-b')
    expect(a?.remainingMg).toBe(0)
    expect(a?.replacedAt).toBe('2026-09-13')
    expect(b?.remainingMg).toBe(0)
    expect(b?.replacedAt).toBe('2026-10-25')
    expect(next?.vialInventory?.find((v) => v.id === 'vial-amino1mq-a')?.replacedAt).toBe(
      '2026-10-25'
    )
    expect(next?.vialInventory?.find((v) => v.id === 'vial-amino1mq-b')?.remainingMg).toBe(50)
  })

  it('decrements Vial A when a missed pre-Sept 13 day is later marked Done', () => {
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const start = buildLxrdgatsbyVials()
    const first = applyVialToggle({
      vials: start,
      peptides,
      startDate: '2026-08-23',
      date: '2026-08-23',
      peptideId: 'ss31',
      turningOn: true,
      logs: [],
    })
    expect(first.vials.find((v) => v.id === 'vial-ss31-a')?.remainingMg).toBe(0)
    expect(first.vials.find((v) => v.id === 'vial-ss31-b')?.remainingMg).toBe(0)
    const second = applyVialToggle({
      vials: first.vials,
      peptides,
      startDate: '2026-08-23',
      date: '2026-09-14',
      peptideId: 'ss31',
      turningOn: true,
      logs: first.logs,
    })
    expect(second.vials.find((v) => v.id === 'vial-ss31-a')?.remainingMg).toBe(0)
    expect(second.vials.find((v) => v.id === 'vial-ss31-b')?.remainingMg).toBe(0)
    const fused = applyVialToggle({
      vials: second.vials,
      peptides,
      startDate: '2026-08-23',
      date: '2026-10-25',
      peptideId: 'reta-cagri',
      turningOn: true,
      logs: second.logs,
    })
    expect(fused.vials.find((v) => v.id === 'vial-reta-cagri')?.remainingMg).toBe(8.5)
    expect(fused.vials.find((v) => v.id === 'vial-reta-b')?.remainingMg).toBe(0)
  })

  it('Finished archives a live vial and Add replacement creates a new Mixed vial', () => {
    const start = buildLxrdgatsbyVials()
    const retired = retireVial(start, 'vial-ghk-a', '2026-09-15')
    const old = retired.find((v) => v.id === 'vial-ghk-a')!
    expect(old.remainingMg).toBe(0)
    expect(old.replacedAt).toBe('2026-09-15')
    expect(old.depleted).toBe(true)
    const next = addReplacementVial(retired, old, {
      vialMg: 100,
      bacWaterMl: 3,
      mixedDate: '2026-09-15',
    })
    const live = getActiveVialForPeptide(next, 'ghkcu')
    expect(live?.id).not.toBe('vial-ghk-a')
    expect(live?.remainingMg).toBe(100)
    expect(live?.bacWaterMl).toBe(3)
    expect(live?.isPowder).toBe(false)
    expect(next.find((v) => v.id === 'vial-ghk-a')?.replacedAt).toBe('2026-09-15')
    expect(isReplacedVial(next.find((v) => v.id === 'vial-ss31-a')!)).toBe(true)
    expect(isReplacedVial(next.find((v) => v.id === 'vial-aod-a')!)).toBe(true)
  })

  it('does not pull 5-Amino-1MQ before Sept 15', () => {
    const vials = buildLxrdgatsbyVials()
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const sept14 = getInjectionsForDate(
      peptides,
      new Date(2026, 8, 14),
      '2026-08-23'
    )
    expect(sept14.some((s) => s.peptideId === 'amino1mq')).toBe(false)
    const archived = vials.find((v) => v.id === 'vial-amino1mq-a')!
    expect(
      remainingDosesForVial(
        archived,
        peptides.find((p) => p.id === 'amino1mq'),
        '2026-08-23',
        new Date(2026, 8, 14)
      )
    ).toBe(0)
    const fresh = vials.find((v) => v.id === 'vial-amino1mq-b')!
    expect(
      remainingDosesForVial(
        fresh,
        peptides.find((p) => p.id === 'amino1mq'),
        '2026-08-23',
        new Date(2026, 9, 25)
      )
    ).toBe(11)
  })
})
