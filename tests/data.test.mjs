import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { site, highlights, media, quickLinks } from '../src/data/site.js'

test('official ordering destinations and phone are preserved', () => {
  assert.equal(site.links.menu, 'https://burdegamix.pedizap.com.br/')
  assert.equal(new URL(site.links.whatsapp).pathname, '/5588998047212')
  assert.equal(site.phone, '5588998047212')
  assert.equal(site.links.instagram, 'https://www.instagram.com/burdegahamburgueria/')
  for (const link of Object.values(site.links)) assert.equal(new URL(link).protocol, 'https:')
})
test('all quick links resolve and products have their own photos', () => {
  assert.equal(quickLinks.length, 4)
  assert.equal(new Set(highlights.map(item => item.id)).size, highlights.length)
  for (const link of quickLinks) assert.ok(site.links[link.id])
  for (const product of highlights) { assert.ok(media[product.image]); assert.ok(product.name); assert.equal(product.price, undefined) }
})
test('business location and conflict-safe hours', () => {
  assert.equal(site.since, 2013)
  assert.equal(site.city, 'Várzea Alegre')
  assert.match(decodeURIComponent(site.links.maps), /Padre José Alves/)
  assert.equal(site.openNow, undefined)
  assert.match(site.hoursMessage, /Consulte/)
})
test('upstream credit and no-JavaScript access remain present', async () => {
  const license = await readFile(new URL('../LICENSE', import.meta.url), 'utf8')
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  assert.match(license, /Copyright \(c\) 2026 Mindset & Code/)
  assert.match(html, /<noscript>/)
  assert.match(html, /lang="pt-BR"/)
})
