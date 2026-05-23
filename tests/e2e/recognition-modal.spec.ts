import { test, expect } from '@playwright/test'

test.describe('Recognition modal (accessibility)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('opens modal, image loads, body locked, focus in modal and restored on close', async ({ page }) => {
    // wait for badges
    await page.waitForSelector('.badges .badge', { timeout: 10000 })
    const first = page.locator('.badges .badge').first()
    await expect(first).toBeVisible()

    // capture the index attribute (should exist)
    const index = await first.getAttribute('data-recognition-index')

    // click to open modal
    await first.click()

    // wait for overlay/modal to appear
    const overlay = page.locator('.app-modal-overlay')
    await expect(overlay).toBeVisible({ timeout: 5000 })

    // wait for image inside modal to be present and loaded
    const img = page.locator('.app-modal-content img, .trust-modal-img').first()
    await expect(img).toBeVisible({ timeout: 5000 })
    // ensure naturalWidth > 0
    await page.waitForFunction((sel) => {
      const el = document.querySelector(sel) as HTMLImageElement | null
      return !!el && el.naturalWidth > 0
    }, {}, '.app-modal-content img, .trust-modal-img')

    // body overflow should be hidden
    const overflow = await page.evaluate(() => document.body.style.overflow)
    expect(overflow).toBe('hidden')

    // focus should be inside the modal content
    const focusInModal = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null
      const content = document.querySelector('.app-modal-content')
      return !!content && !!active && content.contains(active)
    })
    expect(focusInModal).toBeTruthy()

    // close the modal via close button
    const closeBtn = page.locator('.app-modal-close')
    await expect(closeBtn).toBeVisible()
    await closeBtn.click()

    // wait for overlay to be removed
    await page.waitForSelector('.app-modal-overlay', { state: 'detached', timeout: 5000 })

    // now activeElement should be the badge we clicked (or contained within it)
    const activeBadgeIndex = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null
      if (!active) return null
      const badge = active.closest ? active.closest('.badge') : null
      return badge ? badge.getAttribute('data-recognition-index') : null
    })
    // if we captured an index earlier, assert equality
    if (index !== null) expect(activeBadgeIndex).toBe(index)
  })
})
