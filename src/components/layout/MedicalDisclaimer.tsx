export function MedicalDisclaimer({
  compact = false,
  className = '',
}: {
  compact?: boolean
  className?: string
}) {
  if (compact) {
    return (
      <p className="text-center text-[10px] leading-relaxed text-slate-600">
        Not medical advice. Consult your doctor before using peptides or changing
        your training protocol.
      </p>
    )
  }
  return (
    <p
      className={`pt-2 pb-0 text-center text-xs leading-relaxed text-slate-500 ${className}`}
    >
      <strong className="text-slate-400">Medical disclaimer:</strong> This is a
      personal tracking and educational tool only. Information provided is not
      medical advice. Always consult your healthcare provider regarding peptide
      use, dosing, and training.
    </p>
  )
}