import type { VercelRequest, VercelResponse } from '@vercel/node'
import { runChat, type ChatRequestBody } from './chatHandler.ts'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const result = await runChat(req.body as ChatRequestBody, process.env.OPENAI_API_KEY)

  if (result.body.error) {
    return res.status(result.status).json({ error: result.body.error })
  }

  return res.status(result.status).json({
    content: result.body.content,
    profileUpdates: result.body.profileUpdates,
  })
}