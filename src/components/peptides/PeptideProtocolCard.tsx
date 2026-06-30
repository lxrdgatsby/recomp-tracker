import type { Peptide } from '../../types'

export function PeptideProtocolCard({ peptide }: { peptide: Peptide }) {
  const protocol = peptide.protocol
  if (!protocol) return null

  return (
    <div className="rounded-xl border border-slate-800 bg-navy-950/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-white">{peptide.name}</h4>
            {protocol.reconstituted ? (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">
                Reconstituted
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">
                Not reconstituted yet
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">
            {peptide.vialSize ?? `${peptide.protocol?.vialMg ?? ''}mg`} vial ·{' '}
            {peptide.frequency} ·{' '}
            {peptide.timing}
          </p>
        </div>
        <div className="rounded-lg bg-teal-500/10 px-3 py-1.5 text-right">
          <p className="text-xs text-slate-500">Concentration</p>
          <p className="text-sm font-semibold text-teal-400">
            {protocol.concentrationLabel}
          </p>
        </div>
      </div>

      <p className="mt-3 rounded-lg border border-teal-500/15 bg-teal-500/5 px-3 py-2 text-xs text-slate-300">
        {protocol.calculationSummary}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-navy-900/60 px-3 py-2">
          <p className="text-xs text-slate-500">BAC water added</p>
          <p className="font-medium text-white">
            {protocol.bacWaterUnits} units ({protocol.bacWaterMl}ml)
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-navy-900/60 px-3 py-2">
          <p className="text-xs text-slate-500">Week 1 injection dose</p>
          <p className="font-medium text-teal-400">
            {protocol.startingSyringeUnits} units on U-100 syringe
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
          Reconstitution steps
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-slate-400">
          {protocol.reconstitutionSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      {protocol.titration.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            90-day titration — U-100 syringe units
          </p>
          <table className="mt-2 w-full min-w-[280px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500">
                <th className="py-2 pr-3">Weeks</th>
                <th className="py-2 pr-3">Draw (U-100)</th>
                <th className="py-2">Schedule</th>
              </tr>
            </thead>
            <tbody>
              {protocol.titration.map((tier) => (
                <tr key={tier.weeks} className="border-b border-slate-800/60">
                  <td className="py-2 pr-3 text-slate-300">{tier.weeks}</td>
                  <td className="py-2 pr-3 font-semibold text-teal-400">
                    {tier.syringeUnits} units
                  </td>
                  <td className="py-2 text-slate-500">{tier.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}