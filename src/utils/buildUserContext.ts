import { formatPeptideSelectionsForAI } from '../constants/peptideCatalog'
import { AUTHORITATIVE_PEPTIDE_KNOWLEDGE } from '../constants/peptideKnowledge'
import { formatProtocolContextForAI } from './recompProtocol'
import { getDaysIntoCycle } from './calculations'
import type { TrackerState } from '../types'
import type { UserProfile } from '../types/auth'

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
    '',
    AUTHORITATIVE_PEPTIDE_KNOWLEDGE,
  ]
    .filter(Boolean)
    .join('\n')
}