import { test, expect } from '@playwright/test'

test.describe('Viewport et zoom', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('la meta viewport contient viewport-fit=cover et maximum-scale sur mobile', async ({ page }) => {
    const content = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]')
      return meta?.getAttribute('content') || ''
    })
    expect(content).toContain('viewport-fit=cover')
    // On desktop (headless) isTouch is false → pas de maximum-scale ajouté
    const isTouch = await page.evaluate(() =>
      ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0
    )
    if (isTouch) {
      expect(content).toContain('maximum-scale=1.0')
    }
  })

  test('la variable CSS --vh est définie sur <html>', async ({ page }) => {
    const vh = await page.evaluate(() => {
      return document.documentElement.style.getPropertyValue('--vh')
    })
    expect(vh).toMatch(/^\d+px$/)
  })

  test('touch-action: manipulation est appliqué sur html', async ({ page }) => {
    const touchAction = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).touchAction
    })
    expect(touchAction).toBe('manipulation')
  })

  test('--vh se met à jour au resize', async ({ page }) => {
    const vhBefore = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--vh')
    )

    await page.setViewportSize({ width: 375, height: 800 })
    await page.waitForTimeout(200)

    const vhAfter = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--vh')
    )
    expect(vhAfter).toMatch(/^\d+px$/)
    expect(vhAfter).not.toBe(vhBefore)
  })
})
