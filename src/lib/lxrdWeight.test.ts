import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE } from '../constants/defaults'
import { recordWeight, weightProgress } from '../utils/calculations'
import { applyLxrdWeightTargets } from './lxrdWeight'
import { buildLxrdgatsbyStack, refreshProtocolDefinition } from './protocolSeed'

describe('lxrd weight targets', () => {
  it('sets 165 → latest log → 145 and keeps older points and injection logs', () => {
    const { peptides, recompPlan } = buildLxrdgatsbyStack('2026-08-23')
    const logs = [
      { date: '2026-08-23', peptideId: 'tesamorelin' },
      { date: '2026-09-13', peptideId: 'aod9604' },
    ]
    const stale = {
      ...DEFAULT_STATE,
      profile: {
        ...DEFAULT_STATE.profile,
        startDate: '2026-08-23',
        currentWeight: 171.2,
        goalWeight: 160,
      },
      peptides,
      recompPlan: { ...recompPlan, definitionVersion: 'old' },
      injectionLogs: logs,
      weightHistory: [{ date: '2026-08-23', weight: 175 }],
    }

    const next = refreshProtocolDefinition(stale, 'lxrdgatsby')
    expect(next?.profile.startWeight).toBe(165)
    expect(next?.profile.goalWeight).toBe(145)
    expect(next?.profile.currentWeight).toBe(156)
    expect(next?.profile.weeklyLossTarget).toBe(1.6)
    expect(next?.profile.startDate).toBe('2026-08-23')
    expect(next?.weightHistory).toEqual([
      { date: '2026-08-23', weight: 175 },
      { date: '2026-10-21', weight: 156 },
    ])
    expect(next?.injectionLogs).toEqual(logs)
    expect(weightProgress(next!.profile, next!.weightHistory)).toMatchObject({
      startWeight: 165,
      currentWeight: 156,
      goalWeight: 145,
      remainingLb: 11,
      percent: 45,
      lostLb: 9,
    })

    expect(refreshProtocolDefinition(next!, 'lxrdgatsby')).toBeNull()
    expect(next?.weightHistory.filter((entry) => entry.weight === 156)).toHaveLength(1)
  })

  it('keeps a later weigh-in and does not insert 156', () => {
    const history = [
      { date: '2026-08-23', weight: 175 },
      { date: '2026-10-28', weight: 154 },
    ]
    const next = applyLxrdWeightTargets({
      ...DEFAULT_STATE,
      weightHistory: history,
    })
    expect(next.weightHistory).toEqual(history)
    expect(next.profile.currentWeight).toBe(154)
    expect(next.profile.startWeight).toBe(165)
    expect(next.profile.goalWeight).toBe(145)
    expect(weightProgress(next.profile, next.weightHistory).remainingLb).toBe(9)
    expect(weightProgress(next.profile, next.weightHistory).percent).toBe(55)
  })

  it('a new weekly log updates current weight and a backdated log does not', () => {
    const seeded = applyLxrdWeightTargets({
      ...DEFAULT_STATE,
      profile: { ...DEFAULT_STATE.profile, startDate: '2026-08-23' },
      weightHistory: [{ date: '2026-08-23', weight: 175 }],
    })
    const logged = recordWeight(seeded, '2026-10-28', 154)
    expect(logged.weightHistory).toEqual([
      { date: '2026-08-23', weight: 175 },
      { date: '2026-10-21', weight: 156 },
      { date: '2026-10-28', weight: 154 },
    ])
    expect(logged.profile.currentWeight).toBe(154)
    expect(logged.profile.goalWeight).toBe(145)
    expect(logged.profile.startWeight).toBe(165)
    const progress = weightProgress(logged.profile, logged.weightHistory)
    expect(progress.percent).toBe(55)
    expect(progress.remainingLb).toBe(9)

    const backdated = recordWeight(logged, '2026-10-21', 150)
    expect(backdated.profile.currentWeight).toBe(154)
    expect(backdated.weightHistory).toEqual([
      { date: '2026-08-23', weight: 175 },
      { date: '2026-10-21', weight: 150 },
      { date: '2026-10-28', weight: 154 },
    ])
    expect(backdated.injectionLogs).toEqual(logged.injectionLogs)
  })

  it('does not change another user’s targets', () => {
    const { peptides, recompPlan } = buildLxrdgatsbyStack('2026-08-23')
    const other = {
      ...DEFAULT_STATE,
      profile: {
        ...DEFAULT_STATE.profile,
        startDate: '2026-08-23',
        currentWeight: 190,
        goalWeight: 170,
      },
      peptides,
      recompPlan,
      weightHistory: [{ date: '2026-08-23', weight: 190 }],
    }
    expect(refreshProtocolDefinition(other, 'not-gatsby')).toBeNull()
    expect(other.profile.goalWeight).toBe(170)
    expect(other.profile.currentWeight).toBe(190)
    expect(other.weightHistory).toEqual([{ date: '2026-08-23', weight: 190 }])
  })
})
