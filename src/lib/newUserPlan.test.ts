import { afterEach, describe, expect, it } from 'vitest'
import { AUTHORITATIVE_PEPTIDE_KNOWLEDGE as SERVER_KNOWLEDGE } from '../../api/peptideKnowledge'
import { PROTOCOL_ASSISTANT_PROMPT } from '../../api/chatHandler'
import { AUTHORITATIVE_PEPTIDE_KNOWLEDGE as CLIENT_KNOWLEDGE } from '../constants/peptideKnowledge'
import { DEFAULT_STATE } from '../constants/defaults'
import { getCatalogEntryByName } from '../constants/peptideCatalog'
import type { Peptide, TrackerState } from '../types'
import type { UserProfile } from '../types/auth'
import { buildAssistantUserContext } from '../utils/assistantUserContext'
import { clearAllLocalData } from '../utils/appDataStorage'
import { generateRecompPlan } from '../utils/recompProtocol'
import {
  applyLxrdgatsbyProtocolSeed,
  buildLxrdgatsbyStack,
  isLxrdgatsbyUser,
  PROTOCOL_DEFINITION_VERSION,
  refreshProtocolDefinition,
} from './protocolSeed'
import { trackerForSignedInUser } from './profileService'
import {
  readLocal,
  resetProtocolStorageScope,
  setProtocolStorageScope,
} from './protocolStorageScope'
import { applyLxrdgatsbyVialInventorySeed } from './vialInventorySeed'

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'new-user',
    email: 'new@example.com',
    username: null,
    familiarity: null,
    mainGoal: null,
    interestedPeptides: null,
    peptideSelections: [],
    additionalInfo: null,
    gender: null,
    age: null,
    trainingActivities: null,
    currentWeight: null,
    goalWeight: null,
    height: null,
    startDate: null,
    weeklyLossTarget: null,
    peptideStack: [],
    trackerData: null,
    onboardingCompleted: false,
    ...overrides,
  }
}

afterEach(() => {
  localStorage.clear()
  resetProtocolStorageScope()
})

describe('new signup does not inherit lxrdgatsby’s plan', () => {
  it('stays empty until onboarding even if a cloned stack was stored', () => {
    const { peptides, recompPlan } = buildLxrdgatsbyStack('2026-08-23')
    const cloned = profile({
      peptideStack: peptides,
      trackerData: {
        profile: {
          currentWeight: 156,
          goalWeight: 145,
          startWeight: 165,
          height: '',
          startDate: '2026-08-23',
          weeklyLossTarget: 1.6,
        },
        peptides,
        recompPlan,
        weightHistory: [
          { date: '2026-08-23', weight: 175 },
          { date: '2026-10-21', weight: 156 },
        ],
        injectionLogs: [{ date: '2026-08-23', peptideId: 'tesamorelin' }],
        vialInventory: [
          {
            id: 'vial-reta-cagri',
            compoundName: 'Reta + Cagrilintide',
            vialMg: 10,
            bacWaterMl: 3,
            concentrationMgPerMl: 10 / 3,
            mixedDate: '2026-10-25',
            isPowder: false,
            remainingMg: 10,
            createdAt: '2026-10-25',
          },
        ],
      },
    })

    const state = trackerForSignedInUser(cloned)
    expect(state.peptides).toEqual([])
    expect(state.injectionLogs).toEqual([])
    expect(state.weightHistory).toEqual([])
    expect(state.vialInventory ?? []).toEqual([])
    expect(state.profile.startDate).not.toBe('2026-08-23')
    expect(state.profile.goalWeight).toBe(175)
    expect(state.profile.startWeight).toBeUndefined()
    expect(state.profile.currentWeight).toBe(195)
  })

  it('does not seed or refresh another user’s plan from lxrdgatsby', () => {
    const own: Peptide = {
      id: 'bpc157',
      name: 'BPC-157',
      dose: '500mcg',
      frequency: 'daily',
      timing: 'AM',
      notes: 'their protocol',
    }
    const state: TrackerState = {
      ...DEFAULT_STATE,
      peptides: [own],
      injectionLogs: [{ date: '2026-10-02', peptideId: 'bpc157' }],
      weightHistory: [{ date: '2026-10-02', weight: 180 }],
    }

    expect(isLxrdgatsbyUser('alex', 'alex@example.com')).toBe(false)
    expect(isLxrdgatsbyUser(null, null)).toBe(false)
    expect(applyLxrdgatsbyProtocolSeed(state, null, 'new@example.com')).toBeNull()
    expect(refreshProtocolDefinition(state, 'alex', 'alex@example.com')).toBeNull()
    expect(applyLxrdgatsbyVialInventorySeed(state, null, null)).toBeNull()
    expect(state.peptides.map((p) => p.id)).toEqual(['bpc157'])
    expect(state.injectionLogs).toHaveLength(1)
    expect(localStorage.getItem('protocolSeeded_lxrdgatsby')).toBeNull()

    const kept = trackerForSignedInUser(
      profile({
        id: 'alex',
        username: 'alex',
        email: 'alex@example.com',
        onboardingCompleted: true,
        peptideStack: [own],
        trackerData: {
          peptides: [own],
          injectionLogs: state.injectionLogs,
          weightHistory: state.weightHistory,
        },
      })
    )
    expect(kept.peptides.map((p) => p.id)).toEqual(['bpc157'])
    expect(kept.injectionLogs).toEqual(state.injectionLogs)
  })

  it('still seeds lxrdgatsby from his email and keeps his logs', () => {
    expect(isLxrdgatsbyUser(null, 'itsgatsby@protonmail.com')).toBe(true)
    const seeded = applyLxrdgatsbyProtocolSeed(
      {
        ...DEFAULT_STATE,
        profile: { ...DEFAULT_STATE.profile, startDate: '2026-08-23' },
        peptides: [],
        injectionLogs: [{ date: '2026-08-23', peptideId: 'tesamorelin' }],
        weightHistory: [{ date: '2026-08-23', weight: 175 }],
      },
      null,
      'itsgatsby@protonmail.com'
    )
    expect(seeded).not.toBeNull()
    expect(seeded?.profile.startDate).toBe('2026-08-23')
    expect(seeded?.profile.goalWeight).toBe(145)
    expect(seeded?.profile.startWeight).toBe(165)
    expect(seeded?.injectionLogs).toEqual([
      { date: '2026-08-23', peptideId: 'tesamorelin' },
    ])
    expect(seeded?.weightHistory?.some((w) => w.date === '2026-08-23' && w.weight === 175)).toBe(
      true
    )
    expect(seeded?.peptides.some((p) => p.id === 'reta-cagri')).toBe(true)
    expect(seeded?.peptides.some((p) => p.id === 'selank-semax')).toBe(false)
    expect(PROTOCOL_DEFINITION_VERSION).toBe('2026-10-26-klow-80')
  })

  it('builds onboarding from the peptides they select', () => {
    const { peptides } = generateRecompPlan({
      familiarity: 'beginner',
      mainGoal: 'Reduce anxiety',
      gender: 'male',
      age: 30,
      trainingActivities: 'Walking / hiking',
      additionalInfo: null,
      currentWeight: 180,
      goalWeight: 170,
      weeklyLossTarget: 1,
      peptideSelections: [
        {
          catalogId: 'selank-semax',
          dose: '10mg',
          status: 'using',
          bacWaterUnits: 200,
          reconstituted: false,
        },
      ],
    })
    expect(peptides.map((p) => p.id)).toEqual(['selank-semax'])
    expect(peptides[0]?.protocol?.bacWaterMl).toBe(3)
    expect(peptides[0]?.protocol?.startingDoseMg).toBe(0.25)
    expect(peptides[0]?.protocol?.startingSyringeUnits).toBe(7.5)
    expect(getCatalogEntryByName('Selank/Semax fused')?.id).toBe('selank-semax')
    expect(getCatalogEntryByName('10 mg Selank + 10 mg Semax')?.id).toBe('selank-semax')
  })

  it('does not copy his on-device cache into a new user’s keys', () => {
    localStorage.setItem('protocolSeeded_lxrdgatsby', 'true')
    localStorage.setItem('activeStack', JSON.stringify([{ id: 'reta-cagri' }]))
    localStorage.setItem('checkIns', JSON.stringify([{ date: '2026-10-21', weight: 156 }]))

    setProtocolStorageScope('new-user-id', false)
    expect(localStorage.getItem('activeStack::new-user-id')).toBeNull()
    expect(localStorage.getItem('checkIns::new-user-id')).toBeNull()
    expect(readLocal('activeStack')).toBeNull()

    clearAllLocalData('new-user-id')
    expect(localStorage.getItem('activeStack')).toContain('reta-cagri')
    expect(localStorage.getItem('checkIns')).toContain('2026-10-21')
    expect(localStorage.getItem('protocolSeeded_lxrdgatsby')).toBe('true')
  })

  it('keeps his pause note off other users and teaches Selank + Semax', () => {
    const { peptides, recompPlan } = buildLxrdgatsbyStack('2026-08-23')
    const state: TrackerState = {
      ...DEFAULT_STATE,
      peptides,
      recompPlan,
      profile: { ...DEFAULT_STATE.profile, startDate: '2026-08-23' },
    }
    const other = buildAssistantUserContext(
      profile({ username: 'alex', email: 'alex@example.com', onboardingCompleted: true }),
      state
    )
    expect(other.protocol.note ?? '').not.toMatch(/Nov 7/)

    const mine = buildAssistantUserContext(
      profile({
        username: 'lxrdgatsby',
        email: 'itsgatsby@protonmail.com',
        onboardingCompleted: true,
      }),
      state
    )
    expect(mine.protocol.note).toMatch(/through Nov 7/)

    expect(CLIENT_KNOWLEDGE).toBe(SERVER_KNOWLEDGE)
    expect(CLIENT_KNOWLEDGE).toMatch(/SELANK \+ SEMAX/)
    expect(CLIENT_KNOWLEDGE).toMatch(/10 mg Selank \+ 10 mg Semax/)
    expect(CLIENT_KNOWLEDGE).toMatch(/250 mcg of each/)
    expect(CLIENT_KNOWLEDGE).toMatch(/no published human SC trials/)
    expect(CLIENT_KNOWLEDGE).toMatch(/Never copy that plan onto any other user/)
    expect(PROTOCOL_ASSISTANT_PROMPT).toMatch(/Never copy lxrdgatsby’s personal stack/)
    expect(PROTOCOL_ASSISTANT_PROMPT).toMatch(/250 mcg of each/)
  })
})
