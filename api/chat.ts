import type { VercelRequest, VercelResponse } from '@vercel/node'
import { runChat, type ChatRequestBody } from './chatHandler.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const result = await runChat(req.body as ChatRequestBody, {
    openaiKey: process.env.OPENAI_API_KEY,
    xaiKey: process.env.XAI_API_KEY,
  })

  if (result.body.error) {
    return res.status(result.status).json({ error: result.body.error })
  }

  // `reply` mirrors common Next.js route shape; `content` is the canonical field
  return res.status(result.status).json({
    content: result.body.content,
    reply: result.body.content,
    profileUpdates: result.body.profileUpdates,
  })
}