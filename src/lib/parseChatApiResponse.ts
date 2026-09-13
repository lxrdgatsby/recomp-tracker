export async function parseChatApiResponse(
  res: Response
): Promise<{ content?: string; error?: string; profileUpdates?: unknown }> {
  const text = await res.text()

  if (!text.trim()) {
    throw new Error(
      'Assistant unavailable — check API key / network'
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
        'Assistant unavailable — check API key / network. The /api/chat route returned the app page instead of a Grok reply.'
      )
    }
    throw new Error(
      `Assistant unavailable — check API key / network (HTTP ${res.status}).`
    )
  }

  if (!res.ok) {
    throw new Error(
      data.error ?? 'Assistant unavailable — check API key / network'
    )
  }

  if (!(data.content ?? data.reply)?.trim()) {
    throw new Error('Assistant unavailable — check API key / network')
  }

  return {
    ...data,
    content: data.content ?? data.reply,
  }
}