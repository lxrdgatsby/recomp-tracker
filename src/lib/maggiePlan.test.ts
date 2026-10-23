import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE } from '../constants/defaults'
import { RECONSTITUTION_TABLE } from '../constants/reconstitutionTable'
import type { TrackerState } from '../types'
import type { UserProfile } from '../types/auth'
import { buildAssistantUserContext } from '../utils/assistantUserContext'
import { getProtocolHeader } from '../utils/protocolHeader'
import { u100UnitsFromMg } from '../utils/doseMath'
import { getTitrationForDay } from '../utils/recompProtocol'
import { PROTOCOL_PEPTIDE_OPTIONS } from './vialInventory'
import {
  applyLxrdgatsbyProtocolSeed,
  buildLxrdgatsbyStack,
  PROTOCOL_DEFINITION_VERSION,
} from './protocolSeed'
import {
  applyMaggiePlan,
  isMaggieUser,
  MAGGIE_DEFINITION_VERSION,
  MAGGIE_EMAIL,
  upcomingSunday,
} from './maggiePlan'

const EMAIL = MAGGIE_EMAIL
const TODAY = new Date(2026, 9, 21)

function baseState(overrides: Partial<TrackerState> = {}): TrackerState {
  return {
    ...DEFAULT_STATE,
    peptides: [
      {
        id: 'bpc157',
        name: 'BPC-157',
        dose: '500mcg',
        frequency: 'daily',
      },
      {
        id: 'tesamorelin',
        name: 'Tesamorelin',
        dose: '1mg',
        frequency: 'daily',
      },
    ],
    profile: {
      ...DEFAULT_STATE.profile,
      startDate: '2026-08-23',
      currentWeight: 170,
      goalWeight: 160,
      startWeight: 175,
    },
    injectionLogs: [{ date: '2026-10-02', peptideId: 'bpc157', doseMg: 0.5, units: 10 }],
    weightHistory: [
      { date: '2026-09-01', weight: 179 },
      { date: '2026-10-11', weight: 176 },
    ],
    vialInventory: [
      {
        id: 'vial-bpc',
        compoundName: 'BPC-157',
        compoundId: 'bpc157',
        vialMg: 10,
        bacWaterMl: 2,
        concentrationMgPerMl: 5,
        mixedDate: '2026-09-01',
        isPowder: false,
        remainingMg: 8,
        createdAt: '2026-09-01T12:00:00.000Z',
      },
    ],
    ...overrides,
  }
}

function maggieProfile(email = EMAIL): UserProfile {
  return {
    id: 'maggie',
    email,
    username: 'mom',
    familiarity: 'beginner',
    mainGoal: null,
    interestedPeptides: null,
    peptideSelections: [],
    additionalInfo: null,
    gender: 'female',
    age: 51,
    trainingActivities: null,
    currentWeight: 180,
    goalWeight: 145,
    height: '5′1″',
    startDate: '2026-10-25',
    weeklyLossTarget: 1.2,
    peptideStack: [],
    trackerData: null,
    onboardingCompleted: true,
  }
}

function laToday(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

describe('maggie conservative retatrutide plan', () => {
  it('matches only her email', () => {
    expect(isMaggieUser(EMAIL)).toBe(true)
    expect(isMaggieUser('Maggiebella714@Yahoo.com')).toBe(true)
    expect(isMaggieUser('maggiebella714@gmail.com')).toBe(false)
    expect(isMaggieUser('itsgatsby@protonmail.com')).toBe(false)
    expect(isMaggieUser(null)).toBe(false)
    expect(isMaggieUser('')).toBe(false)
  })

  it('defaults the plan start to the upcoming Sunday', () => {
    expect(upcomingSunday(TODAY)).toBe('2026-10-25')
    expect(upcomingSunday(new Date(2026, 9, 25))).toBe('2026-10-25')
  })

  it('sets 180 → 145, retatrutide only, and a full 10 mg / 2 mL vial', () => {
    const state = baseState()
    const next = applyMaggiePlan(state, EMAIL, { today: TODAY })

    expect(next).not.toBeNull()
    expect(next?.profile.startWeight).toBe(180)
    expect(next?.profile.goalWeight).toBe(145)
    expect(next?.profile.height).toBe('5′1″')
    expect(next?.profile.currentWeight).toBe(176)
    expect(next?.profile.startDate).toBe('2026-10-25')
    expect(next?.weightHistory).toEqual(state.weightHistory)
    expect(next?.injectionLogs).toEqual(state.injectionLogs)

    expect(next?.peptides.map((p) => p.id)).toEqual(['retatrutide'])
    const reta = next?.peptides[0]
    expect(reta?.protocol?.vialMg).toBe(10)
    expect(reta?.protocol?.bacWaterMl).toBe(2)
    expect(reta?.protocol?.concentrationMgPerMl).toBe(5)
    expect(reta?.protocol?.startingDoseMg).toBe(0.5)
    expect(reta?.protocol?.startingSyringeUnits).toBe(10)
    expect(getTitrationForDay(reta!, 0)?.doseMg).toBe(0.5)
    expect(getTitrationForDay(reta!, 0)?.syringeUnits).toBe(10)
    expect(getTitrationForDay(reta!, 13)?.syringeUnits).toBe(10)
    expect(getTitrationForDay(reta!, 14)?.doseMg).toBe(1)
    expect(getTitrationForDay(reta!, 14)?.syringeUnits).toBe(20)
    expect(getTitrationForDay(reta!, 28)?.doseMg).toBe(2)
    expect(getTitrationForDay(reta!, 28)?.syringeUnits).toBe(40)
    expect(getTitrationForDay(reta!, 55)?.syringeUnits).toBe(40)
    expect(getTitrationForDay(reta!, 56)?.doseMg).toBe(2)
    expect(getTitrationForDay(reta!, 56)?.syringeUnits).toBe(40)

    const vial = next?.vialInventory?.find((v) => v.compoundId === 'retatrutide')
    expect(vial?.vialMg).toBe(10)
    expect(vial?.bacWaterMl).toBe(2)
    expect(vial?.concentrationMgPerMl).toBe(5)
    expect(vial?.remainingMg).toBe(10)
    expect(vial?.isPowder).toBe(false)
    expect(vial?.depleted).toBe(false)
    expect(vial?.mixedDate).toBe('2026-10-25')
    expect(next?.vialInventory?.some((v) => v.id === 'vial-bpc')).toBe(true)

    const notes = [
      ...(next?.recompPlan?.summary ?? []),
      ...(next?.recompPlan?.trainingNotes ?? []),
      next?.peptides[0]?.notes ?? '',
    ].join('\n')
    expect(notes).toMatch(/Investigational medicine/)
    expect(notes).toMatch(/Not a prescription/)
    expect(notes).toMatch(/0\.5 mg/)
    expect(notes).toMatch(/10 units/)
    expect(notes).toMatch(/Do not auto-escalate/)
    expect(notes).toMatch(/162–168/)
    expect(notes).toMatch(/metoprolol/)
    expect(notes).toMatch(/kidney-stone/)
    expect(notes).toMatch(/clinician-driven/)
    expect(next?.recompPlan?.definitionVersion).toBe(MAGGIE_DEFINITION_VERSION)
    expect(state.peptides.map((p) => p.id)).toEqual(['bpc157', 'tesamorelin'])
    expect(state.injectionLogs).toHaveLength(1)
  })

  it('uses 180 lb until she logs a weight and keeps a start date she already set', () => {
    const fresh = applyMaggiePlan(
      baseState({ weightHistory: [], injectionLogs: [] }),
      EMAIL,
      { today: TODAY }
    )
    expect(fresh?.profile.currentWeight).toBe(180)
    expect(fresh?.profile.startWeight).toBe(180)

    const kept = applyMaggiePlan(baseState(), EMAIL, {
      preserveStartDate: true,
      today: TODAY,
    })
    expect(kept?.profile.startDate).toBe('2026-08-23')
  })

  it('does not add a second retatrutide vial or reapply once seeded', () => {
    const once = applyMaggiePlan(baseState(), EMAIL, { today: TODAY })!
    const existing = once.vialInventory?.find((v) => v.compoundId === 'retatrutide')
    const edited = {
      ...once,
      vialInventory: once.vialInventory?.map((v) =>
        v.id === existing?.id ? { ...v, remainingMg: 7 } : v
      ),
      peptides: once.peptides.map((p) => ({ ...p, notes: 'she edited this' })),
    }
    expect(applyMaggiePlan(edited, EMAIL, { today: TODAY })).toBeNull()
    expect(edited.vialInventory?.filter((v) => v.compoundId === 'retatrutide')).toHaveLength(1)
    expect(edited.vialInventory?.find((v) => v.compoundId === 'retatrutide')?.remainingMg).toBe(7)
    expect(edited.peptides[0]?.notes).toBe('she edited this')
  })

  it('leaves every other user, his protocol version, and the shared calculator alone', () => {
    const other = baseState()
    expect(applyMaggiePlan(other, 'alex@example.com', { today: TODAY })).toBeNull()
    expect(applyMaggiePlan(other, 'itsgatsby@protonmail.com', { today: TODAY })).toBeNull()
    expect(other.peptides.map((p) => p.id)).toEqual(['bpc157', 'tesamorelin'])
    expect(applyLxrdgatsbyProtocolSeed(other, null, EMAIL)).toBeNull()
    expect(PROTOCOL_DEFINITION_VERSION).toBe('2026-10-25-dsip-v6')

    const row = RECONSTITUTION_TABLE.find((c) => c.id === 'retatrutide')
    expect(row?.vialMg).toBe(10)
    expect(row?.bacMl).toBe(2)
    expect(row?.defaultDoseMg).toBe(2.5)
    expect(row?.keyDraws).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ desiredMg: 0.5, units: 10 }),
        expect.objectContaining({ desiredMg: 4, units: 80 }),
      ])
    )
    expect(u100UnitsFromMg(0.5, 10, 2)).toBe(10)
    expect(u100UnitsFromMg(1, 10, 2)).toBe(20)
    expect(u100UnitsFromMg(2, 10, 2)).toBe(40)
    expect(u100UnitsFromMg(4, 10, 2)).toBe(80)
    expect(PROTOCOL_PEPTIDE_OPTIONS.find((p) => p.id === 'retatrutide')?.targetDoseMg).toBe(2.5)

    const { peptides } = buildLxrdgatsbyStack('2026-08-23')
    expect(peptides.some((p) => p.id === 'tesamorelin')).toBe(true)
    expect(peptides.find((p) => p.id === 'retatrutide')?.protocol?.startingDoseMg).toBe(2.5)
  })

  it('teaches her plan to the assistant and keeps his note on his stack', () => {
    const plan = applyMaggiePlan(
      baseState({
        weightHistory: [],
        profile: { ...DEFAULT_STATE.profile, startDate: laToday() },
      }),
      EMAIL,
      { preserveStartDate: true, today: TODAY }
    )!
    expect(getProtocolHeader(plan.profile.startDate).week).toBe(1)
    const hers = buildAssistantUserContext(maggieProfile(), plan)
    expect(hers.profile.startWeight).toBe(180)
    expect(hers.profile.goalWeight).toBe(145)
    expect(hers.protocol.compounds.map((c) => c.id)).toEqual(['retatrutide'])
    expect(hers.protocol.compounds[0]?.currentDoseMg).toBe(0.5)
    expect(hers.protocol.compounds[0]?.units).toBe(10)
    expect(hers.protocol.note).toMatch(/Investigational medicine/)
    expect(hers.protocol.note).toMatch(/Not a prescription/)
    expect(hers.protocol.note).toMatch(/0\.5 mg/)
    expect(hers.protocol.note).toMatch(/clinician/)
    expect(hers.protocol.note ?? '').not.toMatch(/TRT/)
    expect(hers.profile.proteinTarget).toMatch(/100–120/)

    const someoneElse = buildAssistantUserContext(
      maggieProfile('alex@example.com'),
      plan
    )
    expect(someoneElse.protocol.note ?? '').not.toMatch(/metoprolol/)

    const { peptides, recompPlan } = buildLxrdgatsbyStack('2026-08-23')
    const his = buildAssistantUserContext(null, {
      ...DEFAULT_STATE,
      peptides,
      recompPlan,
      profile: { ...DEFAULT_STATE.profile, startDate: '2026-08-23' },
    })
    expect(his.protocol.note).toMatch(/TRT/)
    expect(his.protocol.note).toMatch(/1\.5 mg/)
    expect(his.protocol.note).toMatch(/45/)
    expect(his.protocol.note ?? '').not.toMatch(/Nov 21/)

    const hersOnHisStack = buildAssistantUserContext(maggieProfile(), {
      ...DEFAULT_STATE,
      peptides,
      recompPlan,
      profile: { ...DEFAULT_STATE.profile, startDate: '2026-08-23' },
    })
    expect(hersOnHisStack.protocol.note).toMatch(/Investigational medicine/)
    expect(hersOnHisStack.protocol.note ?? '').not.toMatch(/TRT/)
  })
})
