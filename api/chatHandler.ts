import { AUTHORITATIVE_PEPTIDE_KNOWLEDGE } from './peptideKnowledge.js'

export const ASSISTANT_UNAVAILABLE =
  'Assistant unavailable — check API key / network'

const PROTOCOL_ASSISTANT_PROMPT = `You are the PeptideTracker Protocol Assistant.

You help THIS user with THEIR saved 90-day recomp protocol and with peptide questions in general.

Rules:
- Always use the user context JSON as ground truth for what they are running.
- When they ask “what do I take tonight?” or “what do I inject today?” answer from TODAY’S INJECTIONS + current week phase, with units.
- When they ask about titration, use their start date and current week. Reta steps every 4 weeks, not weekly.
- Be direct, specific, and practical. Use mg AND U-100 units.
- Short answers first, then detail if asked.
- This is research-use / compounding tracking, not a prescription. Tracking + education only, not medical advice.
- Tesamorelin and testosterone are prescription drugs with labeled uses. Retatrutide is investigational. AOD, BPC, SS-31 research vials, GHK-Cu injectable, MOTS-c, KLOW, NAD+ subQ have limited or no approved recomp dosing.
- Do not tell them to copy Forzinity 40 mg SS-31 onto a research vial.
- Do not promise +8 lb muscle and 7% BF in 90 days. Honest frame: fat loss from Reta + deficit + steps; muscle from Test + Tesamorelin + lifting + protein; support peptides are adjuncts.
- If they ask something outside peptides / training / nutrition / their protocol, answer briefly then steer back.
- If you lack their lab values, say so and recommend they use labs + a clinician for dose changes.
- Never ignore their actual saved doses in favor of a generic internet protocol.
- If hasPlan is false, say: “I don’t have a 90-day protocol on file yet. Add compounds on the 90-Day tab and I’ll coach from your actual plan.” Then still answer general peptide questions from the knowledge base.
- If a field is "not provided", do not invent labs or doses.
- Classic KLOW is often an 80 mg blend; this app treats the vial as 10 mg unless the user context says otherwise. Standalone BPC-157 may already be in the stack — if KLOW also contains BPC, they may be stacking BPC twice.

Knowledge you must be able to cover:
- What each peptide is studied or commonly used for
- Typical published vs community ranges
- Reconstitution and U-100 math: units = (desired_mg / (vial_mg / bac_ml)) * 100
- Timing (fasted vs nightly vs weekly)
- Injection site rotation (abdomen vs thigh; NAD+ often thigh, inject slow, can burn)
- Side-effect flags (Reta GI, Tesamorelin glucose/IGF-1, NAD+ burn, site irritation)
- Stack interactions relevant to THIS plan (BPC already standalone + KLOW may also contain BPC)
- When to hold a titration
- How check-ins, weight trend, and adherence connect to the plan

USER CONTEXT JSON:
{{userContext}}

${AUTHORITATIVE_PEPTIDE_KNOWLEDGE}`

export interface ChatRequestBody {
  messages: { role: string; content: string }[]
  userContext?: string
  protocolWeek?: number
  lastUserMessage?: string
}

export interface ChatResponseBody {
  content: string
  profileUpdates: Record<string, unknown> | null
  error?: string
}

export interface ChatApiKeys {
  openaiKey?: string
  xaiKey?: string
}

type AIProvider = 'xai' | 'openai'

const XAI_MODELS = ['grok-4.6', 'grok-4.5', 'grok-3-mini'] as const

const PROVIDER_CONFIG: Record<
  AIProvider,
  { url: string; models: readonly string[]; label: string }
> = {
  xai: {
    url: 'https://api.x.ai/v1/chat/completions',
    models: XAI_MODELS,
    label: 'xAI Grok',
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o-mini'],
    label: 'OpenAI',
  },
}

function resolveProviders(keys: ChatApiKeys): Array<{
  provider: AIProvider
  apiKey: string
}> {
  const out: Array<{ provider: AIProvider; apiKey: string }> = []
  const xaiKey = keys.xaiKey?.trim()
  if (xaiKey) out.push({ provider: 'xai', apiKey: xaiKey })
  const openaiKey = keys.openaiKey?.trim()
  if (openaiKey) out.push({ provider: 'openai', apiKey: openaiKey })
  return out
}

function formatAIError(provider: AIProvider, message?: string): string {
  if (/quota|billing|insufficient|credits/i.test(message ?? '')) {
    if (provider === 'xai') {
      return `${ASSISTANT_UNAVAILABLE}. Your xAI account has no available credits (console.x.ai → Billing).`
    }
    return `${ASSISTANT_UNAVAILABLE}. Your OpenAI account has no available credits.`
  }
  if (/api key|unauthorized|invalid key|authentication/i.test(message ?? '')) {
    return `${ASSISTANT_UNAVAILABLE}. ${PROVIDER_CONFIG[provider].label} API key was rejected.`
  }
  return message
    ? `${ASSISTANT_UNAVAILABLE}. ${message}`
    : ASSISTANT_UNAVAILABLE
}

function lastUserText(messages: { role: string; content: string }[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user' && messages[i].content.trim()) {
      return messages[i].content.trim()
    }
  }
  return ''
}

function buildSystemPrompt(userContext?: string): string {
  const ctx = userContext?.trim()
    ? userContext.trim()
    : JSON.stringify({
        hasPlan: false,
        noPlanMessage:
          "I don't have a 90-day protocol on file yet. Add compounds on the 90-Day tab and I'll coach from your actual plan.",
      })
  return PROTOCOL_ASSISTANT_PROMPT.replace('{{userContext}}', ctx)
}

async function callChatCompletions(opts: {
  url: string
  apiKey: string
  model: string
  systemContent: string
  messages: { role: string; content: string }[]
}): Promise<{
  ok: boolean
  status: number
  content: string
  errorMessage?: string
  modelMissing?: boolean
}> {
  const response = await fetch(opts.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      messages: [{ role: 'system', content: opts.systemContent }, ...opts.messages],
      max_tokens: 1400,
      temperature: 0.4,
    }),
  })

  const raw = await response.text()
  let data: {
    error?: { message?: string; code?: string } | string
    choices?: Array<{ message?: { content?: string | null } }>
  } = {}
  try {
    data = raw ? (JSON.parse(raw) as typeof data) : {}
  } catch {
    data = { error: raw.slice(0, 200) || `HTTP ${response.status}` }
  }

  const errMsg =
    typeof data.error === 'string'
      ? data.error
      : data.error?.message || (response.ok ? '' : `HTTP ${response.status}`)
  const modelMissing =
    response.status === 404 ||
    response.status === 403 ||
    /model|not found|does not exist|unknown model|forbidden/i.test(errMsg)

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      content: '',
      errorMessage: errMsg,
      modelMissing,
    }
  }

  const content = (data.choices?.[0]?.message?.content ?? '').trim()
  return { ok: true, status: 200, content }
}

export async function runChat(
  body: ChatRequestBody,
  keys: ChatApiKeys = {}
): Promise<{ status: number; body: ChatResponseBody }> {
  const providers = resolveProviders(keys)
  if (!providers.length) {
    return {
      status: 503,
      body: {
        content: '',
        profileUpdates: null,
        error: `${ASSISTANT_UNAVAILABLE}. Add XAI_API_KEY or VITE_XAI_API_KEY in Vercel env (server-side) and redeploy.`,
      },
    }
  }

  const { messages, userContext, protocolWeek, lastUserMessage } = body

  if (!messages?.length) {
    return {
      status: 400,
      body: { content: '', profileUpdates: null, error: 'Messages required' },
    }
  }

  const lastUser = lastUserMessage || lastUserText(messages)
  console.log('[assistant]', {
    week: protocolWeek ?? null,
    lastUserMessage: lastUser.slice(0, 180),
    providers: providers.map((p) => p.provider),
  })

  const systemContent = buildSystemPrompt(userContext)

  try {
    let lastError = ''
    let lastProvider: AIProvider = providers[0].provider
    for (const { provider, apiKey } of providers) {
      lastProvider = provider
      const config = PROVIDER_CONFIG[provider]
      for (const model of config.models) {
        const result = await callChatCompletions({
          url: config.url,
          apiKey,
          model,
          systemContent,
          messages,
        })

        if (result.ok && result.content) {
          return {
            status: 200,
            body: { content: result.content, profileUpdates: null },
          }
        }

        if (result.ok && !result.content) {
          lastError = 'Empty model response'
          continue
        }

        lastError = result.errorMessage || `HTTP ${result.status}`
        if (result.modelMissing) continue
        if (/unauthorized|invalid key|authentication/i.test(lastError)) break
      }
    }

    return {
      status: 502,
      body: {
        content: '',
        profileUpdates: null,
        error: formatAIError(lastProvider, lastError || 'No model available'),
      },
    }
  } catch (err) {
    console.error('[assistant] network', err)
    return {
      status: 500,
      body: {
        content: '',
        profileUpdates: null,
        error: ASSISTANT_UNAVAILABLE,
      },
    }
  }
}

export { PROTOCOL_ASSISTANT_PROMPT }
