import { addDays, format, parseISO } from 'date-fns'
import type { UserProfile } from '../types/auth'
import type { Peptide, TrackerState } from '../types'
import { getLatestWeight, getStartWeight } from './calculations'
import { getCheckInHistory } from './checkInStorage'
import {
  getInjectionsForDate,
  isInjectionDone,
  type ScheduledInjection,
} from './peptideSchedule'
import { getProtocolHeader } from './protocolHeader'
import { getTitrationForDay } from './recompProtocol'
import { formatUnits } from './doseMath'
import { planNutritionFocus, inferWeightGoalMode } from '../constants/onboardingGoals'
import { getOnboardingData } from './onboardingStorage'

export const NO_PLAN_MESSAGE =
  "I don't have a 90-day protocol on file yet. Add compounds on the 90-Day tab and I'll coach from your actual plan."

const NOT_PROVIDED = 'not provided'

export interface AssistantCompound {
  id: string
  name: string
  currentDoseMg: number | typeof NOT_PROVIDED
  currentDoseLabel: string
  units: number | typeof NOT_PROVIDED
  timing: string
  frequency: string
  reconstitution: {
    vialMg: number | typeof NOT_PROVIDED
    bacMl: number | typeof NOT_PROVIDED
    mgPerMl: string
  }
  nextTitration: string
}

export interface AssistantUserContext {
  hasPlan: boolean
  noPlanMessage?: string
  profile: {
    name: string
    email: string
    startDate: string
    currentWeek: number
    startWeight: number | typeof NOT_PROVIDED
    currentWeight: number | typeof NOT_PROVIDED
    goalWeight: number | typeof NOT_PROVIDED
    bodyFatOrPhysiqueGoal: string
    calorieTarget: string
    proteinTarget: string
    trainingNotes: string
  }
  protocol: {
    compounds: AssistantCompound[]
  }
  adherence: {
    today: Array<{
      name: string
      cardLine: string
      slot: string
      timing: string
      units: number | typeof NOT_PROVIDED
      done: boolean
    }>
    last7Days: { completed: number; missed: number; scheduled: number }
    latestCheckIn: {
      date: string
      weight: string
      energy: string
      sides: string
    } | typeof NOT_PROVIDED
  }
  protocolWeek: number
  lastUserMessage?: string
}

function missing(value: unknown): boolean {
  return (
    value == null ||
    value === '' ||
    (typeof value === 'number' && !Number.isFinite(value))
  )
}

function orMissing<T>(value: T | null | undefined): T | typeof NOT_PROVIDED {
  return missing(value) ? NOT_PROVIDED : (value as T)
}

function frequencyLabel(freq: Peptide['frequency']): string {
  if (freq === 'mwf') return 'M/W/F'
  if (freq === 'weekly') return 'weekly'
  return 'daily'
}

function nextTitrationNote(peptide: Peptide, dayInCycle: number): string {
  const titration = peptide.protocol?.titration
  if (!titration?.length) return NOT_PROVIDED
  const current = getTitrationForDay(peptide, dayInCycle)
  if (!current) return NOT_PROVIDED
  const idx = titration.findIndex(
    (t) => t.weeks === current.weeks && t.doseMg === current.doseMg
  )
  const next = idx >= 0 ? titration[idx + 1] : undefined
  if (!next) return 'No further titration on file — hold current dose'
  const startWeek = parseInt(next.weeks.split('-')[0] ?? '', 10)
  const units =
    peptide.id === 'test-cyp'
      ? next.doseLabel
      : `${formatUnits(next.syringeUnits)} units on U-100`
  if (!Number.isFinite(startWeek)) {
    return `${next.doseLabel} (${units})`
  }
  return `Week ${startWeek}: ${next.doseMg || next.doseLabel} · ${units}${next.notes ? ` — ${next.notes}` : ''}`
}

function nutritionFromPlan(state: TrackerState, goals: string[]): {
  calories: string
  protein: string
} {
  const notes = (state.recompPlan?.nutritionNotes ?? []).join(' | ')
  const calorieMatch = notes.match(/calories[^,|]*|2000–2200|kcal[^,|]*/i)
  const proteinMatch = notes.match(/protein[^,|]*/i)
  const mode = inferWeightGoalMode(
    goals,
    state.profile.currentWeight,
    state.profile.goalWeight
  )
  const fallback = planNutritionFocus(goals, mode)
  return {
    calories: calorieMatch?.[0]?.trim() || fallback || NOT_PROVIDED,
    protein: proteinMatch?.[0]?.trim() || (fallback.includes('protein') ? fallback : NOT_PROVIDED),
  }
}

function last7Adherence(state: TrackerState): {
  completed: number
  missed: number
  scheduled: number
} {
  const start = parseISO(state.profile.startDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let scheduled = 0
  let completed = 0
  for (let i = 0; i < 7; i++) {
    const day = addDays(today, -i)
    if (day < start) continue
    const dateStr = format(day, 'yyyy-MM-dd')
    const shots = getInjectionsForDate(state.peptides, day, state.profile.startDate)
    for (const shot of shots) {
      scheduled += 1
      if (isInjectionDone(state.injectionLogs, dateStr, shot.peptideId)) {
        completed += 1
      }
    }
  }
  return {
    scheduled,
    completed,
    missed: Math.max(0, scheduled - completed),
  }
}

function compoundFromPeptide(
  peptide: Peptide,
  dayInCycle: number
): AssistantCompound {
  const proto = peptide.protocol
  const tier = getTitrationForDay(peptide, dayInCycle)
  const isVolume = peptide.id === 'test-cyp' || /ml/i.test(peptide.dose)
  const units = isVolume
    ? NOT_PROVIDED
    : orMissing(tier?.syringeUnits ?? proto?.startingSyringeUnits)
  const doseMg = isVolume
    ? NOT_PROVIDED
    : orMissing(tier?.doseMg ?? proto?.startingDoseMg)

  return {
    id: peptide.id,
    name: peptide.name,
    currentDoseMg: doseMg,
    currentDoseLabel: isVolume
      ? peptide.dose
      : typeof units === 'number'
        ? `${formatUnits(units)} units on U-100`
        : peptide.dose,
    units,
    timing: peptide.timing || NOT_PROVIDED,
    frequency: frequencyLabel(peptide.frequency),
    reconstitution: {
      vialMg:
        proto && proto.vialMg > 0 ? proto.vialMg : NOT_PROVIDED,
      bacMl:
        proto && proto.bacWaterMl > 0 ? proto.bacWaterMl : NOT_PROVIDED,
      mgPerMl: proto?.concentrationLabel || NOT_PROVIDED,
    },
    nextTitration: nextTitrationNote(peptide, dayInCycle),
  }
}

export function buildAssistantUserContext(
  userProfile: UserProfile | null | undefined,
  trackerState: TrackerState,
  extras?: { lastUserMessage?: string }
): AssistantUserContext {
  const startDate = trackerState.profile.startDate
  const { week } = getProtocolHeader(startDate)
  const dayInCycle = Math.max(0, week * 7 - 7)
  const peptides = trackerState.peptides ?? []
  const hasPlan = peptides.length > 0
  const onboarding = getOnboardingData()
  const goals =
    onboarding?.goals ??
    userProfile?.mainGoal?.split(',').map((g) => g.trim()).filter(Boolean) ??
    []
  const nutrition = nutritionFromPlan(trackerState, goals)
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const todayShots: ScheduledInjection[] = hasPlan
    ? getInjectionsForDate(peptides, today, startDate)
    : []
  const checkIns = getCheckInHistory()
  const latest = checkIns.length ? checkIns[checkIns.length - 1] : null
  const startWeight = getStartWeight(trackerState.profile, trackerState.weightHistory)
  const currentWeight = getLatestWeight(
    trackerState.profile,
    trackerState.weightHistory
  )

  const physique =
    goals.find((g) => /recomp|fat|muscle|physique|body/i.test(g)) ||
    userProfile?.mainGoal ||
    onboarding?.habits ||
    NOT_PROVIDED

  const context: AssistantUserContext = {
    hasPlan,
    ...(hasPlan ? {} : { noPlanMessage: NO_PLAN_MESSAGE }),
    profile: {
      name: userProfile?.username || NOT_PROVIDED,
      email: userProfile?.email || NOT_PROVIDED,
      startDate: startDate || NOT_PROVIDED,
      currentWeek: week,
      startWeight: orMissing(startWeight),
      currentWeight: orMissing(currentWeight),
      goalWeight: orMissing(trackerState.profile.goalWeight),
      bodyFatOrPhysiqueGoal: physique || NOT_PROVIDED,
      calorieTarget: nutrition.calories,
      proteinTarget: nutrition.protein,
      trainingNotes:
        userProfile?.trainingActivities ||
        trackerState.recompPlan?.trainingNotes?.join(' | ') ||
        NOT_PROVIDED,
    },
    protocol: {
      compounds: peptides.map((p) => compoundFromPeptide(p, dayInCycle)),
    },
    adherence: {
      today: todayShots.map((s) => ({
        name: s.peptideName,
        cardLine: s.cardLine,
        slot: s.slot,
        timing: s.timing,
        units: s.syringeUnits != null && s.syringeUnits > 0 ? s.syringeUnits : NOT_PROVIDED,
        done: isInjectionDone(trackerState.injectionLogs, todayStr, s.peptideId),
      })),
      last7Days: last7Adherence(trackerState),
      latestCheckIn: latest
        ? {
            date: latest.date,
            weight: latest.weight || NOT_PROVIDED,
            energy: latest.energy || NOT_PROVIDED,
            sides: latest.sideEffects || NOT_PROVIDED,
          }
        : NOT_PROVIDED,
    },
    protocolWeek: week,
    lastUserMessage: extras?.lastUserMessage,
  }

  return context
}

export function stringifyAssistantUserContext(
  ctx: AssistantUserContext
): string {
  return JSON.stringify(ctx, null, 2)
}

export function getAssistantQuickPrompts(peptides: Peptide[]): string[] {
  const ids = new Set(peptides.map((p) => p.id))
  const chips = ['What do I inject today?']
  if (ids.has('retatrutide') || ids.has('tesamorelin')) {
    chips.push('What is my current Reta / Tesamorelin dose in units?')
  }
  chips.push('Can I titrate this week?')
  chips.push('Why is my weight stalling?')
  if (ids.has('tesamorelin')) {
    chips.push('Explain Tesamorelin timing')
  }
  if (ids.has('bpc157')) {
    chips.push('Reconstitute my BPC-157 vial')
  }
  if (ids.has('klow') && ids.has('bpc157')) {
    chips.push("What's the difference between my KLOW and standalone BPC?")
  }
  if (chips.length < 5) {
    chips.push('How do I reconstitute a peptide vial?')
  }
  return chips.slice(0, 7)
}
