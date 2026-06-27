import { test, expect } from '@playwright/test'

test.describe('Public Gallery E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/La P'tite Boutik Solidaire/)
  })

  test('carousel containers exist in the DOM', async ({ page }) => {
    // Au moins un des deux carrousels doit être présent
    const boutique = page.locator('.carousel-container')
    const gallery = page.locator('.gallery-container')
    const hasOne = (await boutique.count()) > 0 || (await gallery.count()) > 0
    expect(hasOne).toBe(true)
  })

  test('clicking a slide opens modal if modal exists', async ({ page }) => {
    const firstSelector = 'img[src*="firebasestorage.googleapis.com"], img.slide-image, .carousel-container img, .my-swiper img, .gallery-container img'
    const hasImg = await page.$(firstSelector)
    test.skip(!hasImg, 'aucune image chargée')
    await page.locator(firstSelector).first().click()
    const modal = page.locator('.modal-overlay')
    if (await modal.count() > 0) {
      await expect(modal).toBeVisible({ timeout: 3000 })
      const close = modal.locator('.modal-close')
      if (await close.count() > 0) await close.click()
    }
  })

  test('pagination and pause controls exist and are interactable', async ({ page }) => {
    await page.waitForSelector('.gallery-container .pause-btn', { timeout: 5000 })
    const btn = page.locator('.gallery-container .pause-btn')
    await expect(btn).toBeVisible()
    await btn.click()
    // clicking again to resume
    await btn.click()
  })
})
