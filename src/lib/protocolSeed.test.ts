import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE } from '../constants/defaults'
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
  })
})
