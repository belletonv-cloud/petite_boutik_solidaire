import { test, expect } from '@playwright/test'

test.describe('Préchargement images', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('la première image du carrousel a fetchpriority="high"', async ({ page }) => {
    const container = page.locator('.gallery-container')
    await container.waitFor({ state: 'visible', timeout: 15000 })

    const slideImgs = container.locator('.swiper-slide img')
    const count = await slideImgs.count()
    test.skip(count === 0, 'aucune image dans le carrousel')

    const firstUrl = await slideImgs.first().getAttribute('src')
    test.skip(!firstUrl || firstUrl === '', 'première image sans src')

    const fp = await slideImgs.first().getAttribute('fetchpriority')
    expect(fp).toBe('high')
  })

  test('les images dans les slides sont en lazy-load', async ({ page }) => {
    const container = page.locator('.gallery-container')
    await container.waitFor({ state: 'visible', timeout: 15000 })

    const imgs = container.locator('.swiper-slide img')
    const count = await imgs.count()
    // skip if no slides (e.g. no Firebase data in test env)
    test.skip(count < 2, 'pas assez de slides pour tester le lazy-load')

    for (let i = 1; i < Math.min(count, 3); i++) {
      const loading = await imgs.nth(i).getAttribute('loading')
      expect(loading).toBe('lazy')
    }
  })

  test('les images de la grille ont loading="lazy" et width/height', async ({ page }) => {
    const container = page.locator('.gallery-container')
    await container.waitFor({ state: 'visible', timeout: 15000 })

    const gridBtn = container.locator('.btn-grid')
    await gridBtn.click()

    const gridOverlay = page.locator('.grid-overlay')
    await expect(gridOverlay).toBeVisible({ timeout: 3000 })

    const gridImgs = gridOverlay.locator('.grid-item img')
    const count = await gridImgs.count()
    test.skip(count === 0, 'aucune image dans la grille')

    for (let i = 0; i < Math.min(count, 3); i++) {
      const img = gridImgs.nth(i)
      expect(await img.getAttribute('loading')).toBe('lazy')
      expect(await img.getAttribute('width')).toBe('320')
      expect(await img.getAttribute('height')).toBe('240')
    }
  })
})
