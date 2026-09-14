import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE } from '../constants/defaults'
import { getCatalogEntry, getCatalogEntryByName } from '../constants/peptideCatalog'
import { getReconstitutionCompound } from '../constants/reconstitutionTable'
import { getTitrationForDay } from '../utils/recompProtocol'
import { getInjectionsForDate } from '../utils/peptideSchedule'
import { u100UnitsFromMg } from '../utils/doseMath'
import {
  PROTOCOL_DEFINITION_VERSION,
  buildLxrdgatsbyStack,
  refreshProtocolDefinition,
} from './protocolSeed'

describe('90-day protocol definition', () => {
  it('keeps start date and logs when refreshing definitions', () => {
    const start = '2026-08-23'
    const { peptides, recompPlan } = buildLxrdgatsbyStack(start)
    const stale = {
      ...DEFAULT_STATE,
      profile: {
        ...DEFAULT_STATE.profile,
        startDate: start,
        currentWeight: 171.2,
        goalWeight: 160,
      },
      peptides: peptides.map((p) => ({
        ...p,
        protocol: p.protocol
          ? {
              ...p.protocol,
              titration: p.protocol.titration.slice(0, 1),
            }
          : undefined,
      })),
      recompPlan: { ...recompPlan, definitionVersion: 'old' },
      injectionLogs: [
        { date: '2026-08-23', peptideId: 'tesamorelin' },
        { date: '2026-08-24', peptideId: 'aod9604' },
      ],
      weightHistory: [{ date: '2026-08-23', weight: 175 }],
    }

    const next = refreshProtocolDefinition(stale, 'lxrdgatsby')
    expect(next).not.toBeNull()
    expect(next?.profile.startDate).toBe(start)
    expect(next?.profile.currentWeight).toBe(171.2)
    expect(next?.injectionLogs).toEqual(stale.injectionLogs)
    expect(next?.weightHistory).toEqual(stale.weightHistory)
    expect(next?.recompPlan?.definitionVersion).toBe(PROTOCOL_DEFINITION_VERSION)

    const tesa = next?.peptides.find((p) => p.id === 'tesamorelin')
    expect(tesa?.protocol?.titration.some((t) => t.weeks === '5-8')).toBe(true)
    expect(tesa?.protocol?.startingSyringeUnits).toBe(7.5)

    const test = next?.peptides.find((p) => p.id === 'test-cyp')
    expect(test?.dose).toBe('0.75 mL')
    expect(test?.protocol?.startingSyringeUnits).toBe(0)
  })

  it('auto-selects Tesamorelin 15 u in week 3 (Sep 12 2026)', () => {
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const tesa = peptides.find((p) => p.id === 'tesamorelin')
    expect(tesa).toBeTruthy()
    const week3 = getTitrationForDay(tesa!, 20)
    expect(week3?.syringeUnits).toBe(15)
    expect(week3?.doseMg).toBe(1)

    const shots = getInjectionsForDate(
      peptides,
      new Date(2026, 8, 12),
      '2026-08-23'
    )
    const tesaShot = shots.find((s) => s.peptideId === 'tesamorelin')
    expect(tesaShot?.syringeUnits).toBe(15)
    expect(tesaShot?.cardLine).toContain('15 units on U-100')
    expect(tesaShot?.cardLine).toMatch(/Night/i)
  })

  it('auto-selects weeks 5–8 Tesamorelin 21 u and Reta 80 u', () => {
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const tesa = peptides.find((p) => p.id === 'tesamorelin')!
    const reta = peptides.find((p) => p.id === 'retatrutide')!
    expect(getTitrationForDay(tesa, 35)?.syringeUnits).toBe(21)
    expect(getTitrationForDay(reta, 35)?.syringeUnits).toBe(80)
  })

  it('calculator identities used by the protocol', () => {
    expect(u100UnitsFromMg(1, 20, 3)).toBe(15)
    expect(u100UnitsFromMg(2.5, 10, 2)).toBe(50)
    expect(u100UnitsFromMg(2.5, 50, 3)).toBe(15)
    expect(u100UnitsFromMg(5, 50, 3)).toBe(30)
  })

  it('adds 5-Amino-1MQ app-wide and on the lxrdgatsby stack', () => {
    expect(getCatalogEntry('amino1mq')?.name).toBe('5-Amino-1MQ')
    expect(getCatalogEntryByName('5-Amino')?.id).toBe('amino1mq')
    expect(getCatalogEntryByName('5 Amino 1MQ')?.id).toBe('amino1mq')
    expect(getCatalogEntryByName('5-amino-1MQ')?.id).toBe('amino1mq')
    const table = getReconstitutionCompound('amino1mq')
    expect(table?.vialMg).toBe(50)
    expect(table?.bacMl).toBe(3)
    expect(table?.keyDraws.find((d) => d.desiredMg === 5)?.units).toBe(30)

    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const amino = peptides.find((p) => p.id === 'amino1mq')
    expect(amino?.startsOn).toBe('2026-09-15')
    expect(amino?.protocol?.vialMg).toBe(50)
    expect(amino?.protocol?.bacWaterMl).toBe(3)
    expect(amino?.protocol?.concentrationLabel).toContain('16.67')
  })

  it('does not show 5-Amino-1MQ on Sept 14 and shows 15 u on Sept 15, 30 u on Sept 17', () => {
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const start = '2026-08-23'

    const sept14 = getInjectionsForDate(peptides, new Date(2026, 8, 14), start)
    expect(sept14.some((s) => s.peptideId === 'amino1mq')).toBe(false)

    const sept15 = getInjectionsForDate(peptides, new Date(2026, 8, 15), start)
    const amino15 = sept15.find((s) => s.peptideId === 'amino1mq')
    expect(amino15?.syringeUnits).toBe(15)
    expect(amino15?.cardLine).toBe(
      '5-Amino-1MQ · 15 units on U-100 · Morning, fasted'
    )

    const sept16 = getInjectionsForDate(peptides, new Date(2026, 8, 16), start)
    expect(sept16.find((s) => s.peptideId === 'amino1mq')?.syringeUnits).toBe(15)

    const sept17 = getInjectionsForDate(peptides, new Date(2026, 8, 17), start)
    const amino17 = sept17.find((s) => s.peptideId === 'amino1mq')
    expect(amino17?.syringeUnits).toBe(30)
    expect(amino17?.cardLine).toBe(
      '5-Amino-1MQ · 30 units on U-100 · Morning, fasted'
    )

    const morning = sept15
      .filter((s) => s.slot === 'morning')
      .map((s) => s.peptideId)
    expect(morning).toEqual(['aod9604', 'ss31', 'amino1mq', 'ghkcu'])
  })

  it('keeps Week 4 Reta at 50 u and does not pull Week 5 forward', () => {
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const reta = peptides.find((p) => p.id === 'retatrutide')!
    expect(getTitrationForDay(reta, 22, new Date(2026, 8, 14))?.syringeUnits).toBe(50)
    expect(getTitrationForDay(reta, 26, new Date(2026, 8, 19))?.syringeUnits).toBe(50)
    expect(getTitrationForDay(reta, 28, new Date(2026, 8, 20))?.syringeUnits).toBe(80)
  })

  it('merges 5-Amino-1MQ into an existing stack without wiping logs or start date', () => {
    const start = '2026-08-23'
    const { peptides, recompPlan } = buildLxrdgatsbyStack(start)
    const withoutAmino = peptides.filter((p) => p.id !== 'amino1mq')
    const stale = {
      ...DEFAULT_STATE,
      profile: {
        ...DEFAULT_STATE.profile,
        startDate: start,
        currentWeight: 171.2,
        goalWeight: 160,
      },
      peptides: withoutAmino,
      recompPlan: { ...recompPlan, definitionVersion: 'old' },
      injectionLogs: [
        { date: '2026-08-23', peptideId: 'tesamorelin' },
        { date: '2026-08-24', peptideId: 'aod9604' },
        { date: '2026-09-14', peptideId: 'ss31' },
      ],
      weightHistory: [{ date: '2026-08-23', weight: 175 }],
    }

    const next = refreshProtocolDefinition(stale, 'lxrdgatsby')
    expect(next?.profile.startDate).toBe(start)
    expect(next?.injectionLogs).toEqual(stale.injectionLogs)
    expect(next?.weightHistory).toEqual(stale.weightHistory)
    expect(next?.peptides.some((p) => p.id === 'amino1mq')).toBe(true)
    expect(next?.peptides.find((p) => p.id === 'retatrutide')?.protocol?.titration[0]?.syringeUnits).toBe(50)
  })

  it('does not rewrite another user’s plan', () => {
    const start = '2026-08-23'
    const { peptides, recompPlan } = buildLxrdgatsbyStack(start)
    const other = {
      ...DEFAULT_STATE,
      profile: { ...DEFAULT_STATE.profile, startDate: start },
      peptides,
      recompPlan,
    }
    expect(refreshProtocolDefinition(other, 'not-gatsby')).toBeNull()
  })
})
