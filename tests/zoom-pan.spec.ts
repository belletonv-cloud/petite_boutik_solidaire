import { test, expect } from '@playwright/test'
import { spawn } from 'child_process'

// Start vite dev server before tests and stop after
let server = null
const startServer = async () => {
  return new Promise<void>((resolve, reject) => {
    server = spawn('npm', ['run', 'dev'], { stdio: ['ignore', 'pipe', 'pipe'], env: process.env })
    let resolved = false
    server.stdout.on('data', (d) => {
      const s = d.toString()
      // vite prints a local: http://localhost:5173 message
      if (!resolved && /Local:/i.test(s)) {
        resolved = true
        resolve()
      }
    })
    server.stderr.on('data', (d) => {
      // still allow server to come up; print for debugging
      console.error('vite:', d.toString())
    })
    server.on('error', (err) => { if (!resolved) reject(err) })
    // fallback: timeout
    setTimeout(() => { if (!resolved) { resolved = true; resolve() } }, 15000)
  })
}

const stopServer = async () => {
  if (server) {
    try { server.kill() } catch (e) {}
    server = null
  }
}

test.beforeAll(async () => {
  await startServer()
})

test.afterAll(async () => {
  await stopServer()
})

function parseDebug(line: string) {
  // expected format produced by the console logger or overlay
  // try to extract numbers by keys
  const out: any = {}
  const mZoom = line.match(/zoom=([\d\.]+)/)
  if (mZoom) out.zoom = Number(mZoom[1])
  const mWrap = line.match(/wrap=(\d+)x(\d+)/)
  if (mWrap) { out.wrapW = Number(mWrap[1]); out.wrapH = Number(mWrap[2]) }
  const mBase = line.match(/base=(\d+)x(\d+)/)
  if (mBase) { out.baseW = Number(mBase[1]); out.baseH = Number(mBase[2]) }
  const mScaled = line.match(/scaled=(\d+)x(\d+)/)
  if (mScaled) { out.scaledW = Number(mScaled[1]); out.scaledH = Number(mScaled[2]) }
  const mHalf = line.match(/half=(\d+)x(\d+)/)
  if (mHalf) { out.halfX = Number(mHalf[1]); out.halfY = Number(mHalf[2]) }
  const mTrans = line.match(/transform=([\d\.-]+)x([\d\.-]+)/)
  if (mTrans) { out.transformX = Number(mTrans[1]); out.transformY = Number(mTrans[2]) }
  return out
}

test('zoom & pan bounds check', async ({ page }) => {
  await page.goto('http://localhost:5173')
  // open first image
  await page.locator('.slide-frame').first().click()
  // wait for modal and debug overlay
  const dbg = page.locator('div', { hasText: 'DEBUG' })
  await expect(dbg).toBeVisible({ timeout: 5000 })

  // helper to read overlay text lines
  const readOverlay = async () => {
    const el = await dbg.elementHandle()
    const text = await el?.innerText()
    const lines = (text || '').split('\n').map(l => l.trim()).filter(Boolean)
    // try parse from overlay first
    const joined = lines.join(' ')
    return parseDebug(joined)
  }

  // 1) At open
  const atOpen = await readOverlay()
  console.log('OPEN:', atOpen)

  // 2) After zoom (click zoom in twice)
  const zoomBtn = page.locator('button[aria-label="Zoomer"]').first()
  await zoomBtn.click()
  await page.waitForTimeout(300)
  await zoomBtn.click()
  await page.waitForTimeout(600)
  const afterZoom = await readOverlay()
  console.log('AFTER_ZOOM:', afterZoom)

  // 3) Pan full left then full right
  const img = page.locator('.modal-image')
  const box = await img.boundingBox()
  if (!box) throw new Error('modal image bounding box not found')
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2

  // drag far left
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx - 600, cy, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(400)
  const afterLeft = await readOverlay()
  console.log('LEFT:', afterLeft)

  // drag far right
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx + 600, cy, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(400)
  const afterRight = await readOverlay()
  console.log('RIGHT:', afterRight)

  // Print compact lines for quick copy
  console.log(`RESULT_OPEN zoom=${atOpen.zoom} transform=${atOpen.transformX}x${atOpen.transformY}`)
  console.log(`RESULT_AFTER zoom=${afterZoom.zoom} wrap=${afterZoom.wrapW}x${afterZoom.wrapH} base=${afterZoom.baseW}x${afterZoom.baseH} scaled=${afterZoom.scaledW}x${afterZoom.scaledH} half=${afterZoom.halfX}x${afterZoom.halfY} transform=${afterZoom.transformX}x${afterZoom.transformY}`)
  console.log(`RESULT_LEFT transformX=${afterLeft.transformX} halfX=${afterLeft.halfX}`)
  console.log(`RESULT_RIGHT transformX=${afterRight.transformX} halfX=${afterRight.halfX}`)
})
