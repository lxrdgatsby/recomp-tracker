import {
  DEFAULT_BAC_WATER,
  recommendedBacWaterForVial,
  type PeptideSelection,
} from '../constants/peptideCatalog'
import { getCatalogEntry, getCatalogEntryByName } from '../constants/peptideCatalog'
import { getTitrationPhases } from '../constants/peptideTitration'
import type { FamiliarityLevel } from '../types/auth'
import { getDaysIntoCycle } from './calculations'
import type { BacWaterUnits, Peptide, RecompPlan, TitrationWeek } from '../types'

export interface ProtocolInput {
  familiarity: FamiliarityLevel
  mainGoal: string
  gender: string | null
  age: number | null
  trainingActivities: string | null
  additionalInfo: string | null
  currentWeight: number
  goalWeight: number
  weeklyLossTarget: number
  peptideSelections: PeptideSelection[]
}

export function normalizeSelection(
  raw: Partial<PeptideSelection> & Pick<PeptideSelection, 'catalogId' | 'dose'>
): PeptideSelection {
  let dose = raw.dose
  let bacWaterUnits =
    raw.bacWaterUnits ?? recommendedBacWaterForVial(dose)

  // Selank is standardized as a 10mg vial reconstituted with 200u BAC.
  if (raw.catalogId === 'selank') {
    if (dose === '5mg') dose = '10mg'
    if (dose === '10mg') bacWaterUnits = 200
  }

  return {
    catalogId: raw.catalogId,
    dose,
    status: raw.status ?? 'interested',
    bacWaterUnits,
    reconstituted: raw.reconstituted ?? false,
  }
}

export function parseDoseToMg(dose: string): number {
  const normalized = dose.trim().toLowerCase()
  const mcg = normalized.match(/^([\d.]+)\s*mcg$/)
  if (mcg) return parseFloat(mcg[1]) / 1000
  const mg = normalized.match(/^([\d.]+)\s*mg$/)
  if (mg) return parseFloat(mg[1])
  const num = parseFloat(normalized)
  return isNaN(num) ? 0 : num
}

export function bacWaterUnitsToMl(units: BacWaterUnits): number {
  return units / 100
}

export function mgToSyringeUnits(mg: number, concentrationMgPerMl: number): number {
  if (concentrationMgPerMl <= 0) return 0
  const ml = mg / concentrationMgPerMl
  return Math.round(ml * 100)
}

export function formatSyringeUnits(units: number): string {
  return `${units} units on U-100 syringe`
}

export function formatMg(mg: number): string {
  if (mg < 1) return `${Math.round(mg * 1000)}mcg`
  const rounded = Math.round(mg * 1000) / 1000
  const display = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2).replace(/\.?0+$/, '')
  return `${display}mg`
}

export function buildCalculationSummary(
  vialMg: number,
  bacWaterUnits: BacWaterUnits,
  doseMg: number
): string {
  const ml = bacWaterUnitsToMl(bacWaterUnits)
  const conc = vialMg / ml
  const units = mgToSyringeUnits(doseMg, conc)
  return (
    `${formatMg(vialMg)} vial ÷ ${bacWaterUnits} units (${ml}ml BAC water) = ` +
    `${formatMg(conc)}/ml → draw ${units} units on U-100 syringe`
  )
}

function buildTitrationFromPhases(
  phases: ReturnType<typeof getTitrationPhases>,
  concentrationMgPerMl: number
): TitrationWeek[] {
  return phases.map((phase) => {
    const syringeUnits = mgToSyringeUnits(phase.doseMg, concentrationMgPerMl)
    return {
      weeks: phase.weeks,
      doseMg: phase.doseMg,
      doseLabel: formatSyringeUnits(syringeUnits),
      syringeUnits,
      notes: phase.notes,
    }
  })
}

function buildReconstitutionSteps(
  vialMg: number,
  bacWaterUnits: BacWaterUnits,
  peptideName: string
): string[] {
  const ml = bacWaterUnitsToMl(bacWaterUnits)
  const conc = vialMg / ml
  return [
    `You have a ${formatMg(vialMg)} ${peptideName} lyophilized (freeze-dried) vial.`,
    `Wipe the vial top with an alcohol pad. Use a U-100 insulin syringe.`,
    `Draw ${bacWaterUnits} units of bacteriostatic water (${ml}ml) — on a U-100 syringe, 100 units = 1ml.`,
    `Inject BAC water slowly down the inside wall of the vial. Do NOT shake — swirl gently until fully dissolved.`,
    `Concentration: ${formatMg(vialMg)} ÷ ${ml}ml = ${formatMg(conc)}/ml.`,
    `Immediately place the reconstituted vial in the refrigerator (not the freezer). Keep refrigerated for exactly 30 minutes before first use — activation happens in the fridge, never at room temperature.`,
    `Label with date reconstituted. Always store in the refrigerator (36–46°F) to maintain stability, purity, and potency. Use within 28–30 days.`,
    `Each unit on your U-100 syringe = 0.01ml. To draw ${formatMg(conc)}/ml solution, units = (dose in mg ÷ ${formatMg(conc)}) × 100.`,
  ]
}

export function buildPeptideWithProtocol(
  rawSelection: PeptideSelection,
  familiarity: FamiliarityLevel
): Peptide | null {
  const selection = normalizeSelection(rawSelection)
  const entry = getCatalogEntry(selection.catalogId)
  if (!entry) return null

  const vialMg = parseDoseToMg(selection.dose)
  if (vialMg <= 0) return null

  const bacWaterUnits = selection.bacWaterUnits
  const bacWaterMl = bacWaterUnitsToMl(bacWaterUnits)
  const concentrationMgPerMl = vialMg / bacWaterMl
  const phases = getTitrationPhases(selection.catalogId, familiarity)
  const titration = buildTitrationFromPhases(phases, concentrationMgPerMl)
  const starting = titration[0]

  const statusLabel =
    selection.status === 'using' ? 'Active in stack' : 'Interested — protocol preview'

  return {
    id: entry.id,
    name: entry.name,
    dose: starting.doseLabel,
    vialSize: selection.dose,
    frequency: entry.frequency,
    timing: entry.timing,
    notes: `${statusLabel}. ${entry.notes}`,
    protocol: {
      vialMg,
      bacWaterUnits,
      bacWaterMl,
      concentrationMgPerMl,
      concentrationLabel: `${formatMg(concentrationMgPerMl)}/ml`,
      startingDoseMg: starting.doseMg,
      startingDoseLabel: starting.doseLabel,
      startingSyringeUnits: starting.syringeUnits,
      reconstituted: selection.reconstituted,
      calculationSummary: buildCalculationSummary(
        vialMg,
        bacWaterUnits,
        starting.doseMg
      ),
      reconstitutionSteps: buildReconstitutionSteps(
        vialMg,
        bacWaterUnits,
        entry.name
      ),
      titration,
    },
  }
}

export function previewStartingDose(
  selection: PeptideSelection,
  familiarity: FamiliarityLevel
): { doseLabel: string; syringeUnits: number; summary: string } | null {
  const peptide = buildPeptideWithProtocol(selection, familiarity)
  if (!peptide?.protocol) return null
  return {
    doseLabel: peptide.protocol.startingDoseLabel,
    syringeUnits: peptide.protocol.startingSyringeUnits,
    summary: peptide.protocol.calculationSummary,
  }
}

export function generateRecompPlan(input: ProtocolInput): {
  peptides: Peptide[]
  recompPlan: RecompPlan
} {
  const normalized = input.peptideSelections.map(normalizeSelection)
  const active = normalized.filter((s) => s.status === 'using')
  const source = active.length > 0 ? active : normalized

  const peptides = source
    .map((s) => buildPeptideWithProtocol(s, input.familiarity))
    .filter((p): p is Peptide => p !== null)

  const weightToLose = Math.max(0, input.currentWeight - input.goalWeight)
  const weeksNeeded = Math.ceil(weightToLose / input.weeklyLossTarget)

  const summary = [
    `90-day muscle recomp for ${input.gender ?? 'user'}, age ${input.age ?? '—'}.`,
    `Goals: ${input.mainGoal}.`,
    `Weight: ${input.currentWeight}lbs → ${input.goalWeight}lbs (~${weightToLose.toFixed(1)}lbs over ~${weeksNeeded} weeks at ${input.weeklyLossTarget}lb/week).`,
    `Training: ${input.trainingActivities ?? 'Not specified'}.`,
    `${peptides.length} peptide${peptides.length !== 1 ? 's' : ''} — doses calculated from YOUR BAC water reconstitution + U-100 syringe units.`,
  ]

  const nutritionNotes = [
    'High protein (~1g per lb goal bodyweight) to preserve lean mass during deficit.',
    'Prioritize whole foods; adjust calories as weekly weigh-ins trend.',
    input.additionalInfo
      ? `Your notes: ${input.additionalInfo}`
      : 'Track daily steps and hydration alongside peptide schedule.',
  ]

  const trainingNotes = (input.trainingActivities ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => `Continue ${t} — align intensity with recovery and appetite changes from stack.`)

  if (trainingNotes.length === 0) {
    trainingNotes.push(
      '5 days training / 2 rest per week with 10k steps + 100 pushups daily baseline.'
    )
  }

  return {
    peptides,
    recompPlan: {
      generatedAt: new Date().toISOString(),
      summary,
      nutritionNotes,
      trainingNotes,
      checkInCadence:
        'Weigh in every 7 days. Only advance titration if sides are manageable and weight trend is on track.',
      reconstitutionReminder:
        'Mark each vial reconstituted in the Peptides tab after mixing with BAC water so your syringe-unit schedule stays accurate.',
    },
  }
}

export function getTitrationForDay(peptide: Peptide, dayInCycle: number): TitrationWeek | null {
  if (!peptide.protocol?.titration.length) return null
  const week = Math.floor(dayInCycle / 7) + 1

  for (const tier of peptide.protocol.titration) {
    const [start, end] = tier.weeks.split('-').map((n) => parseInt(n, 10))
    if (week >= start && week <= (end ?? start)) return tier
  }

  return peptide.protocol.titration[peptide.protocol.titration.length - 1]
}

export function formatProtocolContextForAI(
  peptides: Peptide[],
  startDate: string
): string {
  const dayInCycle = getDaysIntoCycle(startDate)
  const week = Math.floor((dayInCycle - 1) / 7) + 1

  if (peptides.length === 0) {
    return 'No active peptide protocol on file.'
  }

  return peptides
    .map((pep) => {
      const proto = pep.protocol
      if (!proto) {
        return (
          `${pep.name}: missing protocol data — do not invent doses; ` +
          `vial label says ${pep.dose} but that is VIAL SIZE not injection amount.`
        )
      }

      const current = getTitrationForDay(pep, dayInCycle - 1) ?? proto.titration[0]
      const schedule =
        pep.frequency === 'weekly' ? 'once weekly' : 'daily'
      const titrationLines = proto.titration
        .map(
          (t) =>
            `    Weeks ${t.weeks}: draw ${t.syringeUnits} units on U-100 syringe (${t.notes ?? schedule})`
        )
        .join('\n')

      return [
        `${pep.name}:`,
        `  VIAL SIZE (total in vial, NOT per injection): ${formatMg(proto.vialMg)}`,
        `  Reconstitution: ${proto.bacWaterUnits} units BAC water (${proto.bacWaterMl}ml) → ${proto.concentrationLabel}`,
        `  Reconstituted: ${proto.reconstituted ? 'yes' : 'not yet'}`,
        `  CURRENT (week ${week} of 90-day plan): draw ${current.syringeUnits} units on U-100 syringe, ${schedule}`,
        `  CORRECT way to describe to user: "${pep.name} — draw ${current.syringeUnits} units on U-100 syringe (${schedule})"`,
        `  WRONG — never say "${pep.vialSize ?? formatMg(proto.vialMg)}" as the injection dose; always give U-100 syringe units.`,
        `  90-day titration schedule:`,
        titrationLines,
        `  Timing: ${pep.timing ?? schedule}`,
      ].join('\n')
    })
    .join('\n\n')
}

export function rebuildPeptideForVialSize(
  peptide: Peptide,
  vialSize: string,
  familiarity: FamiliarityLevel
): Peptide {
  const entry = getCatalogEntry(peptide.id) ?? getCatalogEntryByName(peptide.name)
  if (!entry) {
    return { ...peptide, vialSize }
  }

  const built = buildPeptideWithProtocol(
    {
      catalogId: entry.id,
      dose: vialSize,
      status: 'using',
      bacWaterUnits: peptide.protocol?.bacWaterUnits ?? DEFAULT_BAC_WATER,
      reconstituted: peptide.protocol?.reconstituted ?? false,
    },
    familiarity
  )

  if (!built) return { ...peptide, vialSize }

  return {
    ...built,
    id: peptide.id,
    timing: peptide.timing ?? built.timing,
    notes: peptide.notes ?? built.notes,
    vialSize,
  }
}

export function getCurrentInjectionDose(
  peptide: Peptide,
  startDate: string
): { doseLabel: string; syringeUnits?: number } {
  const dayInCycle = Math.max(0, getDaysIntoCycle(startDate) - 1)
  const tier = getTitrationForDay(peptide, dayInCycle)
  const syringeUnits =
    tier?.syringeUnits ?? peptide.protocol?.startingSyringeUnits
  return {
    doseLabel:
      syringeUnits != null
        ? formatSyringeUnits(syringeUnits)
        : tier?.doseLabel ??
          peptide.protocol?.startingDoseLabel ??
          peptide.dose,
    syringeUnits,
  }
}

function vialDoseFromPeptide(peptide: Peptide): string {
  if (peptide.vialSize) return peptide.vialSize
  if (peptide.protocol?.vialMg != null) return formatMg(peptide.protocol.vialMg)
  const entry = getCatalogEntry(peptide.id) ?? getCatalogEntryByName(peptide.name)
  return entry?.defaultDose ?? '10mg'
}

export function selectionsFromPeptides(peptides: Peptide[]): PeptideSelection[] {
  const selections: PeptideSelection[] = []
  for (const p of peptides) {
    if (!p.protocol) continue
    const entry = getCatalogEntry(p.id) ?? getCatalogEntryByName(p.name)
    if (!entry) continue
    selections.push({
      catalogId: entry.id,
      dose: vialDoseFromPeptide(p),
      status: 'using',
      bacWaterUnits: p.protocol.bacWaterUnits,
      reconstituted: p.protocol.reconstituted,
    })
  }
  return selections
}

/** Keep peptide_selections aligned with the visible stack (preserves reconstitution flags). */
export function syncSelectionsFromPeptides(
  peptides: Peptide[],
  existing: PeptideSelection[] = []
): PeptideSelection[] {
  const existingByCatalog = new Map(
    existing.map((selection) => [selection.catalogId, selection])
  )

  return peptides
    .map((peptide) => {
      if (!peptide.protocol) return null
      const entry = getCatalogEntry(peptide.id) ?? getCatalogEntryByName(peptide.name)
      if (!entry) return null

      const previous = existingByCatalog.get(entry.id)
      return normalizeSelection({
        catalogId: entry.id,
        dose: vialDoseFromPeptide(peptide),
        status: previous?.status ?? 'using',
        bacWaterUnits: peptide.protocol.bacWaterUnits,
        reconstituted:
          previous?.reconstituted ?? peptide.protocol.reconstituted ?? false,
      })
    })
    .filter((selection): selection is PeptideSelection => selection !== null)
}