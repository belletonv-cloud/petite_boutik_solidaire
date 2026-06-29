<template>
  <div class="eraser-modal-overlay" @click.self="$emit('cancel')">
    <div class="eraser-modal">
      <div class="eraser-header">
        <span class="eraser-title">✂️ Retouche manuelle</span>
        <button class="eraser-close" @click="$emit('cancel')">✕</button>
      </div>

      <div class="eraser-canvas-wrap" ref="wrapEl"
        @mouseleave="showCursor = false"
        @mouseenter="showCursor = true"
      >
        <!-- image éditée -->
        <canvas ref="canvas" class="eraser-canvas"
          @mousedown="onDown" @mousemove="onMove" @mouseup="onUp" @mouseleave="onUp"
          @touchstart.prevent="onTouchStart" @touchmove.prevent="onTouchMove" @touchend="onUp"
        />
        <!-- overlay lasso (au-dessus) -->
        <canvas ref="overlay" class="eraser-canvas eraser-overlay"
          v-show="mode === 'lasso'"
          @mousedown="onDown" @mousemove="onMove" @mouseup="onUp" @mouseleave="onUp"
          @touchstart.prevent="onTouchStart" @touchmove.prevent="onTouchMove" @touchend="onUp"
        />
        <!-- curseur visuel -->
        <div v-show="showCursor && ready && mode !== 'lasso'" class="brush-cursor" :class="mode"
          :style="{ left: cursorX+'px', top: cursorY+'px', width: dispBrush+'px', height: dispBrush+'px' }"
        />
        <div v-if="mode === 'lasso' && lassoHint" class="lasso-hint">Relâchez pour découper</div>
        <div v-if="!ready" class="eraser-loading">Chargement…</div>
      </div>

      <div class="eraser-toolbar">
        <div class="tool-col">
          <div class="tool-label">Outil</div>
          <div class="tool-row">
            <button v-for="m in MODES" :key="m.id"
              :class="['mode-btn', 'mode-'+m.id, mode===m.id ? 'active' : '']"
              @click="mode = m.id" :title="m.tip"
            >{{ m.icon }} {{ m.label }}</button>
          </div>
        </div>

        <div class="tool-col" v-show="mode !== 'lasso'">
          <div class="tool-label">Taille <b>{{ brushSize }}px</b></div>
          <input type="range" v-model.number="brushSize" min="4" max="100" class="tool-range" />
        </div>

        <div class="tool-col" v-show="mode === 'magic'">
          <div class="tool-label">Tolérance <b>{{ tolerance }}</b></div>
          <input type="range" v-model.number="tolerance" min="5" max="120" class="tool-range" />
        </div>

        <div class="tool-col tool-col-actions">
          <div class="tool-row">
            <button class="action-btn" @click="undo" :disabled="!canUndo">↩ Défaire</button>
            <button class="action-btn" @click="reset">🔃 Réinitialiser</button>
          </div>
          <div class="tool-row">
            <button class="action-btn action-cancel" @click="$emit('cancel')">Annuler</button>
            <button class="action-btn action-save" @click="save" :disabled="saving">{{ saving ? '⏳' : '✅ Enregistrer' }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({ src: { type: String, required: true } })
const emit  = defineEmits(['save', 'cancel'])

const MODES = [
  { id: 'magic',   icon: '🪄', label: 'Baguette',  tip: 'Efface les pixels de couleur similaire' },
  { id: 'erase',   icon: '🖌',  label: 'Gomme',     tip: 'Efface tout ce que le pinceau touche' },
  { id: 'restore', icon: '🔄',  label: 'Restaurer', tip: 'Remet les pixels originaux' },
  { id: 'lasso',   icon: '🔵',  label: 'Conserver', tip: 'Tracez un contour : tout l\'extérieur sera effacé' },
]

const canvas   = ref(null)
const overlay  = ref(null)
const wrapEl   = ref(null)
const ready    = ref(false)
const mode     = ref('magic')
const brushSize   = ref(30)
const tolerance   = ref(40)
const saving      = ref(false)
const drawing     = ref(false)
const canUndo     = ref(false)
const showCursor  = ref(false)
const cursorX     = ref(0)
const cursorY     = ref(0)
const lassoHint   = ref(false)

let ctx = null, octx = null
let originalData = null
let workingData  = null   // buffer mémoire — modifié en RAM, flushed par RAF
let undoStack    = []
let scaleX = 1, scaleY = 1
let canvasOffX = 0, canvasOffY = 0
let rafId = null
let lassoPoints = []

const dispBrush = computed(() => brushSize.value / scaleX)

// ── Init ─────────────────────────────────────────────────────────────────────
onMounted(() => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const c = canvas.value, o = overlay.value
    if (!c) return
    const wrap = wrapEl.value
    const maxW = (wrap?.clientWidth || 700) - 4
    const maxH = 400
    const s = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight)
    c.width = o.width = Math.round(img.naturalWidth * s)
    c.height = o.height = Math.round(img.naturalHeight * s)
    ctx  = c.getContext('2d', { willReadFrequently: true })
    octx = o.getContext('2d')
    ctx.drawImage(img, 0, 0, c.width, c.height)
    originalData = ctx.getImageData(0, 0, c.width, c.height)
    workingData  = ctx.getImageData(0, 0, c.width, c.height)
    refreshScale()
    ready.value = true
  }
  img.onerror = () => { ready.value = true }
  img.src = props.src
})

onUnmounted(() => { if (rafId) cancelAnimationFrame(rafId) })

function refreshScale() {
  const c = canvas.value, wrap = wrapEl.value
  if (!c || !wrap) return
  const cr = c.getBoundingClientRect(), wr = wrap.getBoundingClientRect()
  scaleX = c.width / cr.width
  scaleY = c.height / cr.height
  canvasOffX = cr.left - wr.left
  canvasOffY = cr.top  - wr.top
}

function toCanvas(cx, cy) {
  const wr = wrapEl.value.getBoundingClientRect()
  return {
    x: (cx - wr.left - canvasOffX) * scaleX,
    y: (cy - wr.top  - canvasOffY) * scaleY,
  }
}

function updateCursor(cx, cy) {
  const wr = wrapEl.value?.getBoundingClientRect()
  if (!wr) return
  cursorX.value = cx - wr.left - dispBrush.value / 2
  cursorY.value = cy - wr.top  - dispBrush.value / 2
}

// ── Undo ─────────────────────────────────────────────────────────────────────
function pushUndo() {
  undoStack.push(new ImageData(new Uint8ClampedArray(workingData.data), workingData.width, workingData.height))
  if (undoStack.length > 20) undoStack.shift()
  canUndo.value = true
}

function undo() {
  if (!undoStack.length) return
  workingData = undoStack.pop()
  ctx.putImageData(workingData, 0, 0)
  canUndo.value = undoStack.length > 0
}

function reset() {
  pushUndo()
  workingData = new ImageData(new Uint8ClampedArray(originalData.data), originalData.width, originalData.height)
  ctx.putImageData(workingData, 0, 0)
}

// ── RAF flush ────────────────────────────────────────────────────────────────
function scheduleFlush() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    ctx.putImageData(workingData, 0, 0)
  })
}

// ── Baguette magique (sur buffer mémoire) ────────────────────────────────────
function applyMagic(px, py) {
  const ix = Math.round(px), iy = Math.round(py)
  const W = workingData.width, H = workingData.height
  if (ix < 0 || iy < 0 || ix >= W || iy >= H) return
  const d = workingData.data
  const base = (iy * W + ix) * 4
  if (d[base+3] === 0) return
  const [sr, sg, sb] = [d[base], d[base+1], d[base+2]]
  const r = brushSize.value, rr = r * r, tol = tolerance.value
  const x0 = Math.max(0, ix - r), y0 = Math.max(0, iy - r)
  const x1 = Math.min(W-1, ix + r), y1 = Math.min(H-1, iy + r)
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if ((x-ix)*(x-ix)+(y-iy)*(y-iy) > rr) continue
      const i = (y * W + x) * 4
      if (d[i+3] === 0) continue
      const dr = d[i]-sr, dg = d[i+1]-sg, db = d[i+2]-sb
      if (Math.sqrt(dr*dr+dg*dg+db*db) <= tol) d[i+3] = 0
    }
  }
  scheduleFlush()
}

// ── Gomme ────────────────────────────────────────────────────────────────────
function applyErase(px, py) {
  const W = workingData.width, H = workingData.height
  const d = workingData.data
  const r = brushSize.value, rr = r * r
  const x0 = Math.max(0, Math.round(px-r)), y0 = Math.max(0, Math.round(py-r))
  const x1 = Math.min(W-1, Math.round(px+r)), y1 = Math.min(H-1, Math.round(py+r))
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if ((x-px)*(x-px)+(y-py)*(y-py) > rr) continue
      d[(y*W+x)*4+3] = 0
    }
  }
  scheduleFlush()
}

// ── Restaurer ────────────────────────────────────────────────────────────────
function applyRestore(px, py) {
  const W = workingData.width, H = workingData.height
  const d = workingData.data, o = originalData.data
  const r = brushSize.value, rr = r * r
  const x0 = Math.max(0, Math.round(px-r)), y0 = Math.max(0, Math.round(py-r))
  const x1 = Math.min(W-1, Math.round(px+r)), y1 = Math.min(H-1, Math.round(py+r))
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if ((x-px)*(x-px)+(y-py)*(y-py) > rr) continue
      const i = (y*W+x)*4
      d[i]=o[i]; d[i+1]=o[i+1]; d[i+2]=o[i+2]; d[i+3]=o[i+3]
    }
  }
  scheduleFlush()
}

// ── Lasso : conserver l'intérieur ────────────────────────────────────────────
function drawLassoPreview() {
  const o = overlay.value
  if (!o || !octx) return
  octx.clearRect(0, 0, o.width, o.height)
  if (lassoPoints.length < 2) return
  octx.save()
  octx.strokeStyle = '#00d0d0'
  octx.lineWidth = 2
  octx.setLineDash([6, 4])
  octx.beginPath()
  octx.moveTo(lassoPoints[0].x, lassoPoints[0].y)
  for (let i = 1; i < lassoPoints.length; i++) octx.lineTo(lassoPoints[i].x, lassoPoints[i].y)
  octx.stroke()
  octx.restore()
}

function applyLasso() {
  if (lassoPoints.length < 3) return
  const c = canvas.value, W = c.width, H = c.height
  // Masque : remplir le lasso en blanc sur un canvas offscreen
  const mask = document.createElement('canvas')
  mask.width = W; mask.height = H
  const mctx = mask.getContext('2d')
  mctx.fillStyle = '#000'
  mctx.fillRect(0, 0, W, H)
  mctx.fillStyle = '#fff'
  mctx.beginPath()
  mctx.moveTo(lassoPoints[0].x, lassoPoints[0].y)
  for (let i = 1; i < lassoPoints.length; i++) mctx.lineTo(lassoPoints[i].x, lassoPoints[i].y)
  mctx.closePath()
  mctx.fill()
  // Appliquer : garder seulement les pixels intérieurs
  const maskData = mctx.getImageData(0, 0, W, H).data
  const d = workingData.data
  for (let i = 0; i < d.length; i += 4) {
    if (maskData[i] === 0) d[i+3] = 0
  }
  ctx.putImageData(workingData, 0, 0)
  octx.clearRect(0, 0, W, H)
  lassoPoints = []
  lassoHint.value = false
}

function paint(px, py) {
  if (mode.value === 'magic')   applyMagic(px, py)
  else if (mode.value === 'erase')   applyErase(px, py)
  else if (mode.value === 'restore') applyRestore(px, py)
}

// ── Événements ───────────────────────────────────────────────────────────────
function onDown(e) {
  refreshScale()
  const { x, y } = toCanvas(e.clientX, e.clientY)
  if (mode.value === 'lasso') {
    pushUndo()
    lassoPoints = [{ x, y }]
    lassoHint.value = false
    drawing.value = true
    return
  }
  pushUndo()
  drawing.value = true
  paint(x, y)
}

function onMove(e) {
  updateCursor(e.clientX, e.clientY)
  const { x, y } = toCanvas(e.clientX, e.clientY)
  if (mode.value === 'lasso') {
    if (!drawing.value) return
    lassoPoints.push({ x, y })
    if (lassoPoints.length > 10) lassoHint.value = true
    drawLassoPreview()
    return
  }
  if (!drawing.value) return
  paint(x, y)
}

function onUp() {
  if (mode.value === 'lasso' && drawing.value) applyLasso()
  drawing.value = false
}

function onTouchStart(e) {
  refreshScale()
  const t = e.touches[0]
  const { x, y } = toCanvas(t.clientX, t.clientY)
  if (mode.value === 'lasso') {
    pushUndo(); lassoPoints = [{ x, y }]; drawing.value = true; return
  }
  pushUndo(); drawing.value = true; paint(x, y)
}

function onTouchMove(e) {
  if (!drawing.value) return
  const t = e.touches[0]
  const { x, y } = toCanvas(t.clientX, t.clientY)
  if (mode.value === 'lasso') {
    lassoPoints.push({ x, y }); drawLassoPreview(); return
  }
  paint(x, y)
}

// ── Enregistrer ──────────────────────────────────────────────────────────────
function save() {
  saving.value = true
  canvas.value.toBlob(blob => { emit('save', blob); saving.value = false }, 'image/png')
}
</script>

<style scoped>
.eraser-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65);
  z-index: 9100;
  display: flex; align-items: center; justify-content: center;
  padding: 12px;
}
.eraser-modal {
  background: #fff; border-radius: 14px; overflow: hidden;
  display: flex; flex-direction: column;
  max-width: 780px; width: 100%; max-height: 94vh;
  box-shadow: 0 12px 48px rgba(0,0,0,0.3);
}
.eraser-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid #eee; flex-shrink: 0;
}
.eraser-title { font-weight: 700; }
.eraser-close { background: none; border: none; font-size: 1.2em; cursor: pointer; color: #888; padding: 2px 8px; }

.eraser-canvas-wrap {
  flex: 1; min-height: 160px;
  background: repeating-conic-gradient(#bbb 0% 25%, #eee 0% 50%) 0 0 / 14px 14px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; position: relative; cursor: none;
}
.eraser-canvas { display: block; max-width: 100%; touch-action: none; cursor: none; }
.eraser-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none; cursor: crosshair; }
.eraser-overlay[style*="display: block"], .eraser-overlay:not([style*="display: none"]) { pointer-events: auto; cursor: crosshair; }

.brush-cursor {
  position: absolute; border-radius: 50%; pointer-events: none;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1.5px rgba(0,0,0,0.5);
}
.brush-cursor.magic   { border-color: #f90; }
.brush-cursor.restore { border-color: #4af; }
.brush-cursor.erase   { border-color: #fff; }
.eraser-loading { position: absolute; color: #666; font-size: .9em; }
.lasso-hint {
  position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.55); color: #fff;
  padding: 4px 12px; border-radius: 12px; font-size: 0.8em;
  pointer-events: none;
}

.eraser-toolbar {
  padding: 10px 14px; border-top: 1px solid #eee;
  display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end;
  background: #f8f8f8; flex-shrink: 0;
}
.tool-col { display: flex; flex-direction: column; gap: 5px; }
.tool-col-actions { margin-left: auto; gap: 6px; }
.tool-label { font-size: 0.72em; text-transform: uppercase; letter-spacing: .05em; color: #999; font-weight: 700; }
.tool-row { display: flex; gap: 5px; align-items: center; }
.tool-range { width: 90px; accent-color: var(--primary-teal); }

.mode-btn {
  padding: 5px 11px; border-radius: 16px;
  border: 1.5px solid #d0d0d0; background: #fff;
  font-size: .82em; font-weight: 600; cursor: pointer;
  font-family: inherit; color: #444; transition: all .15s;
}
.mode-btn:hover { border-color: var(--primary-teal); color: var(--primary-teal); }
.mode-btn.active.mode-magic   { background: #e07b00; color:#fff; border-color:#e07b00; }
.mode-btn.active.mode-erase   { background: var(--primary-teal); color:#fff; border-color:var(--primary-teal); }
.mode-btn.active.mode-restore { background: #2563eb; color:#fff; border-color:#2563eb; }
.mode-btn.active.mode-lasso   { background: #7c3aed; color:#fff; border-color:#7c3aed; }

.action-btn {
  padding: 5px 12px; border-radius: 16px;
  border: 1.5px solid #d0d0d0; background: #fff;
  font-size: .82em; font-weight: 600; cursor: pointer;
  font-family: inherit; color: #444; transition: all .15s;
}
.action-btn:hover:not(:disabled) { border-color: var(--primary-teal); color: var(--primary-teal); }
.action-btn:disabled { opacity: .45; cursor: default; }
.action-cancel { color: #888; }
.action-save { background: var(--primary-teal); color: #fff; border-color: var(--primary-teal); }
.action-save:hover:not(:disabled) { background: #159897; }
</style>
