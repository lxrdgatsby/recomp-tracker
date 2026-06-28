import type { TrackerState } from '../../types'
import { Card } from '../ui/Card'
import type { PeptideSelection } from '../../constants/peptideCatalog'
import { PeptideProtocolCard } from './PeptideProtocolCard'
import { ReconstitutionEditor } from './ReconstitutionEditor'
import { ReconstitutionGuide } from './ReconstitutionGuide'

interface PeptidesViewProps {
  state: TrackerState
  onUpdateReconstitution: (
    state: TrackerState,
    selections: PeptideSelection[]
  ) => Promise<void>
}

export function PeptidesView({
  state,
  onUpdateReconstitution,
}: PeptidesViewProps) {
  const { peptides, recompPlan } = state

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Peptides</h2>
        <p className="mt-1 text-sm text-slate-400">
          Reconstitution setup, dosing protocols, and syringe calculations
        </p>
      </div>

      <Card title="Reconstitution Setup">
        <ReconstitutionEditor state={state} onUpdate={onUpdateReconstitution} />
      </Card>

      <ReconstitutionGuide />

      {recompPlan?.reconstitutionReminder && (
        <p className="text-sm text-amber-400/90">
          {recompPlan.reconstitutionReminder}
        </p>
      )}

      <Card title="Peptide Protocols — Reconstitution & Dosing">
        {peptides.length === 0 ? (
          <p className="text-sm text-slate-500">
            No peptides configured. Complete onboarding or update your stack in
            Profile.
          </p>
        ) : (
          <div className="space-y-4">
            {peptides.map((p) => (
              <PeptideProtocolCard key={p.id} peptide={p} />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}