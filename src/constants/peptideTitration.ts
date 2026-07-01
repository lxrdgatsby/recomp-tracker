import type { FamiliarityLevel } from '../types/auth'

export interface TitrationPhase {
  weeks: string
  doseMg: number
  notes?: string
}

type TitrationMap = Record<FamiliarityLevel, TitrationPhase[]>

/** Research-aligned dose phases in mg (or mg-equivalent for mcg peptides). */
export const PEPTIDE_TITRATION: Record<string, TitrationMap> = {
  retatrutide: {
    beginner: [
      { weeks: '1-4', doseMg: 0.5, notes: '1× weekly — initiation (trial-style start)' },
      { weeks: '5-8', doseMg: 1, notes: '1× weekly — month 2 titration' },
      { weeks: '9-12', doseMg: 2, notes: '1× weekly — month 3' },
      { weeks: '13', doseMg: 2.5, notes: '1× weekly — maintenance' },
    ],
    intermediate: [
      { weeks: '1-2', doseMg: 0.5, notes: '1× weekly' },
      { weeks: '3-4', doseMg: 1, notes: '1× weekly' },
      { weeks: '5-8', doseMg: 2, notes: '1× weekly' },
      { weeks: '9-13', doseMg: 3, notes: '1× weekly — maintenance' },
    ],
    advanced: [
      { weeks: '1-2', doseMg: 1, notes: '1× weekly' },
      { weeks: '3-6', doseMg: 2, notes: '1× weekly' },
      { weeks: '7-13', doseMg: 4, notes: '1× weekly — maintenance' },
    ],
  },
  tirzepatide: {
    beginner: [
      { weeks: '1-4', doseMg: 2.5, notes: '1× weekly — initiation' },
      { weeks: '5-8', doseMg: 5, notes: '1× weekly' },
      { weeks: '9-12', doseMg: 7.5, notes: '1× weekly' },
      { weeks: '13', doseMg: 10, notes: '1× weekly — maintenance' },
    ],
    intermediate: [
      { weeks: '1-2', doseMg: 2.5, notes: '1× weekly' },
      { weeks: '3-4', doseMg: 5, notes: '1× weekly' },
      { weeks: '5-8', doseMg: 7.5, notes: '1× weekly' },
      { weeks: '9-13', doseMg: 12.5, notes: '1× weekly' },
    ],
    advanced: [
      { weeks: '1-2', doseMg: 5, notes: '1× weekly' },
      { weeks: '3-6', doseMg: 10, notes: '1× weekly' },
      { weeks: '7-13', doseMg: 15, notes: '1× weekly' },
    ],
  },
  semaglutide: {
    beginner: [
      { weeks: '1-4', doseMg: 0.25, notes: '1× weekly — initiation' },
      { weeks: '5-8', doseMg: 0.5, notes: '1× weekly' },
      { weeks: '9-12', doseMg: 1, notes: '1× weekly' },
      { weeks: '13', doseMg: 1.7, notes: '1× weekly — maintenance' },
    ],
    intermediate: [
      { weeks: '1-2', doseMg: 0.25, notes: '1× weekly' },
      { weeks: '3-4', doseMg: 0.5, notes: '1× weekly' },
      { weeks: '5-8', doseMg: 1, notes: '1× weekly' },
      { weeks: '9-13', doseMg: 2.4, notes: '1× weekly' },
    ],
    advanced: [
      { weeks: '1-4', doseMg: 0.5, notes: '1× weekly' },
      { weeks: '5-8', doseMg: 1, notes: '1× weekly' },
      { weeks: '9-13', doseMg: 2.4, notes: '1× weekly' },
    ],
  },
  tesamorelin: {
    beginner: [
      { weeks: '1-4', doseMg: 1, notes: 'Daily before bed' },
      { weeks: '5-13', doseMg: 2, notes: 'Daily before bed' },
    ],
    intermediate: [
      { weeks: '1-13', doseMg: 2, notes: 'Daily before bed' },
    ],
    advanced: [
      { weeks: '1-13', doseMg: 2, notes: 'Daily before bed' },
    ],
  },
  aod9604: {
    beginner: [
      { weeks: '1-13', doseMg: 0.3, notes: 'Daily AM fasted (300mcg)' },
    ],
    intermediate: [
      { weeks: '1-13', doseMg: 0.5, notes: 'Daily AM fasted (500mcg)' },
    ],
    advanced: [
      { weeks: '1-13', doseMg: 1, notes: 'Daily AM fasted (1mg)' },
    ],
  },
  bpc157: {
    beginner: [
      { weeks: '1-13', doseMg: 0.25, notes: 'Daily (250mcg)' },
    ],
    intermediate: [
      { weeks: '1-13', doseMg: 0.5, notes: 'Daily (500mcg)' },
    ],
    advanced: [
      { weeks: '1-13', doseMg: 1, notes: 'Daily (1mg)' },
    ],
  },
  ghkcu: {
    beginner: [
      { weeks: '1-13', doseMg: 1, notes: 'Daily SubQ' },
    ],
    intermediate: [
      { weeks: '1-13', doseMg: 2, notes: 'Daily SubQ' },
    ],
    advanced: [
      { weeks: '1-13', doseMg: 3, notes: 'Daily SubQ' },
    ],
  },
  ipamorelin: {
    beginner: [
      { weeks: '1-13', doseMg: 0.2, notes: 'Daily or 5 on / 2 off (200mcg)' },
    ],
    intermediate: [
      { weeks: '1-13', doseMg: 0.3, notes: 'Daily (300mcg)' },
    ],
    advanced: [
      { weeks: '1-13', doseMg: 0.3, notes: 'Daily (300mcg)' },
    ],
  },
  cjc1295: {
    beginner: [
      { weeks: '1-13', doseMg: 0.2, notes: '2–3× weekly fasted (200mcg)' },
    ],
    intermediate: [
      { weeks: '1-13', doseMg: 0.3, notes: '3× weekly (300mcg)' },
    ],
    advanced: [
      { weeks: '1-13', doseMg: 0.3, notes: '3× weekly (300mcg)' },
    ],
  },
  tb500: {
    beginner: [
      { weeks: '1-4', doseMg: 2.5, notes: '2× weekly loading' },
      { weeks: '5-13', doseMg: 2.5, notes: '1× weekly maintenance' },
    ],
    intermediate: [
      { weeks: '1-4', doseMg: 5, notes: '2× weekly loading' },
      { weeks: '5-13', doseMg: 5, notes: '1× weekly maintenance' },
    ],
    advanced: [
      { weeks: '1-4', doseMg: 5, notes: '2× weekly loading' },
      { weeks: '5-13', doseMg: 5, notes: '1× weekly maintenance' },
    ],
  },
  selank: {
    beginner: [
      { weeks: '1-13', doseMg: 0.25, notes: 'Daily AM SubQ or intranasal (250mcg)' },
    ],
    intermediate: [
      { weeks: '1-13', doseMg: 0.4, notes: 'Daily AM SubQ or intranasal (400mcg)' },
    ],
    advanced: [
      { weeks: '1-13', doseMg: 0.5, notes: 'Daily AM SubQ or intranasal (500mcg)' },
    ],
  },
  semax: {
    beginner: [
      { weeks: '1-13', doseMg: 0.2, notes: 'Daily AM SubQ or intranasal (200mcg)' },
    ],
    intermediate: [
      { weeks: '1-13', doseMg: 0.4, notes: 'Daily AM SubQ or intranasal (400mcg)' },
    ],
    advanced: [
      { weeks: '1-13', doseMg: 0.6, notes: 'Daily AM SubQ or intranasal (600mcg)' },
    ],
  },
  melanotan2: {
    beginner: [
      { weeks: '1-4', doseMg: 0.1, notes: 'Daily PM SubQ — initiation (100mcg)' },
      { weeks: '5-13', doseMg: 0.25, notes: 'Daily or EOD — maintenance (250mcg)' },
    ],
    intermediate: [
      { weeks: '1-2', doseMg: 0.1, notes: 'Daily PM SubQ (100mcg)' },
      { weeks: '3-13', doseMg: 0.25, notes: 'Daily or EOD (250mcg)' },
    ],
    advanced: [
      { weeks: '1-2', doseMg: 0.25, notes: 'Daily PM SubQ (250mcg)' },
      { weeks: '3-13', doseMg: 0.5, notes: 'Daily or EOD — max common dose (500mcg)' },
    ],
  },
  pinealon: {
    beginner: [
      { weeks: '1-13', doseMg: 0.5, notes: 'Daily AM — run in 10–20 day cycles (500mcg)' },
    ],
    intermediate: [
      { weeks: '1-13', doseMg: 0.75, notes: 'Daily AM — short cycles (750mcg)' },
    ],
    advanced: [
      { weeks: '1-13', doseMg: 1, notes: 'Daily AM — short cycles (1mg)' },
    ],
  },
}

export function getTitrationPhases(
  catalogId: string,
  familiarity: FamiliarityLevel
): TitrationPhase[] {
  const map = PEPTIDE_TITRATION[catalogId]
  if (map) return map[familiarity]
  return [
    {
      weeks: '1-13',
      doseMg: 0.5,
      notes: 'Consult protocol for this compound',
    },
  ]
}