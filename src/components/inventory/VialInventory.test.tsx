import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { InjectionLog, Peptide } from '../../types'
import type { Vial } from '../../types/v2'
import { ToastProvider } from '../ui/Toast'
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

describe('Vial opened date, expiration, and remove', () => {
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
          initialVials={[sampleVial()]}
          peptides={[dsipPeptide]}
          injectionLogs={logs}
          onInventoryChange={onInventoryChange}
        />
      </ToastProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(window.confirm).toHaveBeenCalledWith('Remove this vial from your inventory?')
    expect(screen.queryByText(/Opened:/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
    const [nextVials, nextPeptides] = onInventoryChange.mock.calls.at(-1) as [
      Vial[],
      Peptide[] | undefined,
    ]
    expect(nextVials).toEqual([])
    expect(nextPeptides?.map((peptide) => peptide.id)).toEqual([])
    expect(logs).toEqual([{ date: '2026-10-25', peptideId: 'dsip', doseMg: 0.1 }])
  })

  it('keeps the peptide when another current vial of that compound remains', () => {
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
    expect(onInventoryChange.mock.calls.at(-1)?.[1]).toBeUndefined()
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
