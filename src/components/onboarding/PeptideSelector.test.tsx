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

  it('lists KLOW with the 80 mg / 3 mL default', () => {
    render(<PeptideSelector variant="onboarding" selections={[]} onChange={() => undefined} />)
    const option = screen.getByRole('option', { name: /KLOW/i })
    expect(option.textContent).toMatch(/80 mg/)
    expect(option.textContent).toMatch(/3 mL/)
    expect(option.textContent).toMatch(/3\.75/)
  })

  it('lists Selank + Semax fused with the 3 mL / ~8 unit start', () => {
    render(<PeptideSelector variant="onboarding" selections={[]} onChange={() => undefined} />)
    const option = screen.getByRole('option', { name: /Selank \+ Semax/i })
    expect(option.textContent).toMatch(/3 mL/)
    expect(option.textContent).toMatch(/~8 u/)
    expect(option.textContent).toMatch(/250 mcg/)
  })
})
