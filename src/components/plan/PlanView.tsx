import { format, parseISO } from 'date-fns'
import { Check, Flag, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { CYCLE_DAYS } from '../../constants/defaults'
import type { TrackerState } from '../../types'
import {
  getDaysIntoCycle,
  getLatestWeight,
  getMilestones,
  getProjectedGoalDate,
  getStartWeight,
} from '../../utils/calculations'
import {
  getInjectionsForDate,
  getScheduleDates,
  isInjectionDone,
} from '../../utils/peptideSchedule'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { ProgressBar } from '../ui/ProgressBar'

interface PlanViewProps {
  state: TrackerState
  onToggleInjection: (date: string, peptideId: string) => void
}

export function PlanView({ state, onToggleInjection }: PlanViewProps) {
  const { userProfile } = useAuth()
  const { profile, weightHistory, peptides, recompPlan, injectionLogs } = state
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
  const current = getLatestWeight(profile, weightHistory)
  const start = getStartWeight(profile, weightHistory)
  const daysIn = getDaysIntoCycle(profile.startDate)
  const projected = getProjectedGoalDate(
    current,
    profile.goalWeight,
    profile.weeklyLossTarget
  )
  const milestones = getMilestones(profile, start)
  const cycleProgress = Math.round((daysIn / CYCLE_DAYS) * 100)

  const summary =
    recompPlan?.summary ??
    [
      `90-day recomp targeting ${profile.weeklyLossTarget} lb/week.`,
      `${peptides.length} peptide(s) on your configured schedule.`,
    ]

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h2 className="text-2xl font-bold text-white">90-Day Recomp Plan</h2>
        <p className="mt-1 text-sm text-slate-400">
          Tailored from your onboarding profile
          {userProfile?.username ? ` (@${userProfile.username})` : ''}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="!p-4">
          <p className="text-xs text-slate-500">Cycle Progress</p>
          <p className="mt-1 text-2xl font-bold text-white">
            Day {daysIn}{' '}
            <span className="text-base font-normal text-slate-500">
              / {CYCLE_DAYS}
            </span>
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-slate-500">Weekly Loss Target</p>
          <p className="mt-1 text-2xl font-bold text-teal-400">
            {profile.weeklyLossTarget} lbs
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-slate-500">Projected Goal Date</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {projected ? format(projected, 'MMM d, yyyy') : '—'}
          </p>
        </Card>
      </div>

      <Card title="Your Personalized Summary">
        <ul className="space-y-2 text-sm text-slate-300">
          {summary.map((line) => (
            <li key={line}>· {line}</li>
          ))}
        </ul>
      </Card>

      <Card title="90-Day Timeline">
        <ProgressBar value={cycleProgress} label="Days elapsed" />
      </Card>

      <Card title="Key Milestones">
        <div className="space-y-3">
          {milestones.map((m) => (
            <div
              key={m.week}
              className="flex items-center gap-4 rounded-lg border border-slate-800/60 bg-navy-950/30 px-4 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-400">
                <Flag size={16} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{m.label}</p>
                <p className="text-xs text-slate-500">{m.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-emerald-400">
                  ~{m.projectedWeight} lbs
                </p>
                <p className="text-xs text-slate-600">projected</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Nutrition">
          <ul className="space-y-2 text-sm text-slate-400">
            {(recompPlan?.nutritionNotes ?? [
              'High protein to preserve muscle during deficit.',
              'Weigh weekly and adjust calories to hit loss target.',
            ]).map((note) => (
              <li key={note}>· {note}</li>
            ))}
          </ul>
        </Card>
        <Card title="Training">
          <ul className="space-y-2 text-sm text-slate-400">
            {(recompPlan?.trainingNotes ?? [
              '5 training days / 2 rest with 10k steps daily.',
            ]).map((note) => (
              <li key={note}>· {note}</li>
            ))}
          </ul>
          {recompPlan?.checkInCadence && (
            <p className="mt-3 text-xs text-slate-500">{recompPlan.checkInCadence}</p>
          )}
        </Card>
      </div>

      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Injection Schedule</h3>
          <p className="mt-0.5 text-sm text-slate-400">
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
        {peptides.some((p) => p.protocol && !p.protocol.reconstituted) && (
          <p className="mb-3 text-sm text-amber-400/90">
            Mark peptides as reconstituted on the Peptides tab once mixed with BAC
            water — syringe units below are calculated from your selected BAC water
            volume.
          </p>
        )}
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
                      {inj.dose}
                      {inj.syringeUnits != null && (
                        <span className="text-slate-400">
                          {' '}
                          · draw {inj.syringeUnits} units
                        </span>
                      )}
                      {' '}
                      · {inj.timing}
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
                          {inj.syringeUnits != null && (
                            <span className="ml-2 text-slate-400">
                              ({inj.syringeUnits}u)
                            </span>
                          )}
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