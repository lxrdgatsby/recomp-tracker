import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TodayDosesSection, type TodayDoseItem } from './TodayDosesSection'

const aod: TodayDoseItem = {
  peptideId: 'aod9604',
  peptideName: 'AOD-9604',
  dose: '20 units on U-100',
  timing: 'Morning, fasted',
  done: false,
}

function renderDoses(
  item: TodayDoseItem = aod,
  meta = { dosesLeft: 18, totalDoses: 20, expiresLabel: 'Nov 22, 2026', empty: false },
  onMarkDone = vi.fn()
) {
  return render(
    <TodayDosesSection
      injections={[item]}
      peptides={[]}
      startDate="2026-08-23"
      vialMeta={{ [item.peptideId]: meta }}
      onMarkDone={onMarkDone}
      onLogUnscheduled={vi.fn()}
    />
  )
}

describe('Today’s doses', () => {
  it('shows one Mark Done button plus doses left and expiration', () => {
    renderDoses()

    expect(screen.getByRole('button', { name: 'Mark Done' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: /^Log$/ })).not.toBeInTheDocument()
    expect(screen.getByText('20 units on U-100')).toBeInTheDocument()
    expect(screen.getByText('Morning, fasted')).toBeInTheDocument()
    expect(screen.getByText('Total 20 / 18 doses left')).toBeInTheDocument()
    expect(screen.getByText('Expires: Nov 22, 2026')).toBeInTheDocument()
  })

  it('marks the dose done and drops doses left by one on tap', () => {
    const onMarkDone = vi.fn(() => new Promise<boolean>(() => {}))
    renderDoses(aod, { dosesLeft: 18, totalDoses: 20, expiresLabel: 'Nov 22, 2026', empty: false }, onMarkDone)

    fireEvent.click(screen.getByRole('button', { name: 'Mark Done' }))

    expect(onMarkDone).toHaveBeenCalledTimes(1)
    expect(onMarkDone).toHaveBeenCalledWith('aod9604')
    expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled()
    expect(screen.getByText('Total 20 / 17 doses left')).toBeInTheDocument()
    expect(screen.queryByText('Total 20 / 18 doses left')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark Done' })).not.toBeInTheDocument()
  })

  it('keeps an already logged dose on Done', () => {
    const onMarkDone = vi.fn()
    renderDoses({ ...aod, done: true }, undefined, onMarkDone)

    expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(onMarkDone).not.toHaveBeenCalled()
  })

  it('disables Mark Done and shows a dash when the vial is empty or unopened', () => {
    const onMarkDone = vi.fn()
    const { rerender } = renderDoses(
      aod,
      { dosesLeft: 0, totalDoses: 10, expiresLabel: 'Nov 22, 2026', empty: true },
      onMarkDone
    )

    expect(screen.getByText('Total 10 / 0 doses left')).toBeInTheDocument()
    expect(screen.getByText('Vial empty')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark Done' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Mark Done' }))
    expect(onMarkDone).not.toHaveBeenCalled()

    rerender(
      <TodayDosesSection
        injections={[aod]}
        peptides={[]}
        startDate="2026-08-23"
        vialMeta={{
          aod9604: { dosesLeft: null, totalDoses: null, expiresLabel: '—', empty: false },
        }}
        onMarkDone={onMarkDone}
        onLogUnscheduled={vi.fn()}
      />
    )
    expect(screen.getByText('Doses left: —')).toBeInTheDocument()
    expect(screen.getByText('Expires: —')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark Done' })).toBeEnabled()
  })
})
