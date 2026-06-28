export async function askAssistant(
  question: string,
  userContext: string,
  faqGuidance?: string
): Promise<string> {
  const guidanceBlock = faqGuidance
    ? `\n\n=== FAQ AUTHORITATIVE GUIDANCE (MUST FOLLOW EXACTLY) ===\n${faqGuidance}\n=== END GUIDANCE ===`
    : ''

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: `Answer this FAQ question clearly and educationally for a peptide user: ${question}${guidanceBlock}`,
        },
      ],
      userContext,
    }),
  })

  const text = await res.text()
  if (!text.trim()) {
    throw new Error(
      'AI assistant is unavailable. Add OPENAI_API_KEY to .env.local (local) or Vercel → Settings → Environment Variables (production), then restart and try again.'
    )
  }

  let data: { content?: string; error?: string }
  try {
    data = JSON.parse(text) as { content?: string; error?: string }
  } catch {
    throw new Error(
      'AI assistant returned an invalid response. Refresh the page and try again.'
    )
  }

  if (!res.ok) {
    throw new Error(data.error ?? 'AI request failed')
  }

  return data.content ?? 'No response from assistant.'
}