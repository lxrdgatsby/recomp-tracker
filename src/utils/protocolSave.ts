import type { SavedProtocolData } from '../components/DoseCalculator'
import type { BacWaterUnits } from '../types'
import type { FamiliarityLevel } from '../types/auth'
import type { Peptide, TrackerState } from '../types'
import {
  buildCalculationSummary,
  buildPeptideWithProtocol,
  formatMg,
  mgToSyringeUnits,
} from './recompProtocol'

function bacWaterUnitsFromMl(bacWaterMl: number): BacWaterUnits {
  const units = Math.round(bacWaterMl * 100)
  if (units <= 100) return 100
  if (units <= 200) return 200
  return 300
}

export function applyProtocolSave(
  state: TrackerState,
  protocol: SavedProtocolData,
  familiarity: FamiliarityLevel = 'beginner'
): TrackerState {
  const bacWaterUnits = bacWaterUnitsFromMl(protocol.bacWaterMl)
  const built = buildPeptideWithProtocol(
    {
      catalogId: protocol.peptideId,
      dose: `${protocol.vialMg}mg`,
      status: 'using',
      bacWaterUnits,
      reconstituted: false,
    },
    familiarity
  )

  if (!built?.protocol) return state

  const concentrationMgPerMl = built.protocol.concentrationMgPerMl
  const syringeUnits = mgToSyringeUnits(protocol.targetDoseMg, concentrationMgPerMl)

  const updatedPeptide: Peptide = {
    ...built,
    dose: formatMg(protocol.targetDoseMg),
    vialSize: `${protocol.vialMg}mg`,
    protocol: {
      ...built.protocol,
      vialMg: protocol.vialMg,
      bacWaterUnits,
      bacWaterMl: protocol.bacWaterMl,
      startingDoseMg: protocol.targetDoseMg,
      startingDoseLabel: formatMg(protocol.targetDoseMg),
      startingSyringeUnits: syringeUnits,
      calculationSummary: buildCalculationSummary(
        protocol.vialMg,
        bacWaterUnits,
        protocol.targetDoseMg
      ),
    },
  }

  const exists = state.peptides.some((p) => p.id === protocol.peptideId)
  const peptides = exists
    ? state.peptides.map((p) =>
        p.id === protocol.peptideId ? updatedPeptide : p
      )
    : [...state.peptides, updatedPeptide]

  return { ...state, peptides }
}