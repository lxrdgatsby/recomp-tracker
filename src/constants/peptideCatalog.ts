import type { BacWaterUnits, Peptide, PeptideFrequency } from '../types'

export const BAC_WATER_OPTIONS: BacWaterUnits[] = [100, 200, 300]
export const DEFAULT_BAC_WATER: BacWaterUnits = 200

export type PeptideUsageStatus = 'using' | 'interested'

export interface PeptideCatalogEntry {
  id: string
  name: string
  tagline: string
  doseOptions: string[]
  defaultDose: string
  frequency: PeptideFrequency
  timing: string
  notes: string
}

export interface PeptideSelection {
  catalogId: string
  dose: string
  status: PeptideUsageStatus
  bacWaterUnits: BacWaterUnits
  reconstituted: boolean
}

export const PEPTIDE_CATALOG: PeptideCatalogEntry[] = [
  {
    id: 'retatrutide',
    name: 'Retatrutide',
    tagline: 'Triple agonist — trending for recomp',
    doseOptions: ['5mg', '10mg', '15mg', '30mg'],
    defaultDose: '10mg',
    frequency: 'weekly',
    timing: 'Weekly, same day each week',
    notes: 'Titrate per clinical protocol. Rotate injection sites.',
  },
  {
    id: 'tirzepatide',
    name: 'Tirzepatide',
    tagline: 'GLP-1/GIP — widely used for fat loss',
    doseOptions: ['2.5mg', '5mg', '7.5mg', '10mg', '12.5mg', '15mg'],
    defaultDose: '5mg',
    frequency: 'weekly',
    timing: 'Weekly, same day each week',
    notes: 'Titrate gradually. Monitor appetite and GI tolerance.',
  },
  {
    id: 'semaglutide',
    name: 'Semaglutide',
    tagline: 'GLP-1 — most prescribed metabolic peptide',
    doseOptions: ['0.25mg', '0.5mg', '1mg', '1.7mg', '2.4mg'],
    defaultDose: '0.5mg',
    frequency: 'weekly',
    timing: 'Weekly, same day each week',
    notes: 'Start low and titrate. Stay hydrated.',
  },
  {
    id: 'tesamorelin',
    name: 'Tesamorelin',
    tagline: 'GH secretagogue — visceral fat focus',
    doseOptions: ['5mg', '10mg'],
    defaultDose: '5mg',
    frequency: 'daily',
    timing: 'Before bed, fasted',
    notes: 'Abdominal SubQ preferred. Often stacked with AOD-9604.',
  },
  {
    id: 'cjc1295',
    name: 'CJC-1295 (no DAC)',
    tagline: 'Pulsatile GH — popular in GH stacks',
    doseOptions: ['5mg', '10mg'],
    defaultDose: '5mg',
    frequency: 'weekly',
    timing: '2–3× weekly, fasted',
    notes: 'Often paired with Ipamorelin. Inject fasted.',
  },
  {
    id: 'ipamorelin',
    name: 'Ipamorelin',
    tagline: 'Clean GH secretagogue — low sides',
    doseOptions: ['100mcg', '200mcg', '300mcg'],
    defaultDose: '200mcg',
    frequency: 'daily',
    timing: 'Before bed or post-workout',
    notes: 'Minimal cortisol/prolactin impact vs older GHRPs.',
  },
  {
    id: 'bpc157',
    name: 'BPC-157',
    tagline: 'Healing & gut — staple recovery peptide',
    doseOptions: ['5mg', '10mg', '15mg'],
    defaultDose: '5mg',
    frequency: 'daily',
    timing: 'Morning or post-workout',
    notes: 'SubQ near injury site when applicable.',
  },
  {
    id: 'tb500',
    name: 'TB-500',
    tagline: 'Systemic repair — often paired with BPC-157',
    doseOptions: ['2mg', '5mg', '10mg'],
    defaultDose: '5mg',
    frequency: 'weekly',
    timing: '2× weekly loading, then maintenance',
    notes: 'Loading phase common. Track injury recovery response.',
  },
  {
    id: 'aod9604',
    name: 'AOD-9604',
    tagline: 'Fat mobilization fragment — recomp favorite',
    doseOptions: ['5mg', '10mg', '15mg'],
    defaultDose: '5mg',
    frequency: 'daily',
    timing: 'Morning, fasted',
    notes: 'Take 20–30 min before food for best effect.',
  },
  {
    id: 'ghkcu',
    name: 'GHK-Cu',
    tagline: 'Skin, hair & recovery — longevity crowd favorite',
    doseOptions: ['5mg', '10mg', '15mg'],
    defaultDose: '5mg',
    frequency: 'daily',
    timing: 'Morning or evening SubQ',
    notes: 'Also popular topically. Copper peptide — track skin response.',
  },
  {
    id: 'motsc',
    name: 'MOTS-c',
    tagline: 'Mitochondrial peptide — metabolic performance',
    doseOptions: ['5mg', '10mg', '15mg'],
    defaultDose: '10mg',
    frequency: 'weekly',
    timing: '1–2× weekly, fasted',
    notes: 'Often cycled. Supports metabolic flexibility.',
  },
  {
    id: 'ss31',
    name: 'SS-31 (Elamipretide)',
    tagline: 'Mitochondrial support — endurance & recovery',
    doseOptions: ['5mg', '10mg', '20mg'],
    defaultDose: '10mg',
    frequency: 'daily',
    timing: 'Morning SubQ',
    notes: 'Emerging longevity stack component.',
  },
  {
    id: 'kpv',
    name: 'KPV',
    tagline: 'Gut & inflammation — trending in wellness stacks',
    doseOptions: ['250mcg', '500mcg', '1mg'],
    defaultDose: '500mcg',
    frequency: 'daily',
    timing: 'Morning or with meals',
    notes: 'Alpha-MSH fragment. Popular for gut health protocols.',
  },
  {
    id: 'pt141',
    name: 'PT-141 (Bremelanotide)',
    tagline: 'Libido & arousal — on-demand use',
    doseOptions: ['0.5mg', '1mg', '1.75mg', '2mg'],
    defaultDose: '1mg',
    frequency: 'weekly',
    timing: 'As needed, ≥24h apart',
    notes: 'Not daily. Monitor blood pressure.',
  },
  {
    id: 'epitalon',
    name: 'Epitalon',
    tagline: 'Telomere/longevity — cyclical protocols',
    doseOptions: ['5mg', '10mg', '50mg'],
    defaultDose: '10mg',
    frequency: 'daily',
    timing: 'Short cycles (e.g. 10–20 days)',
    notes: 'Typically run in cycles, not year-round.',
  },
  {
    id: 'dsip',
    name: 'DSIP',
    tagline: 'Sleep peptide — viral in biohacking circles',
    doseOptions: ['100mcg', '250mcg', '500mcg'],
    defaultDose: '250mcg',
    frequency: 'daily',
    timing: '30–60 min before bed',
    notes: 'Delta sleep-inducing peptide. Track sleep quality.',
  },
  {
    id: 'semax',
    name: 'Semax',
    tagline: 'Nootropic — focus & neuroprotection',
    doseOptions: ['200mcg', '400mcg', '600mcg'],
    defaultDose: '400mcg',
    frequency: 'daily',
    timing: 'Morning intranasal or SubQ',
    notes: 'Often intranasal. Start low for cognitive response.',
  },
  {
    id: 'selank',
    name: 'Selank',
    tagline: 'Anxiolytic nootropic — stress & calm',
    doseOptions: ['5mg', '10mg'],
    defaultDose: '5mg',
    frequency: 'daily',
    timing: 'Morning intranasal or SubQ',
    notes: 'Often stacked with Semax. Non-sedating anxiolytic.',
  },
]

export function getCatalogEntry(catalogId: string): PeptideCatalogEntry | undefined {
  return PEPTIDE_CATALOG.find((p) => p.id === catalogId)
}

export function getCatalogEntryByName(name: string): PeptideCatalogEntry | undefined {
  const normalized = name.trim().toLowerCase()
  return PEPTIDE_CATALOG.find((p) => p.name.toLowerCase() === normalized)
}

export function selectionToPeptide(selection: PeptideSelection): Peptide | null {
  const entry = getCatalogEntry(selection.catalogId)
  if (!entry) return null
  const statusLabel =
    selection.status === 'using' ? 'Currently using' : 'Interested — not dosing yet'
  return {
    id: entry.id,
    name: entry.name,
    dose: selection.dose,
    frequency: entry.frequency,
    timing: entry.timing,
    notes: `${statusLabel}. ${entry.notes}`,
  }
}

export function selectionsToPeptideStack(selections: PeptideSelection[]): Peptide[] {
  const using = selections.filter((s) => s.status === 'using')
  const source = using.length > 0 ? using : selections
  return source
    .map(selectionToPeptide)
    .filter((p): p is Peptide => p !== null)
}

export function formatPeptideSelections(selections: PeptideSelection[]): string {
  return selections
    .map((s) => {
      const entry = getCatalogEntry(s.catalogId)
      const name = entry?.name ?? s.catalogId
      const status = s.status === 'using' ? 'using' : 'interested in'
      const bac = s.bacWaterUnits ?? DEFAULT_BAC_WATER
      return `${name} ${s.dose} vial + ${bac}u BAC (${status})`
    })
    .join('; ')
}

export function formatPeptideSelectionsForAI(selections: PeptideSelection[]): string {
  return selections
    .map((s) => {
      const entry = getCatalogEntry(s.catalogId)
      if (!entry) return `${s.catalogId}: ${s.dose} [${s.status}]`
      return (
        `${entry.name} ${s.dose} vial + ${s.bacWaterUnits ?? DEFAULT_BAC_WATER}u BAC (${s.status}) — ` +
        `${entry.frequency}, timing: ${entry.timing}. ${entry.notes}`
      )
    })
    .join('\n')
}