import { test, expect } from '@playwright/test'

test.describe('Responsive layout', () => {

  async function gotoAndWait(page, url = '/') {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
    // Wait for Vue to mount and render
    await page.waitForSelector('.container', { timeout: 10000 })
  }

  test('le container principal fait plus de 800px sur desktop 1920px', async ({ page }) => {
    await gotoAndWait(page)

    const containerWidth = await page.evaluate(() => {
      const el = document.querySelector('.container')
      return el?.getBoundingClientRect().width ?? 0
    })

    expect(containerWidth).toBeGreaterThan(800)
  })

  test('le carrousel Boutique fait plus de 600px sur desktop', async ({ page }) => {
    await gotoAndWait(page)

    const swiperWidth = await page.evaluate(() => {
      const el = document.querySelector('.carousel-container .my-swiper')
      return el?.getBoundingClientRect().width
    })

    if (swiperWidth !== undefined) {
      expect(swiperWidth!).toBeGreaterThan(600)
    }
  })

  test('le carrousel Galerie photos fait plus de 600px sur desktop', async ({ page }) => {
    await gotoAndWait(page)

    const swiperWidth = await page.evaluate(() => {
      const el = document.querySelector('.gallery-container .my-swiper')
      return el?.getBoundingClientRect().width
    })

    if (swiperWidth !== undefined) {
      expect(swiperWidth!).toBeGreaterThan(600)
    }
  })

  test('le header et le footer utilisent la même largeur que le container', async ({ page }) => {
    await gotoAndWait(page)

    const widths = await page.evaluate(() => {
      const container = document.querySelector('.container')
      const header = document.querySelector('.header-content')
      const footer = document.querySelector('.footer-content')
      return {
        container: container?.getBoundingClientRect().width ?? 0,
        header: header?.getBoundingClientRect().width ?? 0,
        footer: footer?.getBoundingClientRect().width ?? 0,
      }
    })

    expect(widths.container).toBeGreaterThan(800)
    expect(widths.header).toBeGreaterThan(800)
    expect(widths.footer).toBeGreaterThan(800)
  })

  test('la variable CSS --site-max-width est définie sur :root', async ({ page }) => {
    await gotoAndWait(page)

    const value = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--site-max-width')
        .trim()
    })

    expect(value).toBeTruthy()
    expect(value).not.toBe('800px')
  })

  test('sur mobile 375px le container est plus étroit que sur desktop 1920px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForSelector('.container', { timeout: 10000 })

    const mobileWidth = await page.evaluate(() => {
      const el = document.querySelector('.container')
      return el?.getBoundingClientRect().width ?? 0
    })

    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForSelector('.container', { timeout: 10000 })

    const desktopWidth = await page.evaluate(() => {
      const el = document.querySelector('.container')
      return el?.getBoundingClientRect().width ?? 0
    })

    expect(desktopWidth).toBeGreaterThan(mobileWidth)
  })
})
