import { beforeEach, describe, expect, it } from 'vitest'
import type { InjectionLog, Peptide } from '../types'
import type { DoseLog, Vial } from '../types/v2'
import { loadDoseLogs, loadVials, saveDoseLogs } from './inventoryStorage'
import {
  commitMarkedDose,
  dosesLeftOnVial,
  expiresLabelForVial,
  formatDoseTime,
  linkedMixedVial,
  markScheduledDoseDone,
  vialMetaForPeptide,
} from './todayDose'

const DAY = '2026-10-25'
const NOW = new Date(2026, 9, 25, 7, 5, 0)

function peptide(
  id = 'aod9604',
  name = 'AOD-9604',
  doseMg = 0.5,
  units = 10
): Peptide {
  return {
    id,
    name,
    dose: `${doseMg} mg`,
    frequency: 'daily',
    timing: 'Morning, fasted',
    protocol: {
      vialMg: 10,
      bacWaterUnits: 200,
      bacWaterMl: 2,
      concentrationMgPerMl: 5,
      concentrationLabel: '5 mg/mL',
      startingDoseMg: doseMg,
      startingDoseLabel: `${doseMg} mg`,
      startingSyringeUnits: units,
      reconstituted: true,
      calculationSummary: '',
      reconstitutionSteps: [],
      titration: [],
    },
  }
}

function vial(overrides: { id: string; compoundId: string } & Partial<Vial>): Vial {
  const mixedDate = overrides.mixedDate ?? '2026-10-25'
  return {
    compoundName: overrides.compoundName ?? overrides.compoundId,
    vialMg: 10,
    bacWaterMl: 2,
    concentrationMgPerMl: 5,
    mixedDate,
    isPowder: false,
    remainingMg: 10,
    createdAt: `${mixedDate}T12:00:00.000Z`,
    depleted: false,
    ...overrides,
  }
}

function doseLog(overrides: Partial<DoseLog> & Pick<DoseLog, 'id' | 'compoundName'>): DoseLog {
  return {
    date: '2026-10-01T08:00:00',
    doseMg: 0.25,
    units: 5,
    taken: true,
    createdAt: '2026-10-01T08:00:00.000Z',
    ...overrides,
  }
}

describe('today dose mark done', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('links the newest mixed vial that still has doses', () => {
    const older = vial({
      id: 'old',
      compoundId: 'aod9604',
      mixedDate: '2026-09-01',
      createdAt: '2026-09-01T00:00:00.000Z',
    })
    const powder = vial({
      id: 'powder',
      compoundId: 'aod9604',
      mixedDate: '2026-10-30',
      isPowder: true,
      createdAt: '2026-10-30T00:00:00.000Z',
    })
    const replaced = vial({
      id: 'replaced',
      compoundId: 'aod9604',
      mixedDate: '2026-10-28',
      replacedAt: '2026-10-29',
      createdAt: '2026-10-28T00:00:00.000Z',
    })
    const emptyNew = vial({
      id: 'empty-new',
      compoundId: 'aod9604',
      mixedDate: '2026-10-24',
      remainingMg: 0,
      depleted: true,
      createdAt: '2026-10-24T00:00:00.000Z',
    })
    const current = vial({
      id: 'current',
      compoundId: 'aod9604',
      mixedDate: '2026-10-20',
      createdAt: '2026-10-20T00:00:00.000Z',
    })
    const other = vial({ id: 'bpc', compoundId: 'bpc157', mixedDate: '2026-10-31' })

    expect(
      linkedMixedVial([older, powder, replaced, emptyNew, current, other], 'aod9604')?.id
    ).toBe('current')
  })

  it('uses the newest empty mixed vial when none still have doses', () => {
    const older = vial({
      id: 'old',
      compoundId: 'aod9604',
      mixedDate: '2026-09-01',
      remainingMg: 0,
      depleted: true,
    })
    const newer = vial({
      id: 'new',
      compoundId: 'aod9604',
      mixedDate: '2026-10-20',
      remainingMg: 0,
      depleted: true,
    })
    expect(linkedMixedVial([older, newer], 'aod9604')?.id).toBe('new')
  })

  it('shows stored expiration, otherwise opened date plus 28 days', () => {
    expect(
      expiresLabelForVial({
        mixedDate: '2026-10-25',
        isPowder: false,
        expiresOn: '2026-12-01',
      })
    ).toBe('Dec 1, 2026')
    expect(
      expiresLabelForVial({ mixedDate: '2026-10-25', isPowder: false })
    ).toBe('Nov 22, 2026')
    expect(expiresLabelForVial({ mixedDate: '', isPowder: false })).toBe('—')
    expect(
      expiresLabelForVial({ mixedDate: '2026-10-25', isPowder: true })
    ).toBe('—')

    const meta = vialMetaForPeptide(
      [vial({ id: 'current', compoundId: 'aod9604', mixedDate: '2026-10-25' })],
      peptide(),
      '2026-08-23',
      NOW
    )
    expect(meta.expiresLabel).toBe('Nov 22, 2026')
    expect(meta.dosesLeft).toBe(20)
    expect(meta.empty).toBe(false)
  })

  it('logs the dose once, subtracts it from that vial, and keeps older logs', () => {
    const history: InjectionLog = {
      date: '2026-10-01',
      peptideId: 'aod9604',
      peptideName: 'AOD-9604',
      doseMg: 0.5,
      units: 10,
      vialId: 'old',
      injectionSite: 'Thigh Left',
    }
    const otherPeptide: InjectionLog = {
      date: '2026-10-02',
      peptideId: 'bpc157',
      doseMg: 0.25,
      units: 5,
    }
    const older = vial({
      id: 'old',
      compoundId: 'aod9604',
      mixedDate: '2026-09-01',
      remainingMg: 8,
      createdAt: '2026-09-01T00:00:00.000Z',
    })
    const newer = vial({
      id: 'new',
      compoundId: 'aod9604',
      mixedDate: '2026-10-20',
      remainingMg: 10,
      createdAt: '2026-10-20T00:00:00.000Z',
    })
    const untouched = vial({
      id: 'bpc',
      compoundId: 'bpc157',
      remainingMg: 4,
      mixedDate: '2026-10-01',
    })
    const logs = [history, otherPeptide]
    const vials = [older, newer, untouched]
    const beforeLeft = dosesLeftOnVial(newer, peptide(), '2026-08-23', NOW)

    const result = markScheduledDoseDone({
      vials,
      peptides: [peptide(), peptide('bpc157', 'BPC-157', 0.25, 5)],
      startDate: '2026-08-23',
      date: DAY,
      peptideId: 'aod9604',
      logs,
      now: NOW,
    })

    expect(logs).toHaveLength(2)
    expect(older.remainingMg).toBe(8)
    expect(result.created).toBe(true)
    expect(result.logs[0]).toBe(history)
    expect(result.logs[1]).toBe(otherPeptide)
    expect(result.logs[2]).toMatchObject({
      date: DAY,
      peptideId: 'aod9604',
      peptideName: 'AOD-9604',
      doseMg: 0.5,
      units: 10,
      vialId: 'new',
      time: formatDoseTime(NOW),
      injectionSite: 'Thigh Left',
    })
    expect(result.vials.find((item) => item.id === 'old')).toBe(older)
    expect(result.vials.find((item) => item.id === 'bpc')).toBe(untouched)
    expect(result.vials.find((item) => item.id === 'new')?.remainingMg).toBe(9.5)
    const afterLeft = dosesLeftOnVial(
      result.vials.find((item) => item.id === 'new'),
      peptide(),
      '2026-08-23',
      NOW
    )
    expect(beforeLeft).toBe(20)
    expect(afterLeft).toBe(19)

    const again = markScheduledDoseDone({
      vials: result.vials,
      peptides: [peptide()],
      startDate: '2026-08-23',
      date: DAY,
      peptideId: 'aod9604',
      logs: result.logs,
      now: NOW,
    })
    expect(again.created).toBe(false)
    expect(again.logs).toBe(result.logs)
    expect(again.vials.find((item) => item.id === 'new')?.remainingMg).toBe(9.5)
  })

  it('does not log or subtract when the linked vial is empty', () => {
    const empty = vial({
      id: 'new',
      compoundId: 'aod9604',
      remainingMg: 0,
      depleted: true,
    })
    const logs: InjectionLog[] = [
      { date: '2026-10-01', peptideId: 'aod9604', doseMg: 0.5, units: 10 },
    ]
    const result = markScheduledDoseDone({
      vials: [empty],
      peptides: [peptide()],
      startDate: '2026-08-23',
      date: DAY,
      peptideId: 'aod9604',
      logs,
      now: NOW,
    })
    expect(result.created).toBe(false)
    expect(result.logs).toBe(logs)
    expect(result.vials[0]).toBe(empty)
    expect(
      vialMetaForPeptide([empty], peptide(), '2026-08-23', NOW)
    ).toMatchObject({ dosesLeft: 0, empty: true })
  })

  it('copies a newer saved site and appends a dose log without erasing history', () => {
    const prior = doseLog({
      id: 'old-dose',
      compoundName: 'BPC-157',
      compoundId: 'bpc157',
      injectionSite: 'Abdomen Right',
    })
    const previousAod = doseLog({
      id: 'old-aod',
      compoundName: 'AOD-9604',
      compoundId: 'aod9604',
      date: '2026-10-20T09:00:00',
      injectionSite: 'Abdomen Left',
    })
    saveDoseLogs([prior, previousAod])
    const current = vial({ id: 'new', compoundId: 'aod9604', remainingMg: 10 })

    const first = commitMarkedDose({
      vials: [current],
      peptides: [peptide()],
      startDate: '2026-08-23',
      date: DAY,
      peptideId: 'aod9604',
      logs: [],
      now: NOW,
    })

    expect(first.created).toBe(true)
    expect(first.logs[0]?.injectionSite).toBe('Abdomen Left')
    expect(loadVials().find((item) => item.id === 'new')?.remainingMg).toBe(9.5)
    const saved = loadDoseLogs()
    expect(saved.map((item) => item.id)).toEqual(
      expect.arrayContaining(['old-dose', 'old-aod'])
    )
    expect(saved.filter((item) => item.compoundId === 'bpc157')).toHaveLength(1)
    expect(saved.filter((item) => item.id === 'old-aod')[0]?.injectionSite).toBe(
      'Abdomen Left'
    )
    const created = saved.find((item) => item.date.startsWith(DAY) && item.compoundId === 'aod9604')
    expect(created).toMatchObject({
      compoundName: 'AOD-9604',
      doseMg: 0.5,
      units: 10,
      vialId: 'new',
      injectionSite: 'Abdomen Left',
      taken: true,
    })

    const second = commitMarkedDose({
      vials: first.vials,
      peptides: [peptide()],
      startDate: '2026-08-23',
      date: DAY,
      peptideId: 'aod9604',
      logs: first.logs,
      now: NOW,
    })
    expect(second.created).toBe(false)
    expect(loadDoseLogs().filter((item) => item.date.startsWith(DAY))).toHaveLength(1)
    expect(loadVials().find((item) => item.id === 'new')?.remainingMg).toBe(9.5)
  })
})
