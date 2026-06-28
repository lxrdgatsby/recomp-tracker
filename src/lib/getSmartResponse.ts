import {
  getAssistantContext,
  simulateSmartResponse,
  type AssistantContext,
} from '../utils/assistantFallback'
import { parseChatApiResponse } from './parseChatApiResponse'

const DISCLAIMER =
  'Always include a brief disclaimer that this is not medical advice.'

function buildContextString(context: AssistantContext): string {
  return `You are a helpful peptide and body recomp coach.\nUser context: ${JSON.stringify(context)}.`
}

export interface ChatResponseResult {
  content: string
  profileUpdates: Record<string, unknown> | null
}

/** Full chat API call with message history (used by useChat). */
export async function fetchChatResponse(params: {
  messages: { role: string; content: string }[]
  userContext: string
}): Promise<ChatResponseResult> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: params.messages,
        userContext: `${params.userContext}\n\n${DISCLAIMER}`,
      }),
    })

    const data = await parseChatApiResponse(res)
    return {
      content: data.content ?? "Sorry, I couldn't process that.",
      profileUpdates:
        data.profileUpdates && typeof data.profileUpdates === 'object'
          ? (data.profileUpdates as Record<string, unknown>)
          : null,
    }
  } catch (err) {
    console.error('fetchChatResponse:', err)
    const lastUser = [...params.messages].reverse().find((m) => m.role === 'user')
    return {
      content: simulateSmartResponse(
        lastUser?.content ?? '',
        getAssistantContext()
      ),
      profileUpdates: null,
    }
  }
}

/** Single-message helper matching the smart response sketch. */
export async function getSmartResponse(
  message: string,
  context: AssistantContext = getAssistantContext(),
  userContext?: string
): Promise<string> {
  const result = await fetchChatResponse({
    messages: [{ role: 'user', content: message }],
    userContext: userContext ?? buildContextString(context),
  })
  return result.content
}

/** API call with context — uses xAI when XAI_API_KEY is set server-side. */
export async function callGrokAPI(
  message: string,
  context: AssistantContext = getAssistantContext()
): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: message }],
      userContext: `${buildContextString(context)}\n\n${DISCLAIMER}`,
    }),
  })

  const data = await parseChatApiResponse(res)
  return data.content ?? "Sorry, I couldn't process that."
}