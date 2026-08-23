import { formatPeptideSelectionsForAI } from '../constants/peptideCatalog'
import { getCheckInHistory, getLastCheckIn } from './checkInStorage'
import { AUTHORITATIVE_PEPTIDE_KNOWLEDGE } from '../constants/peptideKnowledge'
import { SEED_USER } from '../lib/protocolSeed'
import { formatProtocolContextForAI } from './recompProtocol'
import { computeAdherence } from './adherence'
import { getDaysIntoCycle } from './calculations'
import type { TrackerState } from '../types'
import type { UserProfile } from '../types/auth'

function formatCheckInContextForAI(): string {
  const last = getLastCheckIn()
  const history = getCheckInHistory()
  if (!last && history.length === 0) return ''

  const lines = ['Recent check-ins:']
  if (last) {
    lines.push(
      `Latest (${last.date.split('T')[0]}): energy ${last.energy}/10, mood ${last.mood}/10, hunger ${last.hunger}/10, weight ${last.weight || 'n/a'}, side effects: ${last.sideEffects || 'none'}`
    )
  }
  if (history.length > 1) {
    const recent = history.slice(-5)
    const energyTrend = recent.map((c) => c.energy).join(' → ')
    lines.push(`Energy trend (last ${recent.length}): ${energyTrend}`)
  }
  return lines.join('\n')
}

export function buildUserContextForChat(
  userProfile: UserProfile | null | undefined,
  trackerState: TrackerState
): string {
  const p = userProfile
  const t = trackerState
  if (!p) return ''
  return [
    `Username: ${p.username ?? 'unknown'}`,
    `Familiarity: ${p.familiarity ?? 'unknown'}`,
    `Goals: ${p.mainGoal ?? 'unknown'}`,
    `Interested peptides: ${p.interestedPeptides ?? 'none'}`,
    p.peptideSelections?.length
      ? `Peptide selections (dose, status, protocol hints):\n${formatPeptideSelectionsForAI(p.peptideSelections)}`
      : '',
    `Current weight: ${t.profile.currentWeight} lbs`,
    `Goal weight: ${t.profile.goalWeight} lbs`,
    `Weekly loss target: ${t.profile.weeklyLossTarget} lbs`,
    `Start date: ${t.profile.startDate}`,
    `Gender: ${p.gender ?? 'unknown'}`,
    `Age: ${p.age ?? 'unknown'}`,
    `Training: ${p.trainingActivities ?? 'none'}`,
    `Additional info: ${p.additionalInfo ?? 'none'}`,
    `Day ${getDaysIntoCycle(t.profile.startDate)} of 90-day cycle`,
    '',
    '=== TAILORED 90-DAY PEPTIDE PROTOCOL (AUTHORITATIVE — use for ALL dosing/stack answers) ===',
    formatProtocolContextForAI(t.peptides, t.profile.startDate),
    '=== END PROTOCOL ===',
    t.recompPlan?.summary?.length
      ? `Recomp plan summary: ${t.recompPlan.summary.join(' ')}`
      : '',
    `Weight entries logged: ${t.weightHistory.length}`,
    `Workouts completed: ${t.workoutCompletions.length}`,
    formatCheckInContextForAI(),
    '',
    AUTHORITATIVE_PEPTIDE_KNOWLEDGE,
    '',
    'CONTEXT JSON:',
    JSON.stringify(buildAssistantContextJson(p, t)),
  ]
    .filter(Boolean)
    .join('\n')
}

function buildAssistantContextJson(p: UserProfile, t: TrackerState) {
  const cutoff = Date.now() - 14 * 86_400_000
  const recentDoseLogs = (t.injectionLogs ?? []).filter((l) => {
    const ts = Date.parse(l.date)
    return Number.isFinite(ts) && ts >= cutoff
  })
  const checkIns = getCheckInHistory().filter((c) => {
    const ts = Date.parse(c.date)
    return Number.isFinite(ts) && ts >= cutoff
  })
  const adherence = computeAdherence(t)
  const daysIn = getDaysIntoCycle(t.profile.startDate)
  return {
    user: p.username ?? SEED_USER,
    startDate: t.profile.startDate,
    stack: t.peptides.map((pep) => ({
      id: pep.id,
      name: pep.name,
      dose: pep.dose,
      frequency: pep.frequency,
      timing: pep.timing,
      units: pep.protocol?.startingSyringeUnits,
      notes: pep.notes,
    })),
    vials: t.peptides.map((pep) => ({
      name: pep.name,
      vialSize: pep.vialSize,
      concentration: pep.protocol?.concentrationLabel,
      mix:
        pep.protocol && pep.protocol.vialMg > 0
          ? `${pep.protocol.vialMg}mg / ${pep.protocol.bacWaterMl}mL`
          : 'unknown',
    })),
    recentDoseLogs,
    checkIns,
    adherence7d: {
      scheduled: adherence.expectedInjections,
      logged: adherence.completedInjections,
      pct: adherence.injectionPct ?? null,
    },
    planHealth: {
      week: Math.max(0, Math.ceil(daysIn / 7)),
      started: daysIn > 0,
      phaseLabel: daysIn <= 0 ? 'Starts Sunday — weeks 1–4 loaded' : `Day ${daysIn}`,
      warnings: [
        'Confirm Test Cyp mg/mL on the vial before locking units.',
        'KLOW is stored as a 10 mg product, not an 80 mg blend.',
      ],
    },
  }
}
