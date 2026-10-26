import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RECONSTITUTION_QUIZ_SCORED } from '../../constants/reconstitutionQuiz'
import { ReconstitutionGuide } from './ReconstitutionGuide'

describe('reconstitution guide 80 mg vials', () => {
  it('shows the 80 mg / 3 mL concentration and unit formula', () => {
    render(<ReconstitutionGuide variant="content" />)

    const row = screen.getByText((_, node) => {
      if (node?.tagName !== 'LI') return false
      const text = node.textContent ?? ''
      return text.includes('80mg vial') && text.includes('300 units (3mL)')
    })
    expect(row.textContent).toMatch(/Concentration = 80 mg ÷ 3 mL = 26\.67 mg\/mL/)
    expect(row.textContent).toMatch(/Units for desired mg = \(desired_mg \/ 26\.67\) \* 100/)
    expect(row.textContent).toMatch(/3\.75 units on U-100/)
    expect(row.textContent).toMatch(/display as ~4 units/)
    expect(row.textContent).toMatch(/80 mg vial \+ 3 mL BAC ≈ 26\.67 mg\/mL\. 1 mg ≈ 4 units\./)
  })
})

describe('onboarding reconstitution quiz', () => {
  it('teaches 3.0 mL for an 80 mg vial', () => {
    const question = RECONSTITUTION_QUIZ_SCORED.find((item) => item.id === 'bac-80mg')
    expect(question?.correctOptionId).toBe('300')
    expect(question?.explanation).toMatch(/26\.67 mg\/mL/)
    expect(question?.explanation).toMatch(/3\.75 units/)
    expect(question?.explanation).toMatch(/~4 units/)
  })
})
