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
      'For a 5mg peptide vial, how many units of bacteriostatic water should you draw into the vial using a U-100 insulin syringe?',
    options: [
      { id: '50', label: '50 units (0.5mL)' },
      { id: '100', label: '100 units (1mL)' },
      { id: '200', label: '200 units (2mL)' },
      { id: '300', label: '300 units (3mL)' },
    ],
    correctOptionId: '100',
    explanation: 'A 5mg vial uses 100 units of BAC (1mL).',
  },
  {
    id: 'bac-10mg',
    prompt: 'For a 10mg peptide vial, how much bacteriostatic water should you add?',
    options: [
      { id: '100', label: '100 units (1mL)' },
      { id: '200', label: '200 units (2mL)' },
      { id: '300', label: '300 units (3mL)' },
      { id: '500', label: '500 units (5mL)' },
    ],
    correctOptionId: '200',
    explanation: 'A 10mg vial uses 200 units of BAC (2mL).',
  },
  {
    id: 'bac-15-20mg',
    prompt:
      'For a 15mg or 20mg peptide vial, how much bacteriostatic water should you add?',
    options: [
      { id: '100', label: '100 units (1mL)' },
      { id: '200', label: '200 units (2mL)' },
      { id: '300', label: '300 units (3mL)' },
      { id: '500', label: '500 units (5mL)' },
    ],
    correctOptionId: '300',
    explanation: '15mg and 20mg vials both use 300 units of BAC (3mL).',
  },
  {
    id: 'bac-50-100mg',
    prompt:
      'For a 50mg or 100mg peptide vial, how much bacteriostatic water should you add?',
    options: [
      { id: '200', label: '200 units (2mL)' },
      { id: '300', label: '300 units (3mL)' },
      { id: '400', label: '400 units (4mL)' },
      { id: '500', label: '500 units (5mL)' },
    ],
    correctOptionId: '300',
    explanation: '50mg and 100mg vials both use 300 units of BAC (3mL).',
  },
  {
    id: 'bac-1000mg',
    prompt: 'For a 1000mg peptide vial, how much bacteriostatic water should you add?',
    options: [
      { id: '200', label: '200 units (2mL)' },
      { id: '300', label: '300 units (3mL)' },
      { id: '500', label: '500 units (5mL)' },
      { id: '1000', label: '1000 units (10mL)' },
    ],
    correctOptionId: '500',
    explanation: 'A 1000mg vial uses 500 units of BAC (5mL).',
  },
]

/** Skip the self-assessment question — only score the BAC volume questions. */
export const RECONSTITUTION_QUIZ_SCORED = RECONSTITUTION_QUIZ.filter(
  (q) => q.id.startsWith('bac-') && q.id !== 'bac-familiarity'
)
