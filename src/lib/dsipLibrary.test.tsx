import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PeptideSelector } from '../components/onboarding/PeptideSelector'
import { ToastProvider } from '../components/ui/Toast'
import { VialInventory } from '../components/inventory/VialInventory'
import DoseCalculator from '../components/DoseCalculator'
import { recommendedBacWaterForVial } from '../constants/peptideCatalog'
import { previewStartingDose } from '../utils/recompProtocol'

describe('DSIP library surfaces', () => {
  afterEach(() => {
    cleanup()
  })

  it('onboarding picker selects DSIP at 10 mg / 2 mL and 2 units', () => {
    expect(recommendedBacWaterForVial('10mg')).toBe(200)
    const preview = previewStartingDose(
      {
        catalogId: 'dsip',
        dose: '10mg',
        status: 'interested',
        bacWaterUnits: 200,
        reconstituted: false,
      },
      'beginner'
    )
    expect(preview?.syringeUnits).toBe(2)
    expect(preview?.summary).toContain('10mg')
    expect(preview?.summary).toContain('200 units')

    render(<PeptideSelector selections={[]} onChange={() => {}} />)
    const picker = screen.getByRole('combobox')
    expect(screen.getByRole('option', { name: /DSIP — Delta Sleep-Inducing Peptide/ })).toBeTruthy()
    fireEvent.change(picker, { target: { value: 'dsip' } })
  })

  it('shows the research note and 10 mg vial after DSIP is selected', () => {
    render(
      <PeptideSelector
        variant="onboarding"
        selections={[
          {
            catalogId: 'dsip',
            dose: '10mg',
            status: 'interested',
            bacWaterUnits: 200,
            reconstituted: false,
          },
        ]}
        onChange={() => {}}
      />
    )
    expect(screen.getByText(/Research-use only/i)).toBeTruthy()
    expect(screen.getByText(/published human data is mostly IV/i)).toBeTruthy()
    expect(screen.getByLabelText('DSIP vial size')).toHaveValue('10mg')
    const bac = screen.getByRole('button', { name: '200 units (2ml)' })
    expect(bac.className).toContain('emerald')
    expect(screen.getAllByText(/draw 2 units/i).length).toBeGreaterThan(0)
  })

  it('Add vial dropdown auto-fills 10 mg / 2 mL for DSIP', () => {
    render(
      <ToastProvider>
        <VialInventory peptides={[]} />
      </ToastProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    const picker = screen.getByLabelText('Compound')
    expect(screen.getByRole('option', { name: 'DSIP' })).toBeTruthy()
    fireEvent.change(picker, { target: { value: 'dsip' } })
    expect(screen.getByLabelText('Vial mg')).toHaveValue(10)
    expect(screen.getByLabelText('BAC mL')).toHaveValue(2)
    expect(screen.getByText(/SC is community practice/i)).toBeTruthy()
  })

  it('Dose Calculator auto-fills 10 mg / 2 mL and 100 mcg = 2 units', () => {
    const view = render(<DoseCalculator />)
    const compound = screen.getAllByRole('combobox')[0]
    fireEvent.change(compound, { target: { value: 'dsip' } })
    const inputs = view.container.querySelectorAll('input')
    expect(inputs[0]?.value).toBe('10')
    expect(inputs[1]?.value).toBe('2')
    expect(inputs[2]?.value).toBe('100')
    expect(screen.getByText('2 units')).toBeTruthy()
    expect(screen.getByText(/Research-use only/i)).toBeTruthy()
  })
})
