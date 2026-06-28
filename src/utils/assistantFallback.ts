import type { CheckInData } from './checkInStorage'
import { getCheckInHistory } from './checkInStorage'
import {
  getOnboardingData,
  type OnboardingData,
} from './onboardingStorage'

export interface AssistantContext {
  onboarding: OnboardingData | null
  checkIns: CheckInData[]
}

export function getAssistantContext(): AssistantContext {
  return {
    onboarding: getOnboardingData(),
    checkIns: [...getCheckInHistory()].sort((a, b) => a.date.localeCompare(b.date)),
  }
}

/** Context-aware fallback when the chat API is unavailable. */
export function getFallbackAssistantResponse(
  userMessage: string,
  context: AssistantContext = getAssistantContext()
): string {
  return simulateSmartResponse(userMessage, context)
}

/** Rule-based fallback when the chat API is unavailable. */
export function simulateSmartResponse(
  message: string,
  context: AssistantContext
): string {
  const lower = message.toLowerCase()
  const { onboarding, checkIns } = context

  if (lower.includes('dose') || lower.includes('injected')) {
    const stackHint =
      onboarding?.peptides?.length &&
      (lower.includes('stack') || lower.includes('peptide'))
        ? ` (${onboarding.peptides.map((p) => p.name).join(', ')})`
        : ''
    return `Dose logged successfully${stackHint}. Want me to calculate your next week's units or track how you're feeling?`
  }

  if (lower.includes('energy') || lower.includes('feeling')) {
    if (checkIns.length > 0) {
      const avgEnergy =
        checkIns.reduce((sum, c) => sum + parseInt(c.energy, 10), 0) /
        checkIns.length
      return `Thanks for the update. Your recent check-ins average ${avgEnergy.toFixed(1)}/10 energy. Most users on your stack notice energy improvements around week 3–4. Want me to analyze your recent check-ins?`
    }
    return "Thanks for the update. Most users on your stack notice energy improvements around week 3–4. Want me to analyze your recent check-ins?"
  }

  if (
    lower.includes('stack') ||
    lower.includes('peptide') ||
    lower.includes('protocol')
  ) {
    if (onboarding?.peptides?.length) {
      const list = onboarding.peptides
        .map((p) => `${p.name} (${p.status})`)
        .join(', ')
      return `Your current stack: ${list}. Want titration advice or side-effect checks for any of these?`
    }
    return "I don't have peptides on file yet — add them in onboarding or tell me what you're running."
  }

  if (lower.includes('goal') || lower.includes('progress')) {
    if (onboarding?.goals?.length) {
      return `Your goals: ${onboarding.goals.join(', ')}. Want a progress check-in or plan adjustment?`
    }
    return "Got it — I've updated your context. What else can I help with?"
  }

  return "Got it — I've updated your context. What else can I help with?"
}