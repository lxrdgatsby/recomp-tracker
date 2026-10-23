import { KLOW_80_NOTE, KLOW_BPC_CAUTION, KLOW_LXRD_NOTE } from '../constants/reconstitutionTable'
import type { Peptide } from '../types'
import { isPeptideOnActiveStack } from '../utils/peptideSchedule'
import { KLOW_80_START } from './lxrdRestart'

/** Plan and protocol-card copy. No note when KLOW is off. Never the retired 10 mg warning. */
export function klowPlanBanner(peptides: Peptide[]): string | null {
  const klow = peptides.find((peptide) => peptide.id === 'klow' && isPeptideOnActiveStack(peptide))
  if (!klow) return null
  const lxrdRestart =
    klow.protocol?.titration.some((tier) => tier.startDate === KLOW_80_START) ?? false
  const base = lxrdRestart ? KLOW_LXRD_NOTE : klow.protocol?.vialMg === 80 ? KLOW_80_NOTE : null
  if (!base) return null
  const bpcActive = peptides.some(
    (peptide) => peptide.id === 'bpc157' && isPeptideOnActiveStack(peptide)
  )
  return bpcActive ? `${base} ${KLOW_BPC_CAUTION}` : base
}
