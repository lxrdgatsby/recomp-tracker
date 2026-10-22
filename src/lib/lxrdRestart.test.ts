import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE } from '../constants/defaults'
import { getInjectionsForDate, isPeptideOnActiveStack } from '../utils/peptideSchedule'
import { formatCurrentStackDose } from '../utils/recompProtocol'
import { getShotsForSlot } from './reminders'
import {
  buildLxrdgatsbyStack,
  refreshProtocolDefinition,
} from './protocolSeed'
import { buildLxrdgatsbyVials } from './vialInventorySeed'
import { recalculateVialInventory, vialIdForDate } from '../utils/vialUsage'
import { buildAssistantUserContext } from '../utils/assistantUserContext'
import type { InjectionLog } from '../types'
import {
  nadActiveUntil,
  nadRemainingFromLogs,
  PROTOCOL_NOTE,
  withNadHorizon,
} from './lxrdRestart'

function mwfDates(count: number): string[] {
  const out: string[] = []
  const cursor = new Date(2026, 7, 24)
  while (out.length < count) {
    const dow = cursor.getDay()
    if (dow === 1 || dow === 3 || dow === 5) {
      const y = cursor.getFullYear()
      const m = String(cursor.getMonth() + 1).padStart(2, '0')
      const d = String(cursor.getDate()).padStart(2, '0')
      out.push(`${y}-${m}-${d}`)
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

function stack() {
  return buildLxrdgatsbyStack('2026-08-23')
}

function idsOn(date: Date) {
  return getInjectionsForDate(stack().peptides, date, '2026-08-23').map((shot) => shot.peptideId)
}

describe('Oct 25 protocol restart', () => {
  it('keeps Aug 23 Test and Reta, and leaves Oct 21 empty', () => {
    const aug23 = getInjectionsForDate(stack().peptides, new Date(2026, 7, 23), '2026-08-23')
    expect(aug23.some((shot) => shot.peptideId === 'test-cyp')).toBe(true)
    expect(aug23.find((shot) => shot.peptideId === 'retatrutide')?.syringeUnits).toBe(50)

    expect(idsOn(new Date(2026, 9, 4))).not.toContain('test-cyp')
    expect(idsOn(new Date(2026, 9, 21))).toEqual([])
  })

  it('schedules the new stack from Oct 25 and does not bring Test back in December', () => {
    const oct25 = getInjectionsForDate(stack().peptides, new Date(2026, 9, 25), '2026-08-23')
    expect(oct25.find((shot) => shot.peptideId === 'retatrutide')?.syringeUnits).toBe(50)
    expect(oct25.find((shot) => shot.peptideId === 'tesamorelin')?.syringeUnits).toBe(15)
    expect(oct25.find((shot) => shot.peptideId === 'amino1mq')?.syringeUnits).toBe(15)
    expect(oct25.some((shot) => shot.peptideId === 'motsc')).toBe(false)
    expect(oct25.some((shot) => shot.peptideId === 'nad')).toBe(false)
    expect(oct25.some((shot) => shot.peptideId === 'test-cyp')).toBe(false)

    const oct26 = getInjectionsForDate(stack().peptides, new Date(2026, 9, 26), '2026-08-23')
    expect(oct26.find((shot) => shot.peptideId === 'tesamorelin')?.syringeUnits).toBe(15)
    expect(oct26.find((shot) => shot.peptideId === 'amino1mq')?.syringeUnits).toBe(15)
    expect(oct26.find((shot) => shot.peptideId === 'motsc')?.syringeUnits).toBe(4)
    expect(oct26.find((shot) => shot.peptideId === 'nad')?.syringeUnits).toBe(25)
    expect(oct26.some((shot) => shot.peptideId === 'test-cyp')).toBe(false)

    const oct28 = getInjectionsForDate(stack().peptides, new Date(2026, 9, 28), '2026-08-23')
    expect(oct28.find((shot) => shot.peptideId === 'amino1mq')?.syringeUnits).toBe(30)

    const nov22 = getInjectionsForDate(stack().peptides, new Date(2026, 10, 22), '2026-08-23')
    expect(nov22.find((shot) => shot.peptideId === 'retatrutide')?.syringeUnits).toBe(50)
    expect(nov22.some((shot) => shot.peptideId === 'test-cyp')).toBe(false)

    const dec6 = getInjectionsForDate(stack().peptides, new Date(2026, 11, 6), '2026-08-23')
    expect(dec6.some((shot) => shot.peptideId === 'test-cyp')).toBe(false)
  })

  it('shows restart doses on the active stack during the pause and hides Test', () => {
    const { peptides } = stack()
    const pause = new Date(2026, 9, 21)
    const reta = peptides.find((p) => p.id === 'retatrutide')!
    const tesa = peptides.find((p) => p.id === 'tesamorelin')!
    const test = peptides.find((p) => p.id === 'test-cyp')!
    expect(formatCurrentStackDose(reta, '2026-08-23', pause)).toContain('50 u')
    expect(formatCurrentStackDose(reta, '2026-08-23', pause)).not.toContain('80')
    expect(formatCurrentStackDose(tesa, '2026-08-23', pause)).toContain('15 u')
    expect(isPeptideOnActiveStack(test, pause)).toBe(false)
    expect(isPeptideOnActiveStack(reta, pause)).toBe(true)
    expect(peptides.find((p) => p.id === 'aod9604')?.endsOn).toBe('2026-10-03')
    expect(stack().recompPlan.summary).toContain(PROTOCOL_NOTE)
  })

  it('counts NAD+ Done marks at 50 mg when doseMg is missing and sums same-day dose logs', () => {
    const days = mwfDates(18)
    const logs: InjectionLog[] = days.map((date) => ({ date, peptideId: 'nad' }))
    expect(days[17] <= '2026-10-24').toBe(true)
    expect(nadRemainingFromLogs(logs)).toEqual({ remainingMg: 100, doneCount: 18 })
    expect(nadActiveUntil(100)).toBe('2026-10-28')
    expect(nadActiveUntil(0)).toBeUndefined()

    expect(
      nadRemainingFromLogs([
        { date: '2026-09-28', peptideId: 'nad', doseMg: 30 },
        { date: '2026-09-28', peptideId: 'nad', doseMg: 20 },
        { date: '2026-09-28', peptideId: 'nad' },
      ])
    ).toEqual({ remainingMg: 950, doneCount: 1 })

    const { peptides } = stack()
    const horizon = withNadHorizon({
      ...DEFAULT_STATE,
      peptides,
      injectionLogs: logs,
    })
    expect(horizon.peptides.find((p) => p.id === 'nad')?.endsOn).toBe('2026-10-28')
    expect(horizon.injectionLogs).toEqual(logs)

    const empty = withNadHorizon({
      ...DEFAULT_STATE,
      peptides,
      injectionLogs: days.map((date) => ({ date, peptideId: 'nad', doseMg: 50 })).concat(
        Array.from({ length: 2 }, (_, i) => ({
          date: `2026-10-0${i + 1}`,
          peptideId: 'nad',
          doseMg: 50,
        }))
      ),
    })
    expect(empty.peptides.find((p) => p.id === 'nad')?.endsOn).toBe('2026-10-03')

    const vials = recalculateVialInventory({
      vials: buildLxrdgatsbyVials(),
      logs: [{ date: '2026-09-28', peptideId: 'nad' }],
      peptides,
      startDate: '2026-08-23',
    })
    expect(vials.find((v) => v.id === 'vial-nad-a')?.remainingMg).toBe(950)
    const later = recalculateVialInventory({
      vials: buildLxrdgatsbyVials(),
      logs: [{ date: '2026-10-26', peptideId: 'nad', doseMg: 50 }],
      peptides,
      startDate: '2026-08-23',
    })
    expect(later.find((v) => v.id === 'vial-nad-a')?.remainingMg).toBe(950)
    expect(later.some((v) => v.id !== 'vial-nad-a' && v.compoundId === 'nad')).toBe(false)
  })

  it('opens four full Oct 25 vials and leaves NAD and Test alone', () => {
    const vials = buildLxrdgatsbyVials()
    expect(vialIdForDate(vials, 'retatrutide', '2026-10-24')).toBe('vial-reta-a')
    expect(vialIdForDate(vials, 'retatrutide', '2026-10-25')).toBe('vial-reta-b')
    expect(vialIdForDate(vials, 'tesamorelin', '2026-10-24')).toBe('vial-tesa-a')
    expect(vialIdForDate(vials, 'tesamorelin', '2026-10-25')).toBe('vial-tesa-b')
    expect(vialIdForDate(vials, 'amino1mq', '2026-10-24')).toBe('vial-amino1mq-a')
    expect(vialIdForDate(vials, 'amino1mq', '2026-10-25')).toBe('vial-amino1mq-b')
    expect(vialIdForDate(vials, 'motsc', '2026-10-24')).toBe('vial-mots-a')
    expect(vialIdForDate(vials, 'motsc', '2026-10-25')).toBe('vial-mots-b')
    expect(vials.filter((v) => v.compoundId === 'test-cyp')).toHaveLength(1)
    expect(vials.find((v) => v.id === 'vial-bpc-a')?.replacedAt).toBeUndefined()
    expect(vials.find((v) => v.id === 'vial-nad-a')?.remainingMg).toBe(1000)
    expect(vials.find((v) => v.id === 'vial-mots-b')?.vialMg).toBe(40)
  })

  it('refreshes definitions without wiping logs and ignores other users', () => {
    const { peptides, recompPlan } = stack()
    const logs = [
      { date: '2026-08-23', peptideId: 'tesamorelin' },
      { date: '2026-08-24', peptideId: 'retatrutide' },
    ]
    const stale = {
      ...DEFAULT_STATE,
      profile: { ...DEFAULT_STATE.profile, startDate: '2026-08-23' },
      peptides,
      recompPlan: { ...recompPlan, definitionVersion: 'old' },
      injectionLogs: logs,
    }
    expect(refreshProtocolDefinition(stale, 'someone-else')).toBeNull()
    const once = refreshProtocolDefinition(stale, 'lxrdgatsby')
    expect(once?.profile.startDate).toBe('2026-08-23')
    expect(once?.injectionLogs).toEqual(logs)
    expect(once?.peptides.find((p) => p.id === 'retatrutide')?.schedulePause?.from).toBe(
      '2026-10-04'
    )
    expect(refreshProtocolDefinition(once!, 'lxrdgatsby')).toBeNull()
  })

  it('clears reminder copy during the pause and uses the restart stack after', () => {
    expect(getShotsForSlot('sunday', new Date(2026, 9, 4)).body).toBe('')
    expect(getShotsForSlot('sunday', new Date(2026, 9, 4)).shots).toEqual([])
    expect(getShotsForSlot('morning', new Date(2026, 9, 21)).shots).toEqual([])

    const morning = getShotsForSlot('morning', new Date(2026, 9, 26))
    expect(morning.body).toBe('5-Amino-1MQ 15u + MOTS-c 4u')
    expect(morning.shots.some((shot) => shot.id === 'aod9604')).toBe(false)

    expect(getShotsForSlot('evening', new Date(2026, 9, 26)).body).toBe('NAD+ 25u')
    expect(getShotsForSlot('evening', new Date(2026, 9, 27)).body).toBe('')
    expect(getShotsForSlot('night', new Date(2026, 9, 25)).body).toContain('Tesamorelin 15u')
    const sunday = getShotsForSlot('sunday', new Date(2026, 9, 25))
    expect(sunday.body).toBe('Reta 50u')
    expect(sunday.shots.some((shot) => shot.id === 'test-cyp')).toBe(false)
    expect(getShotsForSlot('morning', new Date(2026, 9, 28)).body).toContain('5-Amino-1MQ 30u')
  })

  it('tells the assistant that TRT is off and how much NAD+ is left', () => {
    const { peptides, recompPlan } = stack()
    const logs = mwfDates(18).map((date) => ({ date, peptideId: 'nad' }))
    const ctx = buildAssistantUserContext(null, {
      ...DEFAULT_STATE,
      profile: { ...DEFAULT_STATE.profile, startDate: '2026-08-23' },
      peptides,
      recompPlan,
      injectionLogs: logs,
    })
    expect(ctx.protocol.compounds.some((c) => c.id === 'test-cyp')).toBe(false)
    expect(ctx.protocol.note).toContain('TRT resumes December')
    expect(ctx.protocol.note).toContain('100 mg')
    expect(ctx.protocol.note).toContain('Nov 21')
  })
})
