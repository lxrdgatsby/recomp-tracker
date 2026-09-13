import { format } from 'date-fns'
import { Check } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import {
  CYCLE_START_DATE,
  FAT_LOSS_DRIVERS,
  GOAL_WEIGHT_LB,
  GUIDANCE_CARDS,
  HONEST_OUTCOME_COPY,
  KLOW_NOTE,
  MUSCLE_DRIVERS,
  RESEARCH_DISCLAIMER,
  START_WEIGHT_LB,
} from '../../constants/reconstitutionTable'
import { CYCLE_DAYS } from '../../constants/defaults'
import { PHASE_NOTES, hasSeededProtocol } from '../../lib/protocolSeed'
import type { TrackerState } from '../../types'
import { getDaysIntoCycle } from '../../utils/calculations'
import {
  getInjectionsForDate,
  groupInjectionsBySlot,
  isInjectionDone,
} from '../../utils/peptideSchedule'
import { getProtocolHeader } from '../../utils/protocolHeader'
import { ProtocolCard } from '../protocol/ProtocolCard'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { ProgressBar } from '../ui/ProgressBar'

interface PlanViewProps {
  state: TrackerState
  onToggleInjection: (date: string, peptideId: string) => void
}

function phaseLabel(week: number): string {
  if (week <= 4) return 'Weeks 1–4'
  if (week <= 8) return 'Weeks 5–8'
  return 'Weeks 9–12'
}

export function PlanView({ state, onToggleInjection }: PlanViewProps) {
  const { userProfile } = useAuth()
  const { profile, peptides, recompPlan, injectionLogs } = state
  const today = format(new Date(), 'yyyy-MM-dd')
  const { week, dateLabel } = getProtocolHeader(profile.startDate)
  const daysIn = getDaysIntoCycle(profile.startDate)
  const cycleProgress = Math.round((daysIn / CYCLE_DAYS) * 100)
  const seeded =
    hasSeededProtocol() || peptides.some((p) => p.id === 'test-cyp')
  const startLabel = profile.startDate || CYCLE_START_DATE

  const todayInjections = getInjectionsForDate(
    peptides,
    new Date(),
    profile.startDate
  )
  const grouped = groupInjectionsBySlot(todayInjections)
  const phase = phaseLabel(week)
  const phaseNotes =
    week <= 4
      ? PHASE_NOTES.weeks1to4
      : week <= 8
        ? PHASE_NOTES.weeks5to8
        : PHASE_NOTES.weeks9to12

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h2 className="text-2xl font-bold text-white">90-Day Recomp Plan</h2>
        <p className="mt-1 text-sm text-slate-400">
          {dateLabel} · Week {week} · {phase}
          {userProfile?.username ? ` · @${userProfile.username}` : ''}
        </p>
      </div>

      <Card className="!p-4">
        <p className="text-xs tracking-[2px] text-emerald-400 uppercase">
          User targets
        </p>
        <p className="mt-2 text-lg font-semibold text-white">
          Start {START_WEIGHT_LB} lb → Goal {GOAL_WEIGHT_LB} lb
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Window: 90 days from {format(new Date(`${startLabel}T00:00:00`), 'MMM d, yyyy')}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          {HONEST_OUTCOME_COPY}
        </p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-slate-500">Fat-loss drivers: </span>
            <span className="text-emerald-300">{FAT_LOSS_DRIVERS}</span>
          </p>
          <p>
            <span className="text-slate-500">Muscle drivers: </span>
            <span className="text-emerald-300">{MUSCLE_DRIVERS}</span>
          </p>
        </div>
      </Card>

      <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-100">
        {RESEARCH_DISCLAIMER}
      </div>

      {seeded && <ProtocolCard state={state} />}

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
          <p className="text-xs text-slate-500">Current phase</p>
          <p className="mt-1 text-2xl font-bold text-teal-400">{phase}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-slate-500">Scale target</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">−15 lb</p>
        </Card>
      </div>

      <Card title="90-Day Timeline">
        <ProgressBar value={cycleProgress} label="Days elapsed" />
      </Card>

      <Card title="Today's Injections" className="no-print">
        <p className="mb-4 text-xs text-slate-500">
          Current phase doses auto-selected from {startLabel}. Mark Done / Undo is
          saved. Injection history lives on Progress.
        </p>
        {todayInjections.length === 0 ? (
          <p className="text-sm text-slate-500">No injections scheduled today.</p>
        ) : (
          <div className="space-y-5">
            {grouped.map((group) => (
              <div key={group.slot}>
                <h4 className="mb-2 text-xs tracking-[2px] text-emerald-400/90 uppercase">
                  {group.label}
                </h4>
                <div className="space-y-2">
                  {group.items.map((inj) => {
                    const done = isInjectionDone(
                      injectionLogs,
                      today,
                      inj.peptideId
                    )
                    return (
                      <div
                        key={inj.peptideId}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-navy-950/40 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-white">{inj.cardLine}</p>
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
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title={`${phase} (auto-selected)`}>
        <ul className="space-y-2 text-sm text-slate-300">
          {phaseNotes.map((line) => (
            <li key={line}>· {line}</li>
          ))}
        </ul>
      </Card>

      <Card title="Stack guidance">
        <ul className="space-y-2 text-sm text-slate-300">
          {(recompPlan?.trainingNotes?.length
            ? recompPlan.trainingNotes
            : GUIDANCE_CARDS
          ).map((line) => (
            <li key={line}>· {line}</li>
          ))}
        </ul>
      </Card>

      <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm leading-relaxed text-rose-100">
        {KLOW_NOTE}
      </div>
    </div>
  )
}
