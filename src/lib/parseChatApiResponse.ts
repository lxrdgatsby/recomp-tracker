export async function parseChatApiResponse(
  res: Response
): Promise<{ content?: string; error?: string; profileUpdates?: unknown }> {
  const text = await res.text()

  if (!text.trim()) {
    throw new Error(
      res.status === 404
        ? 'AI API route not found. On Vercel, add OPENAI_API_KEY under Settings → Environment Variables, then redeploy.'
        : 'AI assistant is unavailable. Add OPENAI_API_KEY to .env.local (local) or Vercel env vars (production), then restart and try again.'
    )
  }

  const looksLikeHtml = /^\s*</i.test(text)

  let data: {
    content?: string
    reply?: string
    error?: string
    profileUpdates?: unknown
  }
  try {
    data = JSON.parse(text) as {
      content?: string
      reply?: string
      error?: string
      profileUpdates?: unknown
    }
  } catch {
    if (looksLikeHtml) {
      throw new Error(
        'AI API returned the app page instead of a response. On Vercel, set OPENAI_API_KEY and redeploy. Locally, use npm run dev (not npm run preview).'
      )
    }
    throw new Error(
      `AI assistant returned an invalid response (HTTP ${res.status}). Check OPENAI_API_KEY on Vercel and redeploy.`
    )
  }

  if (!res.ok) {
    throw new Error(data.error ?? `AI request failed (${res.status})`)
  }

  return {
    ...data,
    content: data.content ?? data.reply,
  }
}