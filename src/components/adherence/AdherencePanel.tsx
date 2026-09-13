import type { TrackerState } from '../../types'
import { AdherenceCard } from './AdherenceCard'

interface AdherencePanelProps {
  state: TrackerState
  compact?: boolean
}

/** Full adherence panel — Progress page */
export function AdherencePanel({ state, compact = false }: AdherencePanelProps) {
  return <AdherenceCard state={state} compact={compact} />
}

export default AdherencePanel
