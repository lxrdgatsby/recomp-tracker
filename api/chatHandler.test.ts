import { describe, expect, it } from 'vitest'
import { ASSISTANT_UNAVAILABLE, runChat } from './chatHandler'

describe('runChat', () => {
  it('fails visibly when no API key is configured', async () => {
    const result = await runChat({
      messages: [{ role: 'user', content: 'what do I take tonight?' }],
      userContext: '{"hasPlan":false}',
      protocolWeek: 3,
      lastUserMessage: 'what do I take tonight?',
    })
    expect(result.status).toBe(503)
    expect(result.body.content).toBe('')
    expect(result.body.error).toMatch(/Assistant unavailable/)
    expect(result.body.error).toMatch(/XAI_API_KEY|VITE_XAI_API_KEY/)
  })

  it('requires messages', async () => {
    const result = await runChat(
      { messages: [] },
      { xaiKey: 'test-key' }
    )
    expect(result.status).toBe(400)
  })

  it('exports the unavailable copy', () => {
    expect(ASSISTANT_UNAVAILABLE).toBe(
      'Assistant unavailable — check API key / network'
    )
  })
})
