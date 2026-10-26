import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PeptideSelector } from './PeptideSelector'

describe('onboarding peptide picker', () => {
  it('lists Reta + Cagrilintide with the 1.5 mg / 2-week start', () => {
    render(<PeptideSelector variant="onboarding" selections={[]} onChange={() => undefined} />)
    const option = screen.getByRole('option', { name: /Reta \+ Cagrilintide/i })
    expect(option.textContent).toMatch(/1\.5 mg/)
    expect(option.textContent).toMatch(/2 weeks/)
  })

  it('lists KLOW with the 80 mg / 3 mL default', () => {
    render(<PeptideSelector variant="onboarding" selections={[]} onChange={() => undefined} />)
    const option = screen.getByRole('option', { name: /KLOW/i })
    expect(option.textContent).toMatch(/80 mg/)
    expect(option.textContent).toMatch(/3 mL/)
    expect(option.textContent).toMatch(/3\.75/)
  })

  it('fills 80 mg / 3 mL and the recon note when KLOW or an 80 mg vial is selected', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <PeptideSelector variant="onboarding" selections={[]} onChange={onChange} />
    )
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'klow' } })
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        catalogId: 'klow',
        dose: '80mg',
        bacWaterUnits: 300,
      }),
    ])

    rerender(
      <PeptideSelector
        variant="onboarding"
        selections={[
          {
            catalogId: 'klow',
            dose: '80mg',
            status: 'interested',
            bacWaterUnits: 300,
            reconstituted: false,
          },
          {
            catalogId: 'bpc157',
            dose: '80mg',
            status: 'interested',
            bacWaterUnits: 300,
            reconstituted: false,
          },
        ]}
        onChange={onChange}
      />
    )

    expect(screen.getByLabelText('KLOW vial size')).toHaveValue('80mg')
    expect(screen.getByLabelText('BPC-157 vial size')).toHaveValue('80mg')
    expect(screen.getAllByRole('button', { name: '300 units (3ml)', pressed: true })).toHaveLength(2)
    expect(
      screen.getAllByText(/80 mg vial \+ 3 mL BAC ≈ 26\.67 mg\/mL\. 1 mg ≈ 4 units\./)
    ).toHaveLength(2)
    expect(screen.getAllByText(/Concentration: ~26\.67 mg\/mL/).length).toBe(2)
  })

  it('lists Selank + Semax fused with the 3 mL / ~8 unit start', () => {
    render(<PeptideSelector variant="onboarding" selections={[]} onChange={() => undefined} />)
    const option = screen.getByRole('option', { name: /Selank \+ Semax/i })
    expect(option.textContent).toMatch(/3 mL/)
    expect(option.textContent).toMatch(/~8 u/)
    expect(option.textContent).toMatch(/250 mcg/)
  })
})
