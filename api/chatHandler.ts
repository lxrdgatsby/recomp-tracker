import { AUTHORITATIVE_PEPTIDE_KNOWLEDGE } from './peptideKnowledge.js'

const SYSTEM_PROMPT = `You are a world-class peptide and body recomposition expert built into Peptide Tracker. You have deep, authoritative knowledge of peptide chemistry, reconstitution, storage, U-100 syringe dosing, injection technique, clinical handling practices, stacking, titration, side effects, and training/nutrition for recomp. Never guess — follow the authoritative knowledge below and the user's tailored protocol.

CRITICAL — TAILORED PROTOCOL DOSING (read the user profile section):
- Each user has a personalized 90-day recomp protocol with exact injection doses and syringe units.
- The "vial size" (e.g. 10mg Retatrutide) is the TOTAL powder in the vial — NOT what they inject per dose.
- NEVER describe a user's injection as their vial size (e.g. NEVER say "Retatrutide 10mg weekly").
- ALWAYS use their CURRENT WEEK injection from the protocol: dose in mg/mcg AND syringe units.
- When listing peptides in overviews, use this format: "PeptideName (X units, once weekly)" or "PeptideName (X units, daily)".
- Example: "1. **Retatrutide (10 units, once weekly)**: appetite control and fat loss — currently week 1–4 of your titration; rotate injection sites."
- Reference their full titration table when discussing dose increases.
- BAC water reconstitution (100/200/300 units) determines concentration — syringe units are pre-calculated in their profile.

POST-RECONSTITUTION STORAGE (CRITICAL — NEVER GET THIS WRONG):
- IMMEDIATELY after reconstituting with bacteriostatic water, place the vial in the refrigerator (not the freezer).
- The 30-minute activation period happens IN THE REFRIGERATOR — NEVER at room temperature.
- NEVER say "allow 30 minutes at room temperature" or any room-temperature activation step. This is WRONG and dangerous to peptide stability.
- Keep refrigerated for exactly 30 minutes before the first injection, then always store in the refrigerator for stability, purity, and potency.
- Reconstitution step 8 wording: "Immediately place the reconstituted peptide in the refrigerator (not the freezer) after reconstitution. Keep it refrigerated for exactly 30 minutes before the first use to allow the bacteriostatic water to activate the peptides. Always keep your peptides stored in the refrigerator to maintain its stability, purity and potency. (IMPORTANT)"
- Storage FAQ step 2 wording: "Immediately store the reconstituted peptide in the refrigerator (not the freezer) after reconstitution. Keep it refrigerated for exactly 30 minutes before the first use to allow the bacteriostatic water to activate the peptides. Never leave reconstituted peptides at room temperature for activation. Always keep your peptides stored in the refrigerator to maintain stability, purity, and potency."

${AUTHORITATIVE_PEPTIDE_KNOWLEDGE}

RULES:
- Be concise, practical, and supportive.
- Personalize ALL dosing answers from the TAILORED 90-DAY PEPTIDE PROTOCOL section — it is authoritative.
- NEVER claim to be a doctor. Remind users to consult their healthcare provider.
- If the user shares profile updates (weight, peptides, goals), call the update_profile function.
- Do not encourage unsafe dosing or illegal sourcing.

When users mention specific peptides or doses they are taking, update their profile stack accordingly.`

export interface ChatRequestBody {
  messages: { role: string; content: string }[]
  userContext?: string
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

const PROVIDER_CONFIG: Record<
  AIProvider,
  { url: string; model: string; label: string }
> = {
  xai: {
    url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-3-mini',
    label: 'xAI Grok',
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    label: 'OpenAI',
  },
}

function resolveProvider(keys: ChatApiKeys): {
  provider: AIProvider
  apiKey: string
} | null {
  const xaiKey = keys.xaiKey?.trim()
  if (xaiKey) return { provider: 'xai', apiKey: xaiKey }

  const openaiKey = keys.openaiKey?.trim()
  if (openaiKey) return { provider: 'openai', apiKey: openaiKey }

  return null
}

function formatAIError(provider: AIProvider, message?: string): string {
  if (!message) return `${PROVIDER_CONFIG[provider].label} API error`
  if (/quota|billing|insufficient|credits/i.test(message)) {
    if (provider === 'xai') {
      return (
        'Your xAI account has no available credits. Go to console.x.ai → Billing, ' +
        'add credits, then try again.'
      )
    }
    return (
      'Your OpenAI account has no available credits. Go to platform.openai.com → Settings → Billing, ' +
      'add a payment method or top up credits, then try again.'
    )
  }
  return message
}

const PROFILE_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'update_profile',
      description:
        'Update user profile fields when they share new weight, goals, or peptide stack info',
      parameters: {
        type: 'object',
        properties: {
          current_weight: { type: 'number', description: 'Current weight in lbs' },
          goal_weight: { type: 'number', description: 'Goal weight in lbs' },
          main_goal: {
            type: 'string',
            description: 'User goals, comma-separated if multiple',
          },
          interested_peptides: { type: 'string' },
          additional_info: { type: 'string' },
          gender: {
            type: 'string',
            enum: ['male', 'female', 'non_binary', 'prefer_not_to_say'],
          },
          age: { type: 'number', description: 'User age (18–50)' },
          training_activities: {
            type: 'string',
            description: 'Comma-separated training activities',
          },
          weekly_loss_target: { type: 'number' },
          peptide_stack: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                dose: { type: 'string' },
                frequency: { type: 'string', enum: ['daily', 'weekly'] },
                timing: { type: 'string' },
                notes: { type: 'string' },
              },
              required: ['name', 'dose', 'frequency'],
            },
          },
        },
      },
    },
  },
]

export async function runChat(
  body: ChatRequestBody,
  keys: ChatApiKeys = {}
): Promise<{ status: number; body: ChatResponseBody }> {
  const resolved = resolveProvider(keys)
  if (!resolved) {
    return {
      status: 503,
      body: {
        content: '',
        profileUpdates: null,
        error:
          'AI assistant not configured. Add XAI_API_KEY (console.x.ai) or OPENAI_API_KEY to .env.local / Vercel env vars (server-side only — do NOT use NEXT_PUBLIC_), then restart npm run dev.',
      },
    }
  }

  const { provider, apiKey } = resolved
  const { messages, userContext } = body

  if (!messages?.length) {
    return {
      status: 400,
      body: { content: '', profileUpdates: null, error: 'Messages required' },
    }
  }

  const systemContent = userContext
    ? `${SYSTEM_PROMPT}\n\n--- USER PROFILE ---\n${userContext}`
    : SYSTEM_PROMPT

  const config = PROVIDER_CONFIG[provider]

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'system', content: systemContent }, ...messages],
        tools: PROFILE_TOOLS,
        tool_choice: 'auto',
        max_tokens: 1200,
        temperature: 0.7,
      }),
    })

    const data = (await response.json()) as {
      error?: { message?: string }
      choices?: Array<{
        message?: {
          content?: string
          tool_calls?: Array<{
            function?: { name?: string; arguments?: string }
          }>
        }
      }>
    }

    if (!response.ok) {
      return {
        status: response.status,
        body: {
          content: '',
          profileUpdates: null,
          error: formatAIError(provider, data.error?.message),
        },
      }
    }

    const message = data.choices?.[0]?.message
    let profileUpdates: Record<string, unknown> | null = null

    if (message?.tool_calls?.length) {
      const toolCall = message.tool_calls[0]
      if (toolCall.function?.name === 'update_profile' && toolCall.function.arguments) {
        try {
          profileUpdates = JSON.parse(toolCall.function.arguments) as Record<
            string,
            unknown
          >
        } catch {
          profileUpdates = null
        }
      }
    }

    const content =
      message?.content ||
      'I updated your profile based on what you shared. Let me know if you need anything else!'

    return { status: 200, body: { content, profileUpdates } }
  } catch (err) {
    console.error(err)
    return {
      status: 500,
      body: {
        content: '',
        profileUpdates: null,
        error: 'Failed to reach AI service',
      },
    }
  }
}

