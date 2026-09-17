import { test, expect } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

for (const width of [320, 390, 768, 1440]) {
  test(`layout, real images and links at ${width}px`, async ({ page }) => {
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize({ width, height: width < 640 ? 844 : 1000 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const hero = page.locator('.hero-photo-frame img')
    await expect(hero).toHaveAttribute('data-image-state', 'photo')
    await expect.poll(() => hero.evaluate(img => img.complete && img.naturalWidth > 0)).toBeTruthy()
    await expect(page.locator('.quick-card')).toHaveCount(4)
    await expect(page.locator('.quick-menu')).toHaveAttribute('href', 'https://burdegamix.pedizap.com.br/')
    await expect(page.locator('.quick-whatsapp')).toHaveAttribute('href', /5588998047212/)
    await expect(page.locator('.quick-maps')).toHaveAttribute('href', /google\.com\/maps/)
    await expect(page.locator('.quick-instagram')).toHaveAttribute('href', /burdegahamburgueria/)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy()
    for (const target of ['#sabores', '#burdega', '#encontre']) { await page.locator(target).scrollIntoViewIfNeeded(); await expect(page.locator(target)).toBeVisible() }
    for (const img of await page.locator('.product-photo img').all()) await expect.poll(() => img.evaluate(element => element.complete && element.naturalWidth > 0)).toBeTruthy()
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.evaluate(() => document.fonts.ready)
    await mkdir('test-results/previews', { recursive: true })
    await page.screenshot({ path: `test-results/previews/burdega-${width}.png`, fullPage: true, animations: 'disabled' })
    expect(errors).toEqual([])
  })
}

test('mobile navigation, hours and sharing', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  const toggle = page.getByRole('button', { name: 'Abrir navegação' })
  await toggle.click()
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Abrir navegação' })).toBeFocused()
  await page.getByRole('button', { name: 'Abrir navegação' }).click()
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByText('Onde estamos').click()
  await expect(page.getByRole('button', { name: 'Abrir navegação' })).toHaveAttribute('aria-expanded', 'false')
  await page.locator('summary').click()
  await expect(page.locator('.hours')).toHaveAttribute('open', '')
  await expect(page.locator('.hours')).toContainText('Consulte os horários')
  await page.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true, value: undefined }))
  await page.getByRole('button', { name: 'Compartilhar' }).click()
  await expect(page.getByRole('status')).toContainText('Link copiado')
})

test('3D loads only on demand and responds to accessible controls', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await expect(page.locator('canvas')).toHaveCount(0)
  await page.getByRole('button', { name: 'Explorar em 3D' }).click()
  await expect(page.locator('.scene-wrap canvas')).toBeVisible({ timeout: 20000 })
  await page.getByRole('button', { name: 'Separar camadas' }).click()
  await expect(page.getByRole('button', { name: 'Juntar camadas' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Girar hambúrguer para a direita' }).click()
  await page.screenshot({ path: 'test-results/previews/burdega-3d.png', animations: 'disabled' })
  await page.getByRole('button', { name: 'Foto real' }).click()
  await expect(page.locator('canvas')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('order links remain available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173/')
  await expect(page.getByRole('link', { name: 'Abrir cardápio e fazer pedido' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Falar pelo WhatsApp' })).toBeVisible()
  await context.close()
})
