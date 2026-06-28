import type { VercelRequest, VercelResponse } from '@vercel/node'

const SYSTEM_PROMPT = `You are an expert peptide and body recomposition coach built into Peptide Tracker.

You educate users on peptides including Retatrutide, Tesamorelin, AOD9604, BPC-157, dosing schedules, reconstitution basics, injection technique, stacking, side effects, and training/nutrition for recomp.

RULES:
- Be concise, practical, and supportive.
- Personalize advice using the user's profile when provided.
- NEVER claim to be a doctor. Always remind users to consult their healthcare provider for medical decisions.
- If the user shares profile updates (weight, peptides, goals), call the update_profile function.
- Do not encourage unsafe dosing or illegal sourcing.

When users mention specific peptides or doses they are taking, update their profile stack accordingly.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(503).json({
      error: 'AI assistant not configured. Add OPENAI_API_KEY to Vercel environment variables.',
    })
  }

  const { messages, userContext } = req.body as {
    messages: { role: string; content: string }[]
    userContext?: string
  }

  if (!messages?.length) {
    return res.status(400).json({ error: 'Messages required' })
  }

  const tools = [
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
            main_goal: { type: 'string' },
            interested_peptides: { type: 'string' },
            additional_info: { type: 'string' },
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

  const systemContent = userContext
    ? `${SYSTEM_PROMPT}\n\n--- USER PROFILE ---\n${userContext}`
    : SYSTEM_PROMPT

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemContent }, ...messages],
        tools,
        tool_choice: 'auto',
        max_tokens: 1200,
        temperature: 0.7,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message ?? 'OpenAI API error',
      })
    }

    const choice = data.choices?.[0]
    const message = choice?.message

    let profileUpdates = null
    if (message?.tool_calls?.length) {
      const toolCall = message.tool_calls[0]
      if (toolCall.function?.name === 'update_profile') {
        try {
          profileUpdates = JSON.parse(toolCall.function.arguments)
        } catch {
          /* ignore parse errors */
        }
      }
    }

    const content =
      message?.content ||
      'I updated your profile based on what you shared. Let me know if you need anything else!'

    return res.status(200).json({ content, profileUpdates })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to reach AI service' })
  }
}