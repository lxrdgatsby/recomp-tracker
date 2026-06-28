export function ReconstitutionGuide({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 text-xs text-slate-400">
        <p className="font-medium text-teal-300">U-100 insulin syringe basics</p>
        <p className="mt-1">
          100 units = 1ml. If you add 200 units BAC water to a 10mg vial, you get
          5mg/ml — a 0.5mg dose = 10 units on the syringe.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-navy-900/80 p-4">
      <h3 className="text-sm font-semibold text-white">
        How reconstitution & syringe units work
      </h3>
      <div className="mt-3 space-y-3 text-sm text-slate-400">
        <p>
          Peptide vials arrive lyophilized (freeze-dried powder). You add{' '}
          <strong className="text-slate-300">bacteriostatic water (BAC)</strong> to
          dissolve them. Your plan uses a standard{' '}
          <strong className="text-slate-300">U-100 insulin syringe</strong> where{' '}
          <strong className="text-teal-400">100 units = 1ml</strong>.
        </p>
        <div className="rounded-lg border border-slate-800 bg-navy-950/60 p-3 font-mono text-xs text-teal-300">
          concentration = vial mg ÷ BAC water ml
          <br />
          syringe units = (dose mg ÷ concentration) × 100
        </div>
        <p>
          <strong className="text-slate-300">Example:</strong> 10mg Retatrutide +
          200 units (2ml) BAC water → 5mg/ml. A 0.5mg starting dose = 0.1ml ={' '}
          <strong className="text-teal-400">10 units</strong> once weekly for weeks
          1–4, then titrate per your 90-day table.
        </p>
        <p>
          <strong className="text-slate-300">After mixing:</strong> immediately
          refrigerate (never freeze). Keep in the fridge for exactly 30 minutes
          before your first injection — activation happens{' '}
          <strong className="text-teal-400">in the refrigerator</strong>, not at
          room temperature.
        </p>
        <p className="text-xs text-slate-500">
          Educational only — not medical advice. Confirm all dosing with your
          healthcare provider.
        </p>
      </div>
    </div>
  )
}