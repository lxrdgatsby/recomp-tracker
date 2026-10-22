import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PeptideSelector } from './PeptideSelector'

describe('onboarding peptide picker', () => {
  it('lists Reta + Cagrilintide with the 1.5 mg / 2-week start', () => {
    render(<PeptideSelector variant="onboarding" selections={[]} onChange={() => undefined} />)
    const option = screen.getByRole('option', { name: /Reta \+ Cagrilintide/i })
    expect(option.textContent).toMatch(/1\.5 mg/)
    expect(option.textContent).toMatch(/2 weeks/)
  })
})
