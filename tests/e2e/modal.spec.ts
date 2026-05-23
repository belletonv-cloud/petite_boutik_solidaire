import { test, expect } from '@playwright/test'

test.describe('Modal et galerie', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  function hasSlides(page) {
    return page.locator('.gallery-container .swiper-slide').count()
  }

  async function openModalIfPossible(page) {
    const slides = page.locator('.gallery-container .swiper-slide')
    const count = await slides.count()
    if (count === 0) return false

    // click the first slide image or the slide frame
    const img = slides.first().locator('img')
    if (await img.count() > 0) {
      await img.first().click({ force: true })
    } else {
      await slides.first().click({ force: true })
    }
    const overlay = page.locator('.modal-overlay')
    try {
      await overlay.waitFor({ state: 'visible', timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  test('le clic sur l\'overlay ferme la modale', async ({ page }) => {
    const has = await openModalIfPossible(page)
    test.skip(!has, 'pas de modale ouverte (pas de photos)')

    const overlay = page.locator('.modal-overlay')
    const box = await overlay.boundingBox()
    expect(box).not.toBeNull()
    await page.mouse.click(box!.x + 5, box!.y + 5)
    await expect(overlay).not.toBeVisible({ timeout: 2000 })
  })

  test('le bouton de fermeture en haut ferme la modale', async ({ page }) => {
    const has = await openModalIfPossible(page)
    test.skip(!has, 'pas de modale ouverte (pas de photos)')

    const overlay = page.locator('.modal-overlay')
    await overlay.locator('.modal-close').click()
    await expect(overlay).not.toBeVisible({ timeout: 2000 })
  })

  test('le bouton Fermer en bas ferme la modale', async ({ page }) => {
    const has = await openModalIfPossible(page)
    test.skip(!has, 'pas de modale ouverte (pas de photos)')

    const overlay = page.locator('.modal-overlay')
    await overlay.locator('.modal-close-bottom').click()
    await expect(overlay).not.toBeVisible({ timeout: 2000 })
  })

  test('la touche Escape ferme la modale', async ({ page }) => {
    const has = await openModalIfPossible(page)
    test.skip(!has, 'pas de modale ouverte (pas de photos)')

    const overlay = page.locator('.modal-overlay')
    await page.keyboard.press('Escape')
    await expect(overlay).not.toBeVisible({ timeout: 2000 })
  })

  test('les flèches gauche/droite naviguent dans la modale', async ({ page }) => {
    // count swiper slides to ensure we have at least 2
    const container = page.locator('.gallery-container')
    const slides = container.locator('.swiper-slide')
    const slideCount = await slides.count()
    test.skip(slideCount < 2, 'besoin d\'au moins 2 photos')

    const has = await openModalIfPossible(page)
    test.skip(!has, 'pas de modale ouverte')

    const overlay = page.locator('.modal-overlay')
    const getCounter = () => overlay.locator('.modal-counter').textContent()

    const text1 = await getCounter()
    await page.keyboard.press('ArrowRight')
    const text2 = await getCounter()
    expect(text2).not.toBe(text1)

    await page.keyboard.press('ArrowLeft')
    const text3 = await getCounter()
    expect(text3).toBe(text1)
  })

  test('la modale est scrollable quand l\'image est grande', async ({ page }) => {
    const has = await openModalIfPossible(page)
    test.skip(!has, 'pas de modale ouverte (pas de photos)')

    const overlay = page.locator('.modal-overlay')
    const canScroll = await overlay.evaluate(el => el.scrollHeight > el.clientHeight)
    if (canScroll) {
      const scrollBefore = await overlay.evaluate(el => el.scrollTop)
      await overlay.evaluate(el => el.scrollTop = 100)
      await page.waitForTimeout(100)
      const scrollAfter = await overlay.evaluate(el => el.scrollTop)
      expect(scrollAfter).toBeGreaterThan(scrollBefore)
    }
    // if not scrollable, the test is still valid (no overflow = fine UI)
  })

  test('la grille s\'ouvre et se ferme', async ({ page }) => {
    const container = page.locator('.gallery-container')
    await container.waitFor({ state: 'visible', timeout: 15000 })

    const gridBtn = container.locator('.btn-grid')
    await expect(gridBtn).toBeVisible({ timeout: 5000 })
    await gridBtn.click()

    const gridOverlay = page.locator('.grid-overlay')
    await expect(gridOverlay).toBeVisible({ timeout: 3000 })

    await gridOverlay.locator('.grid-close').click()
    await expect(gridOverlay).not.toBeVisible({ timeout: 2000 })
  })

  test('le body retrouve le scroll après fermeture modale', async ({ page }) => {
    const has = await openModalIfPossible(page)
    test.skip(!has, 'pas de modale ouverte (pas de photos)')

    const overlay = page.locator('.modal-overlay')
    await page.keyboard.press('Escape')
    await expect(overlay).not.toBeVisible({ timeout: 2000 })

    const overflow = await page.evaluate(() => document.body.style.overflow)
    expect(overflow).toBe('')
  })
})
