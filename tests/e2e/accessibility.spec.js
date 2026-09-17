import { test, expect } from '@playwright/test'

test('sticky navigation remains reachable on desktop and mobile', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await page.locator('#encontre').scrollIntoViewIfNeeded()
    await expect.poll(async () => Math.abs((await page.locator('.header').boundingBox()).y)).toBeLessThan(1)
    if (width === 390) {
      await page.getByRole('button', { name: 'Abrir navegação' }).click()
      await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
    }
  }
})

test('missing photos fall back without hiding ordering links', async ({ page }) => {
  await page.route('**/media/*.webp', route => route.abort())
  await page.route('https://cdn.nsite.com.br/**', route => route.abort())
  await page.route('https://ugc.production.linktr.ee/**', route => route.abort())
  await page.goto('/')
  const hero = page.locator('.hero-photo-frame img')
  await expect(hero).toHaveAttribute('data-image-state', 'fallback')
  await expect.poll(() => hero.evaluate(img => img.complete && img.naturalWidth > 0)).toBeTruthy()
  await expect(page.locator('.quick-menu')).toBeVisible()
  await expect(page.locator('.quick-menu')).toHaveAttribute('href', 'https://burdegamix.pedizap.com.br/')
})

test('keyboard skip link and pause control remain usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
  await page.keyboard.press('Enter')
  const pause = page.getByRole('button', { name: 'Pausar animações' })
  if (await pause.count()) await pause.click()
  await expect(page.locator('.site')).toHaveClass(/motion-paused/)
  await expect(page.locator('.delivery-card')).toHaveCSS('opacity', '1')
})
