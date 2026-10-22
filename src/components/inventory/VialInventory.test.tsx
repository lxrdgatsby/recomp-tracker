import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ToastProvider } from '../ui/Toast'
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
  })
})
