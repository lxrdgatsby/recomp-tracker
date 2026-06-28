import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { loadEnv } from 'vite'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    req.on('error', reject)
  })
}

export function devApiPlugin(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/chat')) return next()

        if (req.method !== 'POST') {
          writeJson(res, 405, { error: 'Method not allowed' })
          return
        }

        try {
          const env = loadEnv(
            server.config.mode,
            server.config.envDir ?? process.cwd(),
            ''
          )
          const raw = await readBody(req)
          const body = raw ? JSON.parse(raw) : {}
          const { runChat } = await import('./api/chatHandler.ts')
          const result = await runChat(body, {
            openaiKey: env.OPENAI_API_KEY?.trim(),
            xaiKey: env.XAI_API_KEY?.trim(),
          })

          if (result.body.error) {
            writeJson(res, result.status, { error: result.body.error })
            return
          }

          writeJson(res, result.status, {
            content: result.body.content,
            reply: result.body.content,
            profileUpdates: result.body.profileUpdates,
          })
        } catch (err) {
          console.error('[dev-api]', err)
          writeJson(res, 500, { error: 'Dev API error' })
        }
      })
    },
  }
}

function writeJson(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}