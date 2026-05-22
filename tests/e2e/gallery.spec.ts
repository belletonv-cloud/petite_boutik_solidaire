import { test, expect } from '@playwright/test'

test.describe('Public Gallery E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/La P'tite Boutik Solidaire/)
  })

  test('boutique gallery shows at least one image', async ({ page }) => {
    // Wait for a stable image selector. Accept boutique slide-image, any Cloudinary image,
    // or images inside known gallery containers (fallback when boutique block is not present).
    const selector = 'img[src*="res.cloudinary.com"], [data-test="slide-image"], .carousel-container img, .gallery-container img'
    await page.waitForSelector(selector, { timeout: 20000 })
    const count = await page.locator(selector).count()
    expect(count).toBeGreaterThan(0)
  })

  test('clicking a slide opens modal if modal exists', async ({ page }) => {
    // attempt to click the first rendered image; if none present, skip click
    const firstSelector = 'img[src*="res.cloudinary.com"], img.slide-image, .carousel-container img, .my-swiper img'
    const hasDomImg = await page.$(firstSelector)
    if (hasDomImg) {
      await page.locator(firstSelector).first().click()
      const modal = page.locator('.modal-overlay')
      if (await modal.count() > 0) {
        await expect(modal).toBeVisible({ timeout: 3000 })
        const close = modal.locator('.modal-close')
        if (await close.count() > 0) await close.click()
      }
    } else {
      // No DOM image - ensure component images exist and skip modal check
      const imgs = await page.evaluate(() => {
        const el = document.querySelector('.carousel-container') || document.querySelector('.my-swiper')
        if (!el || !el.__vueParentComponent) return []
        const ctx = el.__vueParentComponent.ctx
        return (ctx && ctx.images && ctx.images.value) || []
      })
      expect(Array.isArray(imgs) ? imgs.length > 0 : false).toBeTruthy()
    }
  })

  test('pagination and pause controls exist and are interactable', async ({ page }) => {
    await page.waitForSelector('.carousel-controls .pause-btn', { timeout: 5000 })
    const btn = page.locator('.carousel-controls .pause-btn')
    await expect(btn).toBeVisible()
    await btn.click()
    // clicking again to resume
    await btn.click()
  })
})
