import { Check, Syringe } from 'lucide-react'
import type { Peptide } from '../../../types'
import { getCurrentInjectionDose } from '../../../utils/recompProtocol'

export type TodayDoseItem = {
  peptideId: string
  peptideName: string
  dose: string
  timing?: string
  done: boolean
  loggedTaken?: boolean
}

interface TodayDosesSectionProps {
  injections: TodayDoseItem[]
  peptides: Peptide[]
  startDate: string
  onLog: (compoundName: string, doseMg?: number) => void
  onQuickDone: (peptideId: string) => void
  onLogUnscheduled: () => void
}

export function TodayDosesSection({
  injections,
  peptides,
  startDate,
  onLog,
  onQuickDone,
  onLogUnscheduled,
}: TodayDosesSectionProps) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-2 px-0.5">
        <h2 className="text-sm font-medium tracking-[0.12em] text-slate-400 uppercase">
          Today&apos;s doses
        </h2>
        <span className="text-[11px] text-slate-600">
          {injections.filter((i) => i.done || i.loggedTaken).length}/
          {injections.length || 0} done
        </span>
      </div>

      {injections.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
              <Syringe size={22} className="text-slate-500" />
            </div>
            <div>
              <p className="font-medium text-white">Nothing scheduled</p>
              <p className="text-xs text-slate-500">Rest day for peptides</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogUnscheduled}
            className="mt-4 min-h-12 w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-sm font-medium text-emerald-400"
          >
            Log unscheduled dose
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {injections.map((inj) => {
            const peptide = peptides.find((p) => p.id === inj.peptideId)
            const doseInfo = peptide
              ? getCurrentInjectionDose(peptide, startDate)
              : null
            const complete = inj.done || inj.loggedTaken

            return (
              <div
                key={inj.peptideId}
                className={`rounded-3xl border p-4 transition-colors ${
                  complete
                    ? 'border-emerald-500/25 bg-emerald-500/[0.07]'
                    : 'border-white/10 bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      complete ? 'bg-emerald-500/20' : 'bg-emerald-500/10'
                    }`}
                  >
                    {complete ? (
                      <Check size={22} className="text-emerald-400" />
                    ) : (
                      <Syringe size={22} className="text-emerald-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-white">
                        {inj.peptideName}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                          complete
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {complete ? 'Taken' : 'Pending'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-emerald-400">
                      {doseInfo?.doseLabel ?? inj.dose}
                      {doseInfo?.syringeUnits != null && (
                        <span className="text-slate-500">
                          {' '}
                          · {doseInfo.syringeUnits}u
                        </span>
                      )}
                    </p>
                    {inj.timing && (
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {inj.timing}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onLog(inj.peptideName, doseInfo?.doseMg)}
                    className="min-h-12 rounded-2xl bg-emerald-500 text-sm font-semibold text-black active:bg-emerald-400"
                  >
                    Log
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickDone(inj.peptideId)}
                    className={`min-h-12 rounded-2xl text-sm font-medium ${
                      complete
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border border-white/15 bg-white/5 text-white'
                    }`}
                  >
                    {complete ? 'Undo' : 'Mark done'}
                  </button>
                </div>
              </div>
            )
          })}

          <button
            type="button"
            onClick={onLogUnscheduled}
            className="min-h-11 w-full rounded-2xl border border-dashed border-white/15 text-sm text-slate-400 active:bg-white/5"
          >
            + Log unscheduled dose
          </button>
        </div>
      )}
    </section>
  )
}
