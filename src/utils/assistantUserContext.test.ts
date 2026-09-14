import { subDays, format } from 'date-fns'
import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE } from '../constants/defaults'
import { buildLxrdgatsbyStack } from '../lib/protocolSeed'
import {
  NO_PLAN_MESSAGE,
  buildAssistantUserContext,
  getAssistantQuickPrompts,
} from './assistantUserContext'

describe('assistant user context', () => {
  it('flags no plan instead of inventing a stack', () => {
    const ctx = buildAssistantUserContext(null, {
      ...DEFAULT_STATE,
      peptides: [],
    })
    expect(ctx.hasPlan).toBe(false)
    expect(ctx.noPlanMessage).toBe(NO_PLAN_MESSAGE)
    expect(ctx.protocol.compounds).toEqual([])
  })

  it('uses live 90-day stack doses (Tesamorelin 15 u / Reta 50 u in weeks 2–4)', () => {
    const start = format(subDays(new Date(), 16), 'yyyy-MM-dd')
    const { peptides, recompPlan } = buildLxrdgatsbyStack(start)
    const ctx = buildAssistantUserContext(
      {
        id: 'u1',
        email: 'user@example.com',
        username: 'tester',
        familiarity: 'advanced',
        mainGoal: 'Body recomposition',
        interestedPeptides: null,
        peptideSelections: [],
        additionalInfo: null,
        gender: 'male',
        age: 35,
        trainingActivities: 'Weight training',
        currentWeight: 175,
        goalWeight: 160,
        height: null,
        startDate: start,
        weeklyLossTarget: 1.2,
        peptideStack: peptides,
        trackerData: null,
        onboardingCompleted: true,
      },
      {
        ...DEFAULT_STATE,
        profile: {
          ...DEFAULT_STATE.profile,
          startDate: start,
          currentWeight: 172,
          goalWeight: 160,
        },
        peptides,
        recompPlan,
        injectionLogs: [],
        weightHistory: [{ date: start, weight: 175 }],
      }
    )

    expect(ctx.hasPlan).toBe(true)
    expect(ctx.protocolWeek).toBeGreaterThanOrEqual(3)
    const tesa = ctx.protocol.compounds.find((c) => c.id === 'tesamorelin')
    const reta = ctx.protocol.compounds.find((c) => c.id === 'retatrutide')
    expect(tesa?.units).toBe(15)
    expect(tesa?.currentDoseMg).toBe(1)
    expect(reta?.units).toBe(50)
    expect(reta?.currentDoseMg).toBe(2.5)
    expect(ctx.profile.email).toBe('user@example.com')
    expect(ctx.profile.trainingNotes).toContain('Weight training')
  })

  it('wires stack-aware quick prompts', () => {
    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    const chips = getAssistantQuickPrompts(peptides)
    expect(chips[0]).toBe('What do I inject today?')
    expect(chips.some((c) => /Reta|Tesamorelin/i.test(c))).toBe(true)
    expect(chips.some((c) => /5-Amino/i.test(c))).toBe(true)
  })
})
