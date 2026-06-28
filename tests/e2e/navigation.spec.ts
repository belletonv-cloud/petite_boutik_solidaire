import { test, expect } from '@playwright/test'

test.describe('Navigation & ancres', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.site-header', { timeout: 15000 })
    await page.waitForTimeout(2000)
  })

  test('hover desktop sur dropdown-link montre le fond teal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const burger = page.locator('.nav-burger')
    await expect(burger).toBeVisible({ timeout: 10000 })
    await burger.click()

    const dropdown = page.locator('.nav-dropdown.open')
    await expect(dropdown).toBeVisible({ timeout: 5000 })

    const firstLink = dropdown.locator('.dropdown-link').first()
    await expect(firstLink).toBeVisible()

    const bgBefore = await firstLink.evaluate(el => window.getComputedStyle(el).backgroundColor)
    console.log('BG avant hover:', bgBefore)

    await firstLink.hover()
    await page.waitForTimeout(300)

    const bgAfter = await firstLink.evaluate(el => window.getComputedStyle(el).backgroundColor)
    console.log('BG après hover:', bgAfter)

    expect(bgAfter).toBe('rgb(27, 169, 168)')
  })

  test('touchstart ajoute la classe touch-active sur mobile', async ({ page, browserName }) => {
    // Firefox desktop n'expose pas TouchEvent (events tactiles désactivés) :
    // ce comportement est couvert par les projets WebKit/Chromium/Mobile.
    test.skip(browserName === 'firefox', 'TouchEvent non disponible sur Firefox desktop')
    await page.setViewportSize({ width: 393, height: 851 })

    const burger = page.locator('.nav-burger')
    await expect(burger).toBeVisible({ timeout: 10000 })
    await burger.click()

    const dropdown = page.locator('.nav-dropdown.open')
    await expect(dropdown).toBeVisible({ timeout: 5000 })

    // Vérifier qu'aucun lien n'a touch-active avant le touch
    const hasClassBefore = await page.evaluate(() => {
      const el = document.querySelector('.dropdown-link')
      return el?.classList.contains('touch-active')
    })
    expect(hasClassBefore).toBe(false)

    // Dispatcher touchstart
    await page.evaluate(() => {
      const el = document.querySelector('.dropdown-link')
      if (el) el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true }))
    })

    // Attendre que Vue réagisse (nextTick)
    await page.waitForTimeout(100)

    // Vérifier la classe touch-active
    const hasClass = await page.evaluate(() => {
      const el = document.querySelector('.dropdown-link')
      return el?.classList.contains('touch-active')
    })
    expect(hasClass).toBe(true)

    // Vérifier la couleur de fond
    const bgDuring = await page.evaluate(() => {
      const el = document.querySelector('.dropdown-link.touch-active')
      if (!el) return 'no-element'
      return window.getComputedStyle(el).backgroundColor
    })
    console.log('BG avec touch-active:', bgDuring)
    expect(bgDuring).toBe('rgb(27, 169, 168)')

    // Dispatcher touchend → la classe doit disparaître
    await page.evaluate(() => {
      const el = document.querySelector('.dropdown-link')
      if (el) el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true }))
    })
    await page.waitForTimeout(100)

    const hasClassAfter = await page.evaluate(() => {
      const el = document.querySelector('.dropdown-link')
      return el?.classList.contains('touch-active')
    })
    expect(hasClassAfter).toBe(false)
  })

  test('clic bouton Hero défile jusqu\'à la section calendrier', async ({ page }) => {
    const hasCal = await page.evaluate(() => !!document.getElementById('calendrier'))
    const hasHor = await page.evaluate(() => !!document.getElementById('horaires'))
    console.log(`#calendrier: ${hasCal}, #horaires: ${hasHor}`)

    if (!hasCal && !hasHor) {
      test.skip('Aucune section cible')
      return
    }

    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(300)
    const scrollYBefore = await page.evaluate(() => window.scrollY)

    const heroBtn = page.locator('.cta-actions a[href="#calendrier"]')
    const btnCount = await heroBtn.count()
    test.skip(btnCount === 0, 'bouton calendrier introuvable')

    await heroBtn.first().click()
    await page.waitForTimeout(500)
    const scrollYAfter = await page.evaluate(() => window.scrollY)

    console.log(`scrollY: ${scrollYBefore} → ${scrollYAfter}`)
    expect(scrollYAfter).toBeGreaterThan(scrollYBefore)
  })
})
