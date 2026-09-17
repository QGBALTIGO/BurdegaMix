import { mkdir, access, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { media } from '../src/data/site.js'

const directory = new URL('../public/media/', import.meta.url)
await mkdir(directory, { recursive: true })
for (const [key, asset] of Object.entries(media)) {
  const output = new URL(asset.file, directory)
  try { await access(output); console.log(`Cached: ${asset.file}`); continue } catch { /* First build */ }
  try {
    const response = await fetch(asset.remote, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'BurdegaMix-Website/1.0' } })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    if (!response.headers.get('content-type')?.startsWith('image/')) throw new Error('Expected an image')
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length > 15 * 1024 * 1024) throw new Error('Image exceeds the 15 MB limit')
    await sharp(bytes).rotate().resize({ width: key === 'logo' ? 400 : 1200, withoutEnlargement: true }).webp({ quality: 86 }).toFile(fileURLToPath(output))
    console.log(`Saved official image: ${asset.file}`)
  } catch (error) {
    // Frontend retries the official URL, then renders the bundled graphic.
    console.warn(`Could not cache ${asset.file}: ${error.message}. Remote/local fallback remains available.`)
  }
}
await writeFile(new URL('README.md', directory), '# Brand media\n\nImages from the official Burdega Linktree and Pedizap menu. Rights remain with their respective holders. These assets are not relicensed under the code MIT license. See SOURCES.md.\n')
