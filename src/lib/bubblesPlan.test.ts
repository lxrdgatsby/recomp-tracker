import { describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE } from '../constants/defaults'
import { getCatalogEntry } from '../constants/peptideCatalog'
import { getReconstitutionCompound } from '../constants/reconstitutionTable'
import type { Peptide, TrackerState } from '../types'
import type { UserProfile } from '../types/auth'
import { buildAssistantUserContext } from '../utils/assistantUserContext'
import { getInjectionsForDate } from '../utils/peptideSchedule'
import { buildLxrdgatsbyStack } from './protocolSeed'
import {
  applyBubblesmamaKlow,
  BUBBLES_KLOW_VERSION,
  BUBBLES_STACK_START,
  BUBBLES_VIAL_ID,
  isBubblesmamaUser,
} from './bubblesPlan'

const LOGS = [
  { date: '2026-09-02', peptideId: 'bpc157', peptideName: 'BPC-157', doseMg: 0.5, units: 10 },
  { date: '2026-10-01', peptideId: 'ghkcu', peptideName: 'GHK-Cu', doseMg: 1, units: 3 },
]

function peptide(partial: Partial<Peptide> & Pick<Peptide, 'id' | 'name'>): Peptide {
  return {
    dose: '1mg',
    frequency: 'daily',
    timing: 'Morning, fasted',
    ...partial,
  }
}

function state(overrides: Partial<TrackerState> = {}): TrackerState {
  return {
    profile: {
      ...DEFAULT_PROFILE,
      startDate: '2026-11-02',
      currentWeight: 160,
      goalWeight: 145,
    },
    peptides: [
      peptide({ id: 'ghkcu', name: 'GHK-Cu', startsOn: '2026-11-02' }),
      peptide({
        id: 'bpc157',
        name: 'BPC-157',
        frequency: 'daily',
        timing: 'Morning, fasted',
        startsOn: '2026-10-01',
      }),
      peptide({
        id: 'nad',
        name: 'NAD+',
        startsOn: '2026-08-01',
        endsOn: '2026-10-03',
        frequency: 'mwf',
      }),
    ],
    recompPlan: {
      generatedAt: '2026-10-01T00:00:00.000Z',
      summary: ['Keep this line'],
      nutritionNotes: ['Protein'],
      trainingNotes: ['Walk'],
      checkInCadence: 'weekly',
      definitionVersion: 'her-plan',
    },
    weightHistory: [{ date: '2026-10-01', weight: 162 }],
    injectionLogs: LOGS,
    workoutCompletions: [{ date: '2026-10-01', week: 1, dayIndex: 0 }],
    vialInventory: [
      {
        id: 'vial-ghk',
        compoundName: 'GHK-Cu',
        compoundId: 'ghkcu',
        vialMg: 100,
        bacWaterMl: 3,
        concentrationMgPerMl: 33.33,
        mixedDate: '2026-10-01',
        isPowder: false,
        remainingMg: 90,
        createdAt: '2026-10-01T00:00:00.000Z',
      },
    ],
    ...overrides,
  }
}

function profile(): UserProfile {
  return {
    id: 'bubbles',
    email: 'bubblesmama@example.com',
    username: 'Bubblesmama',
    familiarity: 'beginner',
    mainGoal: null,
    interestedPeptides: null,
    peptideSelections: [],
    additionalInfo: null,
    gender: null,
    age: null,
    trainingActivities: null,
    currentWeight: 160,
    goalWeight: 145,
    height: null,
    startDate: BUBBLES_STACK_START,
    weeklyLossTarget: 1,
    peptideStack: [],
    trackerData: null,
    onboardingCompleted: true,
  }
}

describe('Bubblesmama KLOW stack', () => {
  it('matches only Bubblesmama', () => {
    expect(isBubblesmamaUser('Bubblesmama', null)).toBe(true)
    expect(isBubblesmamaUser(null, 'Bubbles.Mama@example.com')).toBe(true)
    expect(isBubblesmamaUser('lxrdgatsby', 'itsgatsby@protonmail.com')).toBe(false)
    expect(isBubblesmamaUser('mom', 'maggiebella714@yahoo.com')).toBe(false)
    expect(isBubblesmamaUser('bubbles', null)).toBe(false)
  })

  it('adds KLOW 80 mg on Oct 24 and keeps logs and other vials', () => {
    const before = state()
    const ended = before.peptides.find((item) => item.id === 'nad')
    const next = applyBubblesmamaKlow(before, 'bubblesmama', 'bubblesmama@example.com')
    expect(next).not.toBeNull()
    expect(next?.profile.startDate).toBe(BUBBLES_STACK_START)
    expect(next?.profile.currentWeight).toBe(160)
    expect(next?.injectionLogs).toEqual(LOGS)
    expect(next?.weightHistory).toEqual(before.weightHistory)
    expect(next?.workoutCompletions).toEqual(before.workoutCompletions)
    expect(next?.peptides.find((item) => item.id === 'nad')).toEqual(ended)
    expect(next?.vialInventory?.find((vial) => vial.id === 'vial-ghk')?.remainingMg).toBe(90)

    const ghk = next?.peptides.find((item) => item.id === 'ghkcu')
    expect(ghk?.startsOn).toBe(BUBBLES_STACK_START)
    const bpc = next?.peptides.find((item) => item.id === 'bpc157')
    expect(bpc?.startsOn).toBe('2026-10-01')
    expect(bpc?.dose).toBe('1mg')

    const klow = next?.peptides.find((item) => item.id === 'klow')
    expect(klow?.startsOn).toBe(BUBBLES_STACK_START)
    expect(klow?.frequency).toBe('daily')
    expect(klow?.timing).toBe('Morning, fasted')
    expect(klow?.protocol?.vialMg).toBe(80)
    expect(klow?.protocol?.bacWaterMl).toBe(3)
    expect(klow?.protocol?.startingDoseMg).toBe(1)
    expect(klow?.protocol?.startingSyringeUnits).toBe(4)

    const vial = next?.vialInventory?.find((item) => item.id === BUBBLES_VIAL_ID)
    expect(vial?.vialMg).toBe(80)
    expect(vial?.bacWaterMl).toBe(3)
    expect(vial?.isPowder).toBe(false)
    expect(vial?.depleted).toBe(false)
    expect(vial?.remainingMg).toBe(80)
    expect(vial?.mixedDate).toBe(BUBBLES_STACK_START)
    expect(next?.recompPlan?.summary?.[0]).toBe('Keep this line')
    expect(next?.recompPlan?.definitionVersion).toContain(BUBBLES_KLOW_VERSION)
    expect(next?.recompPlan?.definitionVersion).toContain('her-plan')
  })

  it('schedules KLOW on Oct 24 and does not apply twice or to anyone else', () => {
    const once = applyBubblesmamaKlow(state(), 'bubblesmama')!
    const shots = getInjectionsForDate(
      once.peptides,
      new Date(2026, 9, 24),
      once.profile.startDate
    )
    const klow = shots.find((shot) => shot.peptideId === 'klow')
    expect(klow?.syringeUnits).toBe(4)
    expect(shots.some((shot) => shot.peptideId === 'ghkcu')).toBe(true)
    expect(shots.some((shot) => shot.peptideId === 'nad')).toBe(false)
    expect(applyBubblesmamaKlow(once, 'bubblesmama')).toBeNull()

    const other = state()
    expect(applyBubblesmamaKlow(other, 'lxrdgatsby', 'itsgatsby@protonmail.com')).toBeNull()
    expect(other.injectionLogs).toEqual(LOGS)
    expect(other.peptides.map((item) => item.id)).toEqual(['ghkcu', 'bpc157', 'nad'])
  })

  it('opens a pause that covers Oct 24 without deleting the earlier pause', () => {
    const paused = state({
      peptides: [
        peptide({
          id: 'ghkcu',
          name: 'GHK-Cu',
          startsOn: '2026-09-01',
          schedulePause: { from: '2026-10-10', until: '2026-10-30' },
        }),
      ],
    })
    const next = applyBubblesmamaKlow(paused, 'bubblesmama')!
    expect(next.peptides.find((item) => item.id === 'ghkcu')?.schedulePause).toEqual({
      from: '2026-10-10',
      until: '2026-10-23',
    })
    const shots = getInjectionsForDate(
      next.peptides,
      new Date(2026, 9, 24),
      next.profile.startDate
    )
    expect(shots.some((shot) => shot.peptideId === 'ghkcu')).toBe(true)
  })

  it('tells the assistant KLOW starts Oct 24 and leaves lxrd’s 10 mg vial alone', () => {
    const plan = applyBubblesmamaKlow(state(), 'bubblesmama')!
    const ctx = buildAssistantUserContext(profile(), plan)
    expect(ctx.protocol.note).toMatch(/October 24, 2026/)
    expect(ctx.protocol.note).toMatch(/3\.75/)
    expect(ctx.protocol.note).toMatch(/historical injection logs/)
    const klow = ctx.protocol.compounds.find((compound) => compound.id === 'klow')
    expect(klow?.reconstitution.vialMg).toBe(80)
    expect(String(klow?.currentDoseLabel)).toMatch(/2026-10-24/)

    const lxrd = buildLxrdgatsbyStack('2026-08-23')
    expect(lxrd.peptides.find((item) => item.id === 'klow')?.protocol?.vialMg).toBe(10)
    expect(getCatalogEntry('klow')?.defaultDose).toBe('80mg')
    expect(getReconstitutionCompound('klow')?.vialMg).toBe(80)
    expect(getReconstitutionCompound('klow')?.bacMl).toBe(3)
    expect(getReconstitutionCompound('klow')?.defaultDoseMg).toBe(1)
  })
})
