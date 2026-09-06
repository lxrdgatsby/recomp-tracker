import { differenceInCalendarDays, parseISO } from 'date-fns'
import { PHASE_NOTES, SAFETY_COPY } from '../../lib/protocolSeed'
import type { TrackerState } from '../../types'
import { getInjectionsForDate } from '../../utils/peptideSchedule'
import { getProtocolHeader } from '../../utils/protocolHeader'

export function ProtocolCard({
  state,
  compact = false,
}: {
  state: TrackerState
  compact?: boolean
}) {
  const { dateLabel, week } = getProtocolHeader(state.profile.startDate)
  const start = parseISO(state.profile.startDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = differenceInCalendarDays(today, start)
  const preview = diff < 0
  const injections = getInjectionsForDate(state.peptides, today, state.profile.startDate)

  return (
    <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[2px] text-emerald-400 uppercase">Protocol</p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            90-Day Research Protocol
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {dateLabel} · Week {week}
          </p>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
          Week {week}
        </span>
      </div>

      <h3 className="mb-2 text-xs tracking-[2px] text-slate-400 uppercase">
        {preview ? "Sunday's scheduled draws" : "Today's scheduled draws"}
      </h3>
      <div className="space-y-2">
        {injections.map((inj) => (
          <div
            key={inj.peptideId}
            className="flex items-start justify-between gap-3 border-b border-white/5 py-2 last:border-0"
          >
            <div>
              <div className="text-sm font-medium text-white">{inj.peptideName}</div>
              <div className="text-xs text-slate-400">{inj.timing}</div>
            </div>
            <div className="text-right text-sm font-semibold text-emerald-400">
              {inj.dose}
            </div>
          </div>
        ))}
      </div>

      {!compact && (
        <>
          <h3 className="mt-5 mb-2 text-xs tracking-[2px] text-slate-400 uppercase">
            Reconstitution (U-100)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2 pr-3">Vial</th>
                  <th className="py-2 pr-3">Mix</th>
                  <th className="py-2">Conc.</th>
                </tr>
              </thead>
              <tbody>
                {state.peptides.map((p) => (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="py-2 pr-3">{p.name}</td>
                    <td className="py-2 pr-3">
                      {p.protocol && p.protocol.vialMg > 0
                        ? `${p.protocol.vialMg}mg / ${p.protocol.bacWaterMl}mL`
                        : 'unknown'}
                    </td>
                    <td className="py-2">
                      {p.protocol?.concentrationLabel ?? 'confirm mg/mL'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-200">
            KLOW is stored as a 10 mg product, not an 80 mg blend. Confirm label before
            locking units.
          </div>
          <div className="mt-2 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
            Test Cyp concentration is UNKNOWN. Dose is 0.75 mL — confirm mg/mL on vial.
          </div>

          <h3 className="mt-5 mb-2 text-xs tracking-[2px] text-slate-400 uppercase">
            Labs reminder
          </h3>
          <ul className="list-disc space-y-1 pl-4 text-sm text-slate-400">
            <li>Baseline before Sunday start</li>
            <li>Week 4–6 follow-up</li>
            <li>Week 10–12 follow-up</li>
          </ul>

          <h3 className="mt-5 mb-2 text-xs tracking-[2px] text-slate-400 uppercase">
            Weeks 5–8 (planned, not auto-applied)
          </h3>
          <ul className="list-disc space-y-1 pl-4 text-sm text-slate-400">
            {PHASE_NOTES.weeks5to8.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <h3 className="mt-5 mb-2 text-xs tracking-[2px] text-slate-400 uppercase">
            Weeks 9–12 (planned, not auto-applied)
          </h3>
          <ul className="list-disc space-y-1 pl-4 text-sm text-slate-400">
            {PHASE_NOTES.weeks9to12.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] leading-relaxed text-amber-200/90">{SAFETY_COPY}</p>
        </>
      )}
    </section>
  )
}
