import { format } from 'date-fns'
import { Check, Printer } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { TrackerState } from '../../types'
import {
  getHistoryRangeDates,
  getInjectionsForDate,
  parseLocalYmd,
  type HistoryRange,
  isInjectionDone,
} from '../../utils/peptideSchedule'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface InjectionHistoryProps {
  state: TrackerState
  onToggleInjection: (date: string, peptideId: string) => void
}

export function InjectionHistory({
  state,
  onToggleInjection,
}: InjectionHistoryProps) {
  const { profile, peptides, injectionLogs } = state
  const [range, setRange] = useState<HistoryRange>(7)
  const todayRef = useRef<HTMLDivElement | null>(null)
  const today = format(new Date(), 'yyyy-MM-dd')

  const scheduleDates = useMemo(
    () => getHistoryRangeDates(profile.startDate, range),
    [profile.startDate, range]
  )

  useEffect(() => {
    if (range === 7) return
    todayRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [range, scheduleDates])

  return (
    <div className="mb-8">
      <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Injection History</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            Dated cards from{' '}
            {format(parseLocalYmd(profile.startDate), 'MMM d, yyyy')} —
            logged doses stay as logged. Undo / Done still works.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="shrink-0 whitespace-nowrap"
            variant={range === 7 ? 'primary' : 'secondary'}
            onClick={() => setRange(7)}
          >
            7 Days
          </Button>
          <Button
            size="sm"
            className="shrink-0 whitespace-nowrap"
            variant={range === 30 ? 'primary' : 'secondary'}
            onClick={() => setRange(30)}
          >
            30 Days
          </Button>
          <Button
            size="sm"
            className="shrink-0 whitespace-nowrap"
            variant={range === 90 ? 'primary' : 'secondary'}
            onClick={() => setRange(90)}
          >
            90 Days
          </Button>
          <Button
            size="sm"
            className="shrink-0 whitespace-nowrap"
            variant="secondary"
            onClick={() => window.print()}
          >
            <Printer size={14} />
            Print
          </Button>
        </div>
      </div>

      <div className="print-checklist space-y-4">
        <h3 className="hidden text-lg font-bold print:block">
          {range === 30
            ? `${format(new Date(), 'MMMM yyyy')} Injection Checklist`
            : `${range}-Day Injection Checklist`}
        </h3>
        {scheduleDates.map((dateStr) => {
          const injections = getInjectionsForDate(
            peptides,
            parseLocalYmd(dateStr),
            profile.startDate
          )
          if (injections.length === 0) return null
          const isToday = dateStr === today
          return (
            <div key={dateStr} ref={isToday ? todayRef : undefined}>
            <Card
              className={isToday ? 'ring-1 ring-teal-500/40' : ''}
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold text-white">
                  {format(parseLocalYmd(dateStr), 'EEE, MMM d')}
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
                  const logged = injectionLogs.find(
                    (l) => l.date === dateStr && l.peptideId === inj.peptideId
                  )
                  const loggedLine =
                    logged?.units != null
                      ? `${inj.peptideName} · ${logged.units} units on U-100 · ${inj.timing}`
                      : inj.cardLine
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
                          <span className="text-slate-200">{loggedLine}</span>
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
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default InjectionHistory
