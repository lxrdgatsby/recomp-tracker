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
    expect(oct25.find((shot) => shot.peptideId === 'reta-cagri')?.syringeUnits).toBe(45)
    expect(oct25.find((shot) => shot.peptideId === 'aod9604')?.syringeUnits).toBe(20)
    expect(oct25.find((shot) => shot.peptideId === 'tesamorelin')?.syringeUnits).toBe(15)
    expect(oct25.find((shot) => shot.peptideId === 'amino1mq')?.syringeUnits).toBe(15)
    expect(oct25.some((shot) => shot.peptideId === 'retatrutide')).toBe(false)
    expect(oct25.some((shot) => shot.peptideId === 'motsc')).toBe(false)
    expect(oct25.some((shot) => shot.peptideId === 'nad')).toBe(false)
    expect(oct25.some((shot) => shot.peptideId === 'test-cyp')).toBe(false)
    expect(oct25.some((shot) => shot.peptideId === 'ss31')).toBe(false)
    expect(oct25.some((shot) => shot.peptideId === 'bpc157')).toBe(false)
    expect(oct25.some((shot) => shot.peptideId === 'klow')).toBe(false)

    const oct26 = getInjectionsForDate(stack().peptides, new Date(2026, 9, 26), '2026-08-23')
    expect(oct26.find((shot) => shot.peptideId === 'aod9604')?.syringeUnits).toBe(20)
    expect(oct26.find((shot) => shot.peptideId === 'tesamorelin')?.syringeUnits).toBe(15)
    expect(oct26.find((shot) => shot.peptideId === 'amino1mq')?.syringeUnits).toBe(15)
    expect(oct26.find((shot) => shot.peptideId === 'motsc')?.syringeUnits).toBe(4)
    expect(oct26.find((shot) => shot.peptideId === 'nad')?.syringeUnits).toBe(25)
    expect(oct26.some((shot) => shot.peptideId === 'retatrutide')).toBe(false)
    expect(oct26.some((shot) => shot.peptideId === 'reta-cagri')).toBe(false)
    expect(oct26.some((shot) => shot.peptideId === 'test-cyp')).toBe(false)
    expect(oct26.some((shot) => shot.peptideId === 'ss31')).toBe(false)
    expect(oct26.some((shot) => shot.peptideId === 'bpc157')).toBe(false)
    expect(oct26.some((shot) => shot.peptideId === 'klow')).toBe(false)

    const oct28 = getInjectionsForDate(stack().peptides, new Date(2026, 9, 28), '2026-08-23')
    expect(oct28.find((shot) => shot.peptideId === 'amino1mq')?.syringeUnits).toBe(30)

    const nov1 = getInjectionsForDate(stack().peptides, new Date(2026, 10, 1), '2026-08-23')
    expect(nov1.find((shot) => shot.peptideId === 'reta-cagri')?.syringeUnits).toBe(45)
    const nov8 = getInjectionsForDate(stack().peptides, new Date(2026, 10, 8), '2026-08-23')
    expect(nov8.find((shot) => shot.peptideId === 'reta-cagri')?.syringeUnits).toBe(45)

    const nov22 = getInjectionsForDate(stack().peptides, new Date(2026, 10, 22), '2026-08-23')
    expect(nov22.find((shot) => shot.peptideId === 'reta-cagri')?.syringeUnits).toBe(45)
    expect(nov22.some((shot) => shot.peptideId === 'retatrutide')).toBe(false)
    expect(nov22.some((shot) => shot.peptideId === 'test-cyp')).toBe(false)

    const dec6 = getInjectionsForDate(stack().peptides, new Date(2026, 11, 6), '2026-08-23')
    expect(dec6.some((shot) => shot.peptideId === 'test-cyp')).toBe(false)
  })

  it('shows restart doses on the active stack during the pause and hides Test', () => {
    const { peptides } = stack()
    const pause = new Date(2026, 9, 21)
    const reta = peptides.find((p) => p.id === 'retatrutide')!
    const fused = peptides.find((p) => p.id === 'reta-cagri')!
    const aod = peptides.find((p) => p.id === 'aod9604')!
    const tesa = peptides.find((p) => p.id === 'tesamorelin')!
    const test = peptides.find((p) => p.id === 'test-cyp')!
    expect(formatCurrentStackDose(fused, '2026-08-23', pause)).toContain('45 u')
    expect(formatCurrentStackDose(fused, '2026-08-23', pause)).toContain('1.5 mg')
    expect(formatCurrentStackDose(aod, '2026-08-23', pause)).toContain('20 u')
    expect(formatCurrentStackDose(tesa, '2026-08-23', pause)).toContain('15 u')
    expect(isPeptideOnActiveStack(test, pause)).toBe(false)
    expect(isPeptideOnActiveStack(reta, pause)).toBe(false)
    expect(isPeptideOnActiveStack(fused, pause)).toBe(true)
    expect(isPeptideOnActiveStack(peptides.find((p) => p.id === 'ss31')!, pause)).toBe(false)
    expect(isPeptideOnActiveStack(peptides.find((p) => p.id === 'bpc157')!, pause)).toBe(false)
    expect(isPeptideOnActiveStack(peptides.find((p) => p.id === 'klow')!, pause)).toBe(false)
    expect(reta.endsOn).toBe('2026-10-03')
    expect(aod.endsOn).toBeUndefined()
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
    expect(vialIdForDate(vials, 'reta-cagri', '2026-10-24')).toBeUndefined()
    expect(vialIdForDate(vials, 'reta-cagri', '2026-10-25')).toBe('vial-reta-cagri')
    expect(vialIdForDate(vials, 'aod9604', '2026-10-24')).toBe('vial-aod-b')
    expect(vialIdForDate(vials, 'aod9604', '2026-10-25')).toBe('vial-aod-c')
    expect(vialIdForDate(vials, 'tesamorelin', '2026-10-24')).toBe('vial-tesa-a')
    expect(vialIdForDate(vials, 'tesamorelin', '2026-10-25')).toBe('vial-tesa-b')
    expect(vialIdForDate(vials, 'amino1mq', '2026-10-24')).toBe('vial-amino1mq-a')
    expect(vialIdForDate(vials, 'amino1mq', '2026-10-25')).toBe('vial-amino1mq-b')
    expect(vialIdForDate(vials, 'motsc', '2026-10-24')).toBe('vial-mots-a')
    expect(vialIdForDate(vials, 'motsc', '2026-10-25')).toBe('vial-mots-b')
    expect(vials.filter((v) => v.compoundId === 'test-cyp')).toHaveLength(1)
    expect(vials.find((v) => v.id === 'vial-test-a')?.replacedAt).toBeUndefined()
    expect(vials.find((v) => v.id === 'vial-ghk-a')?.replacedAt).toBeUndefined()
    expect(vials.find((v) => v.id === 'vial-bpc-a')?.replacedAt).toBe('2026-10-25')
    expect(vials.find((v) => v.id === 'vial-klow-a')?.replacedAt).toBe('2026-10-25')
    expect(vials.find((v) => v.id === 'vial-ss31-b')?.replacedAt).toBe('2026-10-25')
    expect(vials.find((v) => v.id === 'vial-reta-b')?.remainingMg).toBe(0)
    expect(vials.find((v) => v.id === 'vial-aod-b')?.remainingMg).toBe(0)
    expect(vials.find((v) => v.id === 'vial-aod-c')?.remainingMg).toBe(10)
    expect(vials.find((v) => v.id === 'vial-aod-c')?.bacWaterMl).toBe(2)
    expect(vials.find((v) => v.id === 'vial-aod-c')?.vialMg).toBe(10)
    expect(vials.find((v) => v.id === 'vial-reta-cagri')?.remainingMg).toBe(10)
    expect(vials.find((v) => v.id === 'vial-reta-cagri')?.bacWaterMl).toBe(3)
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
    expect(once?.peptides.find((p) => p.id === 'retatrutide')?.endsOn).toBe('2026-10-03')
    expect(once?.peptides.find((p) => p.id === 'reta-cagri')?.schedulePause?.from).toBe(
      '2026-10-04'
    )
    expect(once?.injectionLogs).toEqual(logs)
    expect(refreshProtocolDefinition(once!, 'lxrdgatsby')).toBeNull()
  })

  it('clears reminder copy during the pause and uses the restart stack after', () => {
    expect(getShotsForSlot('sunday', new Date(2026, 9, 4)).body).toBe('')
    expect(getShotsForSlot('sunday', new Date(2026, 9, 4)).shots).toEqual([])
    expect(getShotsForSlot('morning', new Date(2026, 9, 21)).shots).toEqual([])

    const morning = getShotsForSlot('morning', new Date(2026, 9, 26))
    expect(morning.body).toBe('AOD 20u + 5-Amino-1MQ 15u + MOTS-c 4u')
    expect(morning.shots.some((shot) => shot.id === 'aod9604')).toBe(true)

    expect(getShotsForSlot('evening', new Date(2026, 9, 26)).body).toBe('NAD+ 25u')
    expect(getShotsForSlot('evening', new Date(2026, 9, 27)).body).toBe('')
    expect(getShotsForSlot('night', new Date(2026, 9, 25)).body).toContain('Tesamorelin 15u')
    const sunday = getShotsForSlot('sunday', new Date(2026, 9, 25))
    expect(sunday.body).toBe('Reta + Cagri 45u')
    expect(sunday.body).not.toBe('Reta 50u')
    expect(sunday.shots.some((shot) => shot.id === 'test-cyp')).toBe(false)
    expect(sunday.shots.some((shot) => shot.id === 'retatrutide')).toBe(false)
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
    expect(ctx.protocol.note).toContain('1.5 mg')
    expect(ctx.protocol.note).toContain('45')
    expect(ctx.protocol.note).not.toContain('Nov 21')
    expect(ctx.protocol.compounds.some((c) => c.id === 'retatrutide')).toBe(false)
    expect(ctx.protocol.compounds.find((c) => c.id === 'reta-cagri')?.units).toBe(45)
  })
})
