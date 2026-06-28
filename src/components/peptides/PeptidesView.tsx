import { format, parseISO, differenceInDays } from 'date-fns'
import {
  CheckCircle,
  Clock,
  Plus,
  Syringe,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Peptide, TrackerState } from '../../types'
import { getDaysIntoCycle } from '../../utils/calculations'
import {
  getInjectionsForDate,
  isInjectionDone,
} from '../../utils/peptideSchedule'
import { getTitrationForDay } from '../../utils/recompProtocol'

interface PeptidesViewProps {
  state: TrackerState
  onToggleInjection: (date: string, peptideId: string) => void
}

interface StackCard {
  peptide: Peptide
  nextDose: string
  frequency: string
  doneToday: boolean
  scheduledToday: boolean
}

function buildStackCards(state: TrackerState, today: string): StackCard[] {
  const { peptides, profile, injectionLogs } = state
  const todayDate = new Date()
  const scheduledToday = getInjectionsForDate(
    peptides,
    todayDate,
    profile.startDate
  )
  const scheduledIds = new Set(scheduledToday.map((s) => s.peptideId))

  return peptides.map((peptide) => {
    const scheduled = scheduledToday.find((s) => s.peptideId === peptide.id)
    const dayInCycle = Math.max(
      0,
      differenceInDays(todayDate, parseISO(profile.startDate))
    )
    const tier = getTitrationForDay(peptide, dayInCycle)
    const doseLabel = tier?.doseLabel ?? peptide.protocol?.startingDoseLabel ?? peptide.dose
    const units =
      tier?.syringeUnits ?? peptide.protocol?.startingSyringeUnits
    const nextDose = units != null ? `${doseLabel} (${units} units)` : doseLabel

    const frequency =
      peptide.frequency === 'weekly'
        ? 'Weekly'
        : peptide.frequency === 'daily'
          ? 'Daily'
          : scheduled?.timing ?? peptide.timing ?? 'As scheduled'

    return {
      peptide,
      nextDose: scheduled ? nextDose : nextDose,
      frequency,
      doneToday: isInjectionDone(injectionLogs, today, peptide.id),
      scheduledToday: scheduledIds.has(peptide.id),
    }
  })
}

const INJECTION_SITES = [
  'Abdomen — rotate between four quadrants, 2 inches from navel',
  'Thigh — alternate left and right, front or outer area',
  'Upper arm — back of arm, alternate sides each dose',
  'Rotate sites weekly to reduce irritation and lipohypertrophy',
]

export function PeptidesView({ state, onToggleInjection }: PeptidesViewProps) {
  const { peptides } = state
  const today = format(new Date(), 'yyyy-MM-dd')
  const guideRef = useRef<HTMLDivElement>(null)
  const [showSites, setShowSites] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)

  const stackCards = useMemo(() => buildStackCards(state, today), [state, today])

  const examplePeptide = peptides.find((p) => p.protocol) ?? peptides[0]

  const scrollToGuide = () => {
    setShowCalculator(false)
    guideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="pb-8 text-white">
      <div className="pb-6 pt-2">
        <h1 className="text-3xl font-semibold tracking-tight">Peptides</h1>
        <p className="text-slate-400">Reconstitution • Dosing • Protocols</p>
      </div>

      <div ref={guideRef} className="mb-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Syringe className="text-emerald-400" size={20} />
            </div>
            <div>
              <div className="font-medium">Reconstitution Guide</div>
              <div className="text-xs text-slate-400">
                U-100 syringe • 100 units = 1ml
              </div>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex gap-3">
              <div className="font-mono text-emerald-400">1.</div>
              <div>
                Add BAC water slowly down the vial wall. Swirl gently.{' '}
                <span className="text-emerald-400">Never shake.</span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="font-mono text-emerald-400">2.</div>
              <div>Refrigerate immediately for 30 minutes before first use.</div>
            </div>
            <div className="flex gap-3">
              <div className="font-mono text-emerald-400">3.</div>
              <div>Store in fridge (36–46°F). Use within 28–30 days.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium">Your Stack</h2>
          <Link
            to="/app/profile"
            className="flex items-center gap-1.5 text-sm text-emerald-400 transition-colors hover:text-emerald-300"
          >
            <Plus size={16} /> Add Peptide
          </Link>
        </div>

        {stackCards.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
            <p className="text-sm text-slate-400">
              No peptides in your stack yet.
            </p>
            <Link
              to="/app/profile"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-emerald-400"
            >
              <Plus size={16} /> Add your first peptide
            </Link>
          </div>
        ) : (
          stackCards.map(({ peptide, nextDose, frequency, doneToday, scheduledToday }) => {
            const protocol = peptide.protocol
            const vial = peptide.vialSize ?? peptide.dose
            const concentration = protocol?.concentrationLabel ?? '—'
            const reconstituted = protocol?.reconstituted ?? false

            return (
              <div
                key={peptide.id}
                className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xl font-semibold">{peptide.name}</div>
                    <div className="text-sm text-slate-400">
                      {vial} vial • {concentration}
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs ${
                      reconstituted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {reconstituted ? (
                      <CheckCircle size={14} />
                    ) : (
                      <Clock size={14} />
                    )}
                    {reconstituted ? 'Reconstituted' : 'Not mixed'}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-400">Next Dose</div>
                    <div className="font-medium">{nextDose}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Frequency</div>
                    <div className="font-medium">{frequency}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleInjection(today, peptide.id)}
                  disabled={!scheduledToday && !doneToday}
                  className={`mt-6 w-full rounded-2xl py-3.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                    doneToday
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-emerald-500 text-black hover:bg-emerald-600'
                  }`}
                >
                  {doneToday
                    ? '✓ Logged Today'
                    : scheduledToday
                      ? 'Log Injection'
                      : 'Not scheduled today'}
                </button>
              </div>
            )
          })
        )}
      </div>

      <div>
        <h2 className="mb-3 font-medium">Quick Tools</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setShowSites(false)
              setShowCalculator((v) => !v)
              if (!showCalculator) scrollToGuide()
            }}
            className="h-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition-colors hover:bg-white/10"
          >
            <div className="mb-1 text-emerald-400">📏</div>
            <div className="font-medium">Dose Calculator</div>
            <div className="mt-1 text-xs text-slate-400">Vial → Syringe units</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowCalculator(false)
              setShowSites((v) => !v)
            }}
            className="h-full rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition-colors hover:bg-white/10"
          >
            <div className="mb-1 text-emerald-400">📍</div>
            <div className="font-medium">Injection Sites</div>
            <div className="mt-1 text-xs text-slate-400">Rotation tracker</div>
          </button>
        </div>

        {showCalculator && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
            <p className="font-medium text-emerald-400">U-100 syringe math</p>
            <p className="mt-2 font-mono text-xs text-slate-300">
              concentration = vial mg ÷ BAC water ml
              <br />
              syringe units = (dose mg ÷ concentration) × 100
            </p>
            {examplePeptide?.protocol && (
              <p className="mt-3 text-slate-400">
                <span className="text-white">{examplePeptide.name}:</span>{' '}
                {examplePeptide.protocol.calculationSummary}
              </p>
            )}
            <p className="mt-3 text-xs text-slate-500">
              Week {getDaysIntoCycle(state.profile.startDate) > 0
                ? Math.ceil(getDaysIntoCycle(state.profile.startDate) / 7)
                : 1}{' '}
              of your plan — titration may change syringe units over time.
            </p>
          </div>
        )}

        {showSites && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
            <p className="font-medium">Site rotation</p>
            <ul className="mt-3 space-y-2 text-slate-400">
              {INJECTION_SITES.map((site) => (
                <li key={site} className="flex gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>{site}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}