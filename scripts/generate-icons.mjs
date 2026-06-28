import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const src = join(root, 'public', 'icon.svg')
const outDir = join(root, 'public', 'icons')

const sizes = [
  { name: 'icon-72.png', size: 72 },
  { name: 'icon-96.png', size: 96 },
  { name: 'icon-128.png', size: 128 },
  { name: 'icon-144.png', size: 144 },
  { name: 'icon-152.png', size: 152 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-384.png', size: 384 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'maskable-icon-512.png', size: 512, maskable: true },
]

await mkdir(outDir, { recursive: true })

for (const { name, size, maskable } of sizes) {
  let pipeline = sharp(src).resize(size, size)

  if (maskable) {
    const padding = Math.round(size * 0.1)
    const inner = size - padding * 2
    const padded = await sharp(src)
      .resize(inner, inner)
      .toBuffer()
    pipeline = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 6, g: 10, b: 18, alpha: 1 },
      },
    }).composite([{ input: padded, gravity: 'centre' }])
  }

  await pipeline.png().toFile(join(outDir, name))
  console.log(`Generated ${name}`)
}