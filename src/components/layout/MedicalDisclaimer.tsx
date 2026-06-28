export function MedicalDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-center text-[10px] leading-relaxed text-slate-600">
        Not medical advice. Consult your doctor before using peptides or changing
        your training protocol.
      </p>
    )
  }
  return (
    <p className="px-4 py-4 text-center text-xs leading-relaxed text-slate-500">
      <strong className="text-slate-400">Medical disclaimer:</strong> This is a
      personal tracking and educational tool only. Information provided is not
      medical advice. Always consult your healthcare provider regarding peptide
      use, dosing, and training.
    </p>
  )
}