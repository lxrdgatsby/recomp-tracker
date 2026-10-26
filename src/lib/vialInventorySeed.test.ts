import { afterEach, describe, expect, it } from 'vitest'
import { buildLxrdgatsbyStack, refreshProtocolDefinition } from './protocolSeed'
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
import { linkedMixedVial } from '../utils/todayDose'
import { forgetRemovedIds, rememberRemovedVial } from './removedCompounds'
import type { InjectionLog } from '../types'
import type { Vial } from '../types/v2'

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

  it('persists the Oct 25 vials plus the Oct 26 KLOW vial and leaves historical logs', () => {
    localStorage.clear()
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const logs: InjectionLog[] = [
      { date: '2026-08-23', peptideId: 'ss31' },
      { date: '2026-09-13', peptideId: 'ss31' },
    ]
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
        injectionLogs: logs,
        workoutCompletions: [],
        vialInventory: buildLxrdgatsbyVials(),
      },
      'lxrdgatsby',
      null,
    )
    expect(next?.vialInventory?.map((vial) => vial.id).sort()).toEqual([
      'vial-amino1mq-b',
      'vial-aod-c',
      'vial-dsip-a',
      'vial-klow-b',
      'vial-mots-b',
      'vial-reta-cagri',
      'vial-tesa-b',
    ])
    expect(next?.vialInventory?.some((vial) => vial.compoundId === 'nad')).toBe(false)
    expect(next?.vialInventory?.some((vial) => vial.compoundId === 'ss31')).toBe(false)
    expect(next?.vialInventory?.some((vial) => vial.compoundId === 'ghkcu')).toBe(false)
    expect(next?.vialInventory?.some((vial) => vial.compoundId === 'test-cyp')).toBe(false)
    expect(next?.vialInventory?.some((vial) => vial.compoundId === 'bpc157')).toBe(false)
    expect(next?.vialInventory?.find((vial) => vial.id === 'vial-amino1mq-b')?.remainingMg).toBe(50)
    expect(next?.vialInventory?.find((vial) => vial.id === 'vial-aod-c')?.mixedDate).toBe(
      '2026-10-25'
    )
    expect(next?.injectionLogs).toEqual(logs)
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

  it('adds a full mixed DSIP vial opened Oct 25 and ignores earlier logs', () => {
    const vials = buildLxrdgatsbyVials()
    const dsip = vials.find((v) => v.id === 'vial-dsip-a')!
    expect(dsip.vialMg).toBe(10)
    expect(dsip.bacWaterMl).toBe(2)
    expect(dsip.concentrationMgPerMl).toBe(5)
    expect(dsip.remainingMg).toBe(10)
    expect(dsip.mixedDate).toBe('2026-10-25')
    expect(dsip.isPowder).toBe(false)
    expect(dsip.depleted).toBe(false)

    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const before = recalculateVialInventory({
      vials,
      logs: [{ date: '2026-10-24', peptideId: 'dsip', doseMg: 0.1 }],
      peptides,
      startDate: '2026-08-23',
    })
    expect(before.find((v) => v.id === 'vial-dsip-a')?.remainingMg).toBe(10)
    expect(vialIdForDate(vials, 'dsip', '2026-10-24')).toBeUndefined()
    expect(vialIdForDate(vials, 'dsip', '2026-10-25')).toBe('vial-dsip-a')

    const after = recalculateVialInventory({
      vials,
      logs: [{ date: '2026-10-25', peptideId: 'dsip' }],
      peptides,
      startDate: '2026-08-23',
    })
    expect(after.find((v) => v.id === 'vial-dsip-a')?.remainingMg).toBe(9.9)
    expect(after.find((v) => v.id === 'vial-reta-a')?.remainingMg).toBe(0)
    expect(after.find((v) => v.id === 'vial-reta-cagri')?.remainingMg).toBe(10)
    expect(after.find((v) => v.id === 'vial-amino1mq-b')?.remainingMg).toBe(50)
  })

  it('restores Sunday vials after a protocol refresh and leaves logs', () => {
    localStorage.clear()
    rememberRemovedVial('vial-dsip-a')
    rememberRemovedVial('vial-reta-cagri')
    rememberRemovedVial('vial-bpc-a')
    const { peptides, recompPlan } = buildLxrdgatsbyStack('2026-08-23')
    const logs: InjectionLog[] = [
      { date: '2026-10-25', peptideId: 'dsip', doseMg: 0.1 },
      { date: '2026-08-23', peptideId: 'tesamorelin' },
    ]
    const stale = {
      profile: {
        currentWeight: 156,
        goalWeight: 145,
        startDate: '2026-08-23',
        weeklyLossTarget: 1.6,
      },
      peptides,
      recompPlan: { ...recompPlan, definitionVersion: '2026-10-25-dsip-v6' },
      weightHistory: [],
      injectionLogs: logs,
      workoutCompletions: [],
      vialInventory: buildLxrdgatsbyVials().filter(
        (vial) => vial.id !== 'vial-dsip-a' && vial.id !== 'vial-reta-cagri'
      ),
      removedVialIds: ['vial-dsip-a', 'vial-reta-cagri', 'vial-bpc-a'],
    }
    const refreshed = refreshProtocolDefinition(stale, 'lxrdgatsby')
    const next = applyLxrdgatsbyVialInventorySeed(refreshed!, 'lxrdgatsby', null)
    const dsip = next?.vialInventory?.find((vial) => vial.id === 'vial-dsip-a')
    const fused = next?.vialInventory?.find((vial) => vial.id === 'vial-reta-cagri')
    expect(dsip?.mixedDate).toBe('2026-10-25')
    expect(dsip?.bacWaterMl).toBe(2)
    expect(dsip?.vialMg).toBe(10)
    expect(dsip?.remainingMg).toBe(9.9)
    expect(dsip?.depleted).toBe(false)
    expect(fused?.mixedDate).toBe('2026-10-25')
    expect(fused?.bacWaterMl).toBe(3)
    expect(fused?.remainingMg).toBe(10)
    expect(next?.vialInventory?.some((vial) => vial.compoundId === 'nad')).toBe(false)
    expect(next?.vialInventory?.some((vial) => vial.id === 'vial-nad-a')).toBe(false)
    expect(next?.vialInventory?.some((vial) => vial.id === 'vial-bpc-a')).toBe(false)
    expect(next?.vialInventory?.some((vial) => vial.compoundId === 'ghkcu')).toBe(false)
    expect(next?.vialInventory?.some((vial) => vial.compoundId === 'test-cyp')).toBe(false)
    expect(next?.vialInventory?.map((vial) => vial.id).sort()).toEqual([
      'vial-amino1mq-b',
      'vial-aod-c',
      'vial-dsip-a',
      'vial-klow-b',
      'vial-mots-b',
      'vial-reta-cagri',
      'vial-tesa-b',
    ])
    expect(next?.vialInventory?.find((vial) => vial.id === 'vial-aod-c')?.bacWaterMl).toBe(2)
    expect(next?.vialInventory?.find((vial) => vial.id === 'vial-tesa-b')?.vialMg).toBe(20)
    expect(next?.injectionLogs).toEqual(logs)
    localStorage.clear()
  })

  it('keeps a removed vial out of inventory and leaves logs and other vials', () => {
    localStorage.clear()
    rememberRemovedVial('vial-dsip-a')
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const logs: InjectionLog[] = [
      { date: '2026-10-25', peptideId: 'dsip', doseMg: 0.1 },
      { date: '2026-10-25', peptideId: 'tesamorelin' },
    ]
    const next = applyLxrdgatsbyVialInventorySeed(
      {
        profile: {
          currentWeight: 156,
          goalWeight: 145,
          startDate: '2026-08-23',
          weeklyLossTarget: 1.6,
        },
        peptides,
        weightHistory: [],
        injectionLogs: logs,
        workoutCompletions: [],
        vialInventory: buildLxrdgatsbyVials(),
        removedVialIds: ['vial-dsip-a'],
      },
      'lxrdgatsby',
      null,
    )
    expect(next?.vialInventory?.some((vial) => vial.id === 'vial-dsip-a')).toBe(false)
    expect(next?.vialInventory?.some((vial) => vial.id === 'vial-nad-a')).toBe(false)
    expect(next?.vialInventory?.some((vial) => vial.id === 'vial-reta-cagri')).toBe(true)
    expect(next?.vialInventory?.some((vial) => vial.id === 'vial-tesa-b')).toBe(true)
    expect(next?.vialInventory).toHaveLength(6)
    expect(next?.injectionLogs).toEqual(logs)
    expect(next?.peptides).toEqual(peptides)
    localStorage.clear()
  })

  it('keeps only the Oct 26 KLOW vial and leaves the archived one and historical logs alone', () => {
    localStorage.clear()
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const logs: InjectionLog[] = [
      { date: '2026-08-23', peptideId: 'klow', doseMg: 0.5 },
      { date: '2026-10-25', peptideId: 'tesamorelin', doseMg: 1 },
    ]
    const fresh = {
      id: 'new-klow',
      compoundName: 'KLOW',
      compoundId: 'klow',
      vialMg: 80,
      bacWaterMl: 3,
      concentrationMgPerMl: 80 / 3,
      mixedDate: '2026-10-23',
      isPowder: false,
      remainingMg: 80,
      depleted: false,
      createdAt: '2026-10-23T15:00:00.000Z',
    }
    const next = applyLxrdgatsbyVialInventorySeed(
      {
        profile: {
          currentWeight: 156,
          goalWeight: 145,
          startDate: '2026-08-23',
          weeklyLossTarget: 1.6,
        },
        peptides,
        weightHistory: [],
        injectionLogs: logs,
        workoutCompletions: [],
        vialInventory: [...buildLxrdgatsbyVials(), fresh],
      },
      'lxrdgatsby',
      null,
    )
    const klow = next?.vialInventory?.filter((vial) => vial.compoundId === 'klow')
    expect(klow?.map((vial) => vial.id)).toEqual(['vial-klow-b'])
    expect(klow?.[0]?.vialMg).toBe(80)
    expect(klow?.[0]?.bacWaterMl).toBe(3)
    expect(klow?.[0]?.remainingMg).toBe(80)
    expect(klow?.[0]?.isPowder).toBe(false)
    expect(klow?.[0]?.depleted).toBe(false)
    expect(klow?.[0]?.mixedDate).toBe('2026-10-26')
    expect(next?.vialInventory?.some((vial) => vial.id === 'vial-klow-a')).toBe(false)
    expect(next?.vialInventory?.some((vial) => vial.id === 'new-klow')).toBe(false)
    expect(next?.removedVialIds).toContain('vial-klow-a')
    expect(next?.removedVialIds).toContain('new-klow')
    expect(next?.injectionLogs).toEqual(logs)
    expect(next?.vialInventory?.some((vial) => vial.id === 'vial-reta-cagri')).toBe(true)
    expect(vialIdForDate(klow ?? [], 'klow', '2026-08-23')).toBeUndefined()
    expect(vialIdForDate(klow ?? [], 'klow', '2026-10-25')).toBeUndefined()
    expect(vialIdForDate(klow ?? [], 'klow', '2026-10-26')).toBe('vial-klow-b')

    const again = applyLxrdgatsbyVialInventorySeed(next!, 'lxrdgatsby', null)
    expect(again?.vialInventory?.some((vial) => vial.id === 'vial-klow-a')).toBe(false)
    expect(again?.vialInventory?.some((vial) => vial.id === 'new-klow')).toBe(false)
    expect(again?.vialInventory?.find((vial) => vial.id === 'vial-klow-b')?.remainingMg).toBe(80)
    expect(again?.injectionLogs).toEqual(logs)

    const other = {
      profile: {
        currentWeight: 160,
        goalWeight: 145,
        startDate: '2026-10-24',
        weeklyLossTarget: 1,
      },
      peptides: [{ id: 'ghkcu', name: 'GHK-Cu', dose: '1mg', frequency: 'daily' as const }],
      weightHistory: [],
      injectionLogs: [{ date: '2026-10-01', peptideId: 'ghkcu' }],
      workoutCompletions: [],
      vialInventory: [fresh],
    }
    expect(applyLxrdgatsbyVialInventorySeed(other, 'bubblesmama', 'bubblesmama@example.com')).toBeNull()
    expect(other.vialInventory).toEqual([fresh])
    expect(other.injectionLogs).toEqual([{ date: '2026-10-01', peptideId: 'ghkcu' }])
    localStorage.clear()
  })

  it('keeps the AOD vial with 9 doses and drops the extra one', () => {
    localStorage.clear()
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const aod = peptides.find((peptide) => peptide.id === 'aod9604')!
    const extra: Vial = {
      id: 'vial-aod-extra',
      compoundName: 'AOD-9604',
      compoundId: 'aod9604',
      vialMg: 10,
      bacWaterMl: 2,
      concentrationMgPerMl: 5,
      mixedDate: '2026-10-26',
      isPowder: false,
      remainingMg: 9,
      depleted: false,
      createdAt: '2026-10-26T18:00:00.000Z',
    }
    const logs: InjectionLog[] = [
      { date: '2026-08-23', peptideId: 'aod9604', doseMg: 1 },
      { date: '2026-10-25', peptideId: 'aod9604', doseMg: 1 },
      { date: '2026-10-26', peptideId: 'aod9604', doseMg: 1, vialId: 'vial-aod-extra' },
      { date: '2026-09-13', peptideId: 'tesamorelin', doseMg: 1 },
    ]
    const inventory = buildLxrdgatsbyVials().map((vial) =>
      vial.id === 'vial-aod-c' ? { ...vial, remainingMg: 10 } : vial
    )
    const next = applyLxrdgatsbyVialInventorySeed(
      {
        profile: {
          currentWeight: 156,
          goalWeight: 145,
          startDate: '2026-08-23',
          weeklyLossTarget: 1.6,
        },
        peptides,
        weightHistory: [],
        injectionLogs: logs,
        workoutCompletions: [],
        vialInventory: [...inventory, extra],
      },
      'lxrdgatsby',
      null,
    )
    const aodVials = next?.vialInventory?.filter((vial) => vial.compoundId === 'aod9604') ?? []
    expect(aodVials.map((vial) => vial.id)).toEqual(['vial-aod-extra'])
    expect(remainingDosesForVial(aodVials[0], aod, '2026-08-23', new Date(2026, 9, 26))).toBe(9)
    expect(aodVials[0]?.remainingMg).toBe(9)
    expect(next?.removedVialIds).toContain('vial-aod-c')
    expect(next?.removedVialIds).not.toContain('vial-aod-extra')
    expect(next?.injectionLogs).toEqual(logs)
    expect(next?.peptides?.some((peptide) => peptide.id === 'aod9604')).toBe(true)
    expect(next?.vialInventory?.some((vial) => vial.id === 'vial-reta-cagri')).toBe(true)
    expect(linkedMixedVial(next?.vialInventory ?? [], 'aod9604')?.id).toBe('vial-aod-extra')

    const again = applyLxrdgatsbyVialInventorySeed(next!, 'lxrdgatsby', null)
    const againAod = again?.vialInventory?.filter((vial) => vial.compoundId === 'aod9604') ?? []
    expect(againAod.map((vial) => vial.id)).toEqual(['vial-aod-extra'])
    expect(remainingDosesForVial(againAod[0], aod, '2026-08-23', new Date(2026, 9, 26))).toBe(9)
    expect(again?.injectionLogs).toEqual(logs)

    forgetRemovedIds('vials', ['vial-aod-c'])
    const revived = applyLxrdgatsbyVialInventorySeed(
      {
        ...again!,
        removedVialIds: (again?.removedVialIds ?? []).filter((id) => id !== 'vial-aod-c'),
      },
      'lxrdgatsby',
      null,
    )
    expect(revived?.vialInventory?.filter((vial) => vial.compoundId === 'aod9604').map((vial) => vial.id)).toEqual([
      'vial-aod-extra',
    ])
    expect(revived?.vialInventory?.find((vial) => vial.id === 'vial-aod-extra')?.remainingMg).toBe(9)
    expect(revived?.removedVialIds).toContain('vial-aod-c')
    expect(revived?.injectionLogs).toEqual(logs)

    const otherInventory = [extra, { ...extra, id: 'vial-aod-other', remainingMg: 10 }]
    const other = {
      profile: {
        currentWeight: 160,
        goalWeight: 145,
        startDate: '2026-10-24',
        weeklyLossTarget: 1,
      },
      peptides: [{ id: 'aod9604', name: 'AOD-9604', dose: '1mg', frequency: 'daily' as const }],
      weightHistory: [],
      injectionLogs: logs,
      workoutCompletions: [],
      vialInventory: otherInventory,
    }
    expect(applyLxrdgatsbyVialInventorySeed(other, 'bubblesmama', 'bubblesmama@example.com')).toBeNull()
    expect(other.vialInventory).toEqual(otherInventory)
    expect(other.injectionLogs).toEqual(logs)
    localStorage.clear()
  })

  it('keeps the newer mixed AOD vial when both show 9 doses', () => {
    localStorage.clear()
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const older: Vial = {
      id: 'vial-aod-older',
      compoundName: 'AOD-9604',
      compoundId: 'aod9604',
      vialMg: 10,
      bacWaterMl: 2,
      concentrationMgPerMl: 5,
      mixedDate: '2026-10-25',
      isPowder: false,
      remainingMg: 9,
      depleted: false,
      createdAt: '2026-10-25T12:00:00.000Z',
    }
    const newer: Vial = {
      ...older,
      id: 'vial-aod-newer',
      mixedDate: '2026-10-26',
      createdAt: '2026-10-26T12:00:00.000Z',
    }
    const logs: InjectionLog[] = [
      { date: '2026-10-25', peptideId: 'aod9604', doseMg: 1, vialId: 'vial-aod-older' },
      { date: '2026-10-26', peptideId: 'aod9604', doseMg: 1, vialId: 'vial-aod-newer' },
    ]
    const base = buildLxrdgatsbyVials().filter((vial) => vial.compoundId !== 'aod9604')
    const next = applyLxrdgatsbyVialInventorySeed(
      {
        profile: {
          currentWeight: 156,
          goalWeight: 145,
          startDate: '2026-08-23',
          weeklyLossTarget: 1.6,
        },
        peptides,
        weightHistory: [],
        injectionLogs: logs,
        workoutCompletions: [],
        vialInventory: [...base, older, newer],
      },
      'lxrdgatsby',
      null,
    )
    const aodVials = next?.vialInventory?.filter((vial) => vial.compoundId === 'aod9604') ?? []
    expect(aodVials.map((vial) => vial.id)).toEqual(['vial-aod-newer'])
    expect(aodVials[0]?.remainingMg).toBe(9)
    expect(next?.injectionLogs).toEqual(logs)
    expect(linkedMixedVial(aodVials, 'aod9604')?.id).toBe('vial-aod-newer')
    localStorage.clear()
  })

  it('keeps the Oct 25 AOD vial when that one has 9 doses left', () => {
    localStorage.clear()
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const aod = peptides.find((peptide) => peptide.id === 'aod9604')!
    const extra: Vial = {
      id: 'vial-aod-full',
      compoundName: 'AOD-9604',
      compoundId: 'aod9604',
      vialMg: 10,
      bacWaterMl: 2,
      concentrationMgPerMl: 5,
      mixedDate: '2026-10-26',
      isPowder: false,
      remainingMg: 10,
      depleted: false,
      createdAt: '2026-10-26T18:00:00.000Z',
    }
    const logs: InjectionLog[] = [
      { date: '2026-08-20', peptideId: 'aod9604', doseMg: 1 },
      { date: '2026-10-25', peptideId: 'aod9604', doseMg: 1, vialId: 'vial-aod-c' },
    ]
    const inventory = buildLxrdgatsbyVials().map((vial) =>
      vial.id === 'vial-aod-c' ? { ...vial, remainingMg: 9 } : vial
    )
    const next = applyLxrdgatsbyVialInventorySeed(
      {
        profile: {
          currentWeight: 156,
          goalWeight: 145,
          startDate: '2026-08-23',
          weeklyLossTarget: 1.6,
        },
        peptides,
        weightHistory: [],
        injectionLogs: logs,
        workoutCompletions: [],
        vialInventory: [...inventory, extra],
      },
      'lxrdgatsby',
      null,
    )
    const aodVials = next?.vialInventory?.filter((vial) => vial.compoundId === 'aod9604') ?? []
    expect(aodVials.map((vial) => vial.id)).toEqual(['vial-aod-c'])
    expect(remainingDosesForVial(aodVials[0], aod, '2026-08-23', new Date(2026, 9, 25))).toBe(9)
    expect(next?.removedVialIds).toContain('vial-aod-full')
    expect(next?.injectionLogs).toEqual(logs)
    expect(linkedMixedVial(aodVials, 'aod9604')?.id).toBe('vial-aod-c')

    const marked = {
      ...next!,
      injectionLogs: [
        ...logs,
        { date: '2026-10-26', peptideId: 'aod9604', doseMg: 1, vialId: 'vial-aod-c' },
      ],
      vialInventory: next!.vialInventory?.map((vial) =>
        vial.id === 'vial-aod-c' ? { ...vial, remainingMg: 8 } : vial
      ),
    }
    const afterDose = applyLxrdgatsbyVialInventorySeed(marked, 'lxrdgatsby', null)
    const afterAod = afterDose?.vialInventory?.find((vial) => vial.id === 'vial-aod-c')
    expect(afterDose?.vialInventory?.filter((vial) => vial.compoundId === 'aod9604')).toHaveLength(1)
    expect(remainingDosesForVial(afterAod!, aod, '2026-08-23', new Date(2026, 9, 26))).toBe(8)
    expect(afterDose?.injectionLogs).toEqual(marked.injectionLogs)
    localStorage.clear()
  })

  it('does not seed DSIP inventory onto another user', () => {
    const next = applyLxrdgatsbyVialInventorySeed(
      {
        profile: {
          currentWeight: 180,
          goalWeight: 170,
          startDate: '2026-10-01',
          weeklyLossTarget: 1,
        },
        peptides: [
          {
            id: 'bpc157',
            name: 'BPC-157',
            dose: '500mcg',
            frequency: 'daily',
          },
        ],
        weightHistory: [{ date: '2026-10-01', weight: 180 }],
        injectionLogs: [{ date: '2026-10-02', peptideId: 'bpc157' }],
        workoutCompletions: [],
      },
      'other-user',
      'other@example.com',
    )
    expect(next).toBeNull()
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
    ).toBe(20)
  })
})
