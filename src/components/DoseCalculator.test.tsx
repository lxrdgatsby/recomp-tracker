import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DoseCalculator } from './DoseCalculator'

describe('Dose Calculator KLOW 80 mg', () => {
  it('defaults to 80 mg / 3 mL and 1 mg ≈ 3.75 units', () => {
    render(<DoseCalculator initialPeptideId="klow" />)

    expect(screen.getByRole('option', { name: 'KLOW' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('80')).toBeInTheDocument()
    expect(screen.getByDisplayValue('3')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1')).toBeInTheDocument()
    expect(screen.getByText('4 units')).toBeInTheDocument()
    expect(screen.getAllByText(/26\.67 mg\/mL/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/1 mg ≈ 3\.75 units/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/override units/i).length).toBeGreaterThan(0)
  })
})

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
