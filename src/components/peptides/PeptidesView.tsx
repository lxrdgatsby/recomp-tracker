import { format, parseISO } from 'date-fns'
import { Check, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { TrackerState } from '../../types'
import {
  getInjectionsForDate,
  getScheduleDates,
  isInjectionDone,
} from '../../utils/peptideSchedule'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface PeptidesViewProps {
  state: TrackerState
  onToggleInjection: (date: string, peptideId: string) => void
}

export function PeptidesView({ state, onToggleInjection }: PeptidesViewProps) {
  const { peptides, injectionLogs, profile } = state
  const [range, setRange] = useState<7 | 30>(7)
  const today = format(new Date(), 'yyyy-MM-dd')

  const scheduleDates = useMemo(
    () => getScheduleDates(profile.startDate, range),
    [profile.startDate, range]
  )

  const todayInjections = getInjectionsForDate(
    peptides,
    new Date(),
    profile.startDate
  )

  const handlePrint = () => window.print()

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Injection Schedule</h2>
          <p className="mt-1 text-sm text-slate-400">
            Mark doses as done — saved automatically
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={range === 7 ? 'primary' : 'secondary'}
            onClick={() => setRange(7)}
          >
            7 Days
          </Button>
          <Button
            size="sm"
            variant={range === 30 ? 'primary' : 'secondary'}
            onClick={() => setRange(30)}
          >
            30 Days
          </Button>
          <Button size="sm" variant="secondary" onClick={handlePrint}>
            <Printer size={14} />
            Print
          </Button>
        </div>
      </div>

      <Card title="Today's Injections" className="no-print">
        {todayInjections.length === 0 ? (
          <p className="text-sm text-slate-500">No injections scheduled today.</p>
        ) : (
          <div className="space-y-3">
            {todayInjections.map((inj) => {
              const done = isInjectionDone(injectionLogs, today, inj.peptideId)
              return (
                <div
                  key={inj.peptideId}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-navy-950/40 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{inj.peptideName}</p>
                    <p className="text-sm text-teal-400">
                      {inj.dose} · {inj.timing}
                    </p>
                    {inj.notes && (
                      <p className="mt-1 text-xs text-slate-500">{inj.notes}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={done ? 'success' : 'secondary'}
                    onClick={() => onToggleInjection(today, inj.peptideId)}
                  >
                    {done && <Check size={14} />}
                    {done ? 'Done' : 'Mark Done'}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <div className="print-checklist space-y-4">
        <h3 className="hidden text-lg font-bold print:block">
          {range}-Day Injection Checklist
        </h3>
        {scheduleDates.map((dateStr) => {
          const injections = getInjectionsForDate(
            peptides,
            parseISO(dateStr),
            profile.startDate
          )
          if (injections.length === 0) return null
          const isToday = dateStr === today
          return (
            <Card
              key={dateStr}
              className={isToday ? 'ring-1 ring-teal-500/40' : ''}
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold text-white">
                  {format(parseISO(dateStr), 'EEE, MMM d')}
                  {isToday && (
                    <span className="ml-2 text-xs font-normal text-teal-400">
                      Today
                    </span>
                  )}
                </h4>
                <span className="text-xs text-slate-500">
                  {injections.length} dose{injections.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-2">
                {injections.map((inj) => {
                  const done = isInjectionDone(
                    injectionLogs,
                    dateStr,
                    inj.peptideId
                  )
                  return (
                    <div
                      key={`${dateStr}-${inj.peptideId}`}
                      className="flex items-center justify-between gap-3 rounded-md bg-navy-950/30 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border print:border-black ${
                            done
                              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                              : 'border-slate-600'
                          }`}
                        >
                          {done && <Check size={12} />}
                        </span>
                        <div>
                          <span className="text-slate-200">{inj.peptideName}</span>
                          <span className="ml-2 text-teal-400/80">{inj.dose}</span>
                          <span className="ml-2 text-slate-500">{inj.timing}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="no-print text-xs text-slate-500 hover:text-teal-400"
                        onClick={() => onToggleInjection(dateStr, inj.peptideId)}
                      >
                        {done ? 'Undo' : 'Done'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}