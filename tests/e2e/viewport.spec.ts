import { test, expect } from '@playwright/test'

test.describe('Viewport et zoom', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('la meta viewport contient maximum-scale et viewport-fit', async ({ page }) => {
    const content = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]')
      return meta?.getAttribute('content') || ''
    })
    expect(content).toContain('maximum-scale=5.0')
    expect(content).toContain('viewport-fit=cover')
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
