export interface QuizQuestion {
  id: string
  prompt: string
  options: { id: string; label: string }[]
  correctOptionId: string
  explanation: string
}

export const RECONSTITUTION_QUIZ: QuizQuestion[] = [
  {
    id: 'bac-familiarity',
    prompt:
      'Are you familiar with how to reconstitute your peptide vials with bacteriostatic water (BAC)?',
    options: [
      { id: 'yes-process', label: 'Yes — I know the general reconstitution process' },
      { id: 'no-process', label: 'No — I need to learn the basics first' },
    ],
    correctOptionId: 'yes-process',
    explanation:
      'That is okay — the next questions will teach the standard U-100 syringe volumes for common vial sizes.',
  },
  {
    id: 'bac-5mg',
    prompt:
      'For a 5mg peptide vial, how many units of bacteriostatic water should you draw into the vial using a U-100 insulin syringe for proper potency?',
    options: [
      { id: '50', label: '50 units' },
      { id: '100', label: '100 units' },
      { id: '200', label: '200 units' },
      { id: '300', label: '300 units' },
    ],
    correctOptionId: '100',
    explanation:
      'A 5mg vial uses 100 units of BAC (1ml) — standard for proper concentration with a U-100 syringe.',
  },
  {
    id: 'bac-10mg',
    prompt:
      'For a 10mg peptide vial, how many units of bacteriostatic water should you add?',
    options: [
      { id: '100', label: '100 units' },
      { id: '150', label: '150 units' },
      { id: '200', label: '200 units' },
      { id: '300', label: '300 units' },
    ],
    correctOptionId: '200',
    explanation:
      'A 10mg vial uses 200 units of BAC (2ml) for the correct concentration and dosing math.',
  },
  {
    id: 'bac-15mg',
    prompt:
      'For a 15mg peptide vial, how many units of bacteriostatic water should you add?',
    options: [
      { id: '100', label: '100 units' },
      { id: '200', label: '200 units' },
      { id: '300', label: '300 units' },
      { id: '400', label: '400 units' },
    ],
    correctOptionId: '300',
    explanation:
      'A 15mg vial uses 300 units of BAC (3ml) — match BAC volume to vial size for accurate syringe units.',
  },
]

/** Skip the self-assessment question — only score the 3 BAC volume questions. */
export const RECONSTITUTION_QUIZ_SCORED = RECONSTITUTION_QUIZ.filter(
  (q) => q.id.startsWith('bac-') && q.id !== 'bac-familiarity'
)