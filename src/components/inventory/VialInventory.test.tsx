import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { InjectionLog, Peptide } from '../../types'
import type { Vial } from '../../types/v2'
import { ToastProvider } from '../ui/Toast'
import { getInjectionsForDate, isPeptideOnActiveStack } from '../../utils/peptideSchedule'
import { describeShelfLife, formatVialDate, todayIso } from '../../utils/vialShelfLife'
import { VialInventory } from './VialInventory'

function renderInventory() {
  return render(
    <ToastProvider>
      <VialInventory peptides={[]} />
    </ToastProvider>
  )
}

describe('New vial form', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('opens with no peptide selected and lists the fused compounds', () => {
    renderInventory()
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    const compound = screen.getByLabelText('Compound')
    expect(compound).toHaveValue('')
    expect(screen.getByRole('option', { name: 'Select peptide…' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Reta + Cagrilintide' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Selank + Semax' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Retatrutide' })).toBeInTheDocument()
    expect(screen.getByLabelText('Vial mg')).toHaveValue(null)
    expect(screen.getByLabelText('BAC mL')).toHaveValue(null)
    expect(screen.getByText('Concentration: —')).toBeInTheDocument()
  })

  it('fills library defaults, lets the user edit them, and saves the vial', () => {
    renderInventory()
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    fireEvent.change(screen.getByLabelText('Compound'), { target: { value: 'reta-cagri' } })
    expect(screen.getByLabelText('Vial mg')).toHaveValue(10)
    expect(screen.getByLabelText('BAC mL')).toHaveValue(3)
    expect(screen.getByText(/Concentration: 3\.333 mg\/mL/)).toBeInTheDocument()
    expect(screen.getByText(/Typical start: 45 u/)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Compound'), { target: { value: 'tesamorelin' } })
    expect(screen.getByLabelText('Vial mg')).toHaveValue(20)
    expect(screen.getByLabelText('BAC mL')).toHaveValue(3)

    fireEvent.change(screen.getByLabelText('BAC mL'), { target: { value: '4' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save vial' }))

    expect(screen.getByText('Tesamorelin')).toBeInTheDocument()
    expect(screen.getByText(/4 mL BAC/)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`Opened: ${formatVialDate(todayIso())}`))).toBeInTheDocument()
    expect(screen.getByText(/Expires:/)).toBeInTheDocument()
  })
})

function sampleVial(overrides: Partial<Vial> = {}): Vial {
  return {
    id: 'vial-dsip-a',
    compoundName: 'DSIP',
    compoundId: 'dsip',
    vialMg: 10,
    bacWaterMl: 2,
    concentrationMgPerMl: 5,
    mixedDate: '2026-10-25',
    isPowder: false,
    remainingMg: 10,
    createdAt: '2026-10-25T12:00:00.000Z',
    depleted: false,
    ...overrides,
  }
}

const dsipPeptide: Peptide = {
  id: 'dsip',
  name: 'DSIP',
  dose: '100mcg',
  frequency: 'daily',
}

const tesaPeptide: Peptide = {
  id: 'tesamorelin',
  name: 'Tesamorelin',
  dose: '1mg',
  frequency: 'daily',
}

describe('Vial opened date, expiration, and remove', () => {
  it('adds a fresh KLOW 80 mg vial and does not bring the archived vial back', () => {
    const archived = {
      id: 'vial-klow-a',
      compoundName: 'KLOW',
      compoundId: 'klow',
      vialMg: 10,
      bacWaterMl: 3,
      concentrationMgPerMl: 3.33,
      mixedDate: '2026-08-23',
      isPowder: false,
      remainingMg: 0,
      depleted: true,
      replacedAt: '2026-10-03',
      finishedAt: '2026-10-03',
      notes: 'Vial A · archived Oct 25. KLOW stopped. 10 mg / 3 mL.',
      createdAt: '2026-08-23T12:00:00.000Z',
    }
    const klow: Peptide = {
      id: 'klow',
      name: 'KLOW',
      dose: '0.5mg',
      frequency: 'daily',
      endsOn: '2026-10-03',
      protocol: {
        vialMg: 10,
        bacWaterUnits: 300,
        bacWaterMl: 3,
        concentrationMgPerMl: 3.33,
        concentrationLabel: '3.33 mg/mL',
        startingDoseMg: 0.5,
        startingDoseLabel: '0.5 mg',
        startingSyringeUnits: 15,
        reconstituted: true,
        calculationSummary: 'old',
        reconstitutionSteps: [],
        titration: [],
      },
    }
    const onInventoryChange = vi.fn()
    render(
      <ToastProvider>
        <VialInventory
          initialVials={[archived]}
          peptides={[klow]}
          onInventoryChange={onInventoryChange}
        />
      </ToastProvider>
    )
    expect(screen.getByText(/KLOW stopped/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.change(screen.getByLabelText('Compound'), { target: { value: 'klow' } })
    expect(screen.getByLabelText('Vial mg')).toHaveValue(80)
    expect(screen.getByLabelText('BAC mL')).toHaveValue(3)
    fireEvent.click(screen.getByRole('button', { name: 'Save vial' }))

    expect(screen.queryByText(/KLOW stopped/)).not.toBeInTheDocument()
    expect(screen.getByText(/80 mg vial/)).toBeInTheDocument()
    expect(screen.getByText(/3 mL BAC/)).toBeInTheDocument()
    expect(screen.getAllByText('KLOW')).toHaveLength(1)

    const [vials, peptides] = onInventoryChange.mock.calls.at(-1) as [Vial[], Peptide[]]
    expect(vials).toHaveLength(1)
    expect(vials[0]?.id).not.toBe('vial-klow-a')
    expect(vials[0]?.vialMg).toBe(80)
    expect(vials[0]?.bacWaterMl).toBe(3)
    expect(vials[0]?.remainingMg).toBe(80)
    expect(vials[0]?.isPowder).toBe(false)
    expect(vials[0]?.depleted).toBe(false)
    expect(vials[0]?.mixedDate).toBe(todayIso())
    expect(vials[0]?.notes).toBeUndefined()
    const revived = peptides.find((peptide) => peptide.id === 'klow')
    expect(revived?.endsOn).toBeUndefined()
    expect(revived?.startsOn).toBe(todayIso())
    expect(revived?.protocol?.vialMg).toBe(80)
    expect(revived?.protocol?.bacWaterMl).toBe(3)
    expect(revived?.protocol?.startingDoseMg).toBe(1)
    expect(isPeptideOnActiveStack(revived!)).toBe(true)
  })

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows Opened, Expires 28 days later, and days left on each card', () => {
    const vial = sampleVial()
    const shelf = describeShelfLife(vial, todayIso())
    render(
      <ToastProvider>
        <VialInventory initialVials={[vial]} peptides={[dsipPeptide]} />
      </ToastProvider>
    )
    expect(screen.getByText(`Opened: ${shelf.openedLabel}`)).toBeInTheDocument()
    expect(
      screen.getByText(`Expires: ${shelf.expiresLabel} · ${shelf.statusLabel}`)
    ).toBeInTheDocument()
    expect(shelf.expiresIso).toBe('2026-11-22')
  })

  it('leaves expiration blank when the vial has no opened date', () => {
    render(
      <ToastProvider>
        <VialInventory
          initialVials={[sampleVial({ id: 'powder', isPowder: true, mixedDate: '' })]}
        />
      </ToastProvider>
    )
    expect(screen.getByText('Opened: —')).toBeInTheDocument()
    expect(screen.queryByText(/Expires:/)).not.toBeInTheDocument()
  })

  it('recalculates the expiration preview when the opened date is edited', () => {
    render(
      <ToastProvider>
        <VialInventory initialVials={[sampleVial()]} peptides={[dsipPeptide]} />
      </ToastProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByLabelText('Opened date'), {
      target: { value: '2026-10-01' },
    })
    expect(
      screen.getByText(`Expires: ${formatVialDate('2026-10-29')}`, { exact: false })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText(`Opened: ${formatVialDate('2026-10-01')}`)).toBeInTheDocument()
    expect(screen.getByText(/Expires:/)).toHaveTextContent(formatVialDate('2026-10-29'))
    expect(screen.getByRole('button', { name: 'Finished' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  it('Finished still retires the vial and keeps it on file', () => {
    vi.spyOn(window, 'confirm').mockImplementation(
      (message) => message === 'Retire this vial?'
    )
    const onInventoryChange = vi.fn()
    render(
      <ToastProvider>
        <VialInventory
          initialVials={[sampleVial()]}
          peptides={[dsipPeptide]}
          onInventoryChange={onInventoryChange}
        />
      </ToastProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Finished' }))
    expect(screen.getByText('DSIP')).toBeInTheDocument()
    expect(screen.getByText('Replaced')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(onInventoryChange).toHaveBeenCalled()
    const next = onInventoryChange.mock.calls.at(-1)?.[0] as Vial[]
    expect(next).toHaveLength(1)
    expect(next[0]?.id).toBe('vial-dsip-a')
  })

  it('Remove asks, drops the vial from inventory and the active stack, and leaves logs alone', () => {
    const logs: InjectionLog[] = [
      { date: '2026-10-25', peptideId: 'dsip', doseMg: 0.1 },
    ]
    const onInventoryChange = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(
      <ToastProvider>
        <VialInventory
          initialVials={[
            sampleVial(),
            sampleVial({
              id: 'vial-tesa-b',
              compoundName: 'Tesamorelin',
              compoundId: 'tesamorelin',
              mixedDate: '2026-10-01',
            }),
          ]}
          peptides={[dsipPeptide, tesaPeptide]}
          injectionLogs={logs}
          onInventoryChange={onInventoryChange}
        />
      </ToastProvider>
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0])
    expect(window.confirm).toHaveBeenCalledWith('Remove this vial from your inventory?')
    expect(screen.queryByText('DSIP')).not.toBeInTheDocument()
    expect(screen.getByText('Tesamorelin')).toBeInTheDocument()
    const [nextVials, nextPeptides] = onInventoryChange.mock.calls.at(-1) as [
      Vial[],
      Peptide[] | undefined,
    ]
    expect(nextVials.map((vial) => vial.id)).toEqual(['vial-tesa-b'])
    const dsip = nextPeptides?.find((peptide) => peptide.id === 'dsip')
    const tesa = nextPeptides?.find((peptide) => peptide.id === 'tesamorelin')
    expect(dsip?.endsOn).toBeTruthy()
    expect(isPeptideOnActiveStack(dsip!)).toBe(false)
    expect(
      getInjectionsForDate(nextPeptides!, new Date(), '2026-08-23').some(
        (shot) => shot.peptideId === 'dsip'
      )
    ).toBe(false)
    expect(tesa?.endsOn).toBeUndefined()
    expect(isPeptideOnActiveStack(tesa!)).toBe(true)
    expect(logs).toEqual([{ date: '2026-10-25', peptideId: 'dsip', doseMg: 0.1 }])
  })

  it('removes one vial from the stack and leaves the other vial of that compound', () => {
    const onInventoryChange = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(
      <ToastProvider>
        <VialInventory
          initialVials={[
            sampleVial(),
            sampleVial({ id: 'vial-dsip-b', mixedDate: '2026-11-01' }),
          ]}
          peptides={[dsipPeptide]}
          onInventoryChange={onInventoryChange}
        />
      </ToastProvider>
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0])
    expect(screen.getAllByText('DSIP')).toHaveLength(1)
    const [nextVials, nextPeptides] = onInventoryChange.mock.calls.at(-1) as [
      Vial[],
      Peptide[],
    ]
    expect(nextVials.map((vial) => vial.id)).toEqual(['vial-dsip-a'])
    expect(isPeptideOnActiveStack(nextPeptides[0])).toBe(false)
  })

  it('stays gone when a stale inventory list is pushed back', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const vial = sampleVial()
    const { rerender } = render(
      <ToastProvider>
        <VialInventory initialVials={[vial]} peptides={[dsipPeptide]} />
      </ToastProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()

    rerender(
      <ToastProvider>
        <VialInventory initialVials={[vial]} peptides={[dsipPeptide]} />
      </ToastProvider>
    )
    window.dispatchEvent(new CustomEvent('pt-data-updated', { detail: 'vials' }))
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
    })
    expect(screen.queryByText(/Opened:/)).not.toBeInTheDocument()
  })

  it('leaves the vial in place when removal is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const onInventoryChange = vi.fn()
    render(
      <ToastProvider>
        <VialInventory
          initialVials={[sampleVial()]}
          onInventoryChange={onInventoryChange}
        />
      </ToastProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(screen.getByText('DSIP')).toBeInTheDocument()
    expect(onInventoryChange).not.toHaveBeenCalled()
  })
})
