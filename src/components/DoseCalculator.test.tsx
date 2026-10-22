import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DoseCalculator } from './DoseCalculator'

describe('Dose Calculator Selank + Semax', () => {
  it('returns ~7.5 units for 250 mcg of each and 15 units for 500 mcg', () => {
    render(<DoseCalculator initialPeptideId="selank-semax" />)

    expect(screen.getByRole('option', { name: 'Selank + Semax' })).toBeInTheDocument()
    expect(screen.getByText(/3\.33 mg\/mL each/)).toBeInTheDocument()
    expect(screen.getByText(/no published human SC trials/i)).toBeInTheDocument()
    const dose = screen.getByDisplayValue('250')
    expect(screen.getByText('7.5 units')).toBeInTheDocument()

    fireEvent.change(dose, { target: { value: '500' } })
    expect(screen.getByText('15 units')).toBeInTheDocument()
  })
})
