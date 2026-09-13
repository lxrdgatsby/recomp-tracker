import type { TrackerState } from '../types'
import type { UserProfile } from '../types/auth'
import {
  buildAssistantUserContext,
  stringifyAssistantUserContext,
} from './assistantUserContext'

/**
 * Live protocol context for every Assistant call.
 * Built from the same tracker state the 90-Day tab uses.
 */
export function buildUserContextForChat(
  userProfile: UserProfile | null | undefined,
  trackerState: TrackerState,
  lastUserMessage?: string
): string {
  const ctx = buildAssistantUserContext(userProfile, trackerState, {
    lastUserMessage,
  })
  return stringifyAssistantUserContext(ctx)
}
