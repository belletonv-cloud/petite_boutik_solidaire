<template>
  <div class="eraser-modal-overlay" @click.self="$emit('cancel')">
    <div class="eraser-modal">
      <div class="eraser-header">
        <span class="eraser-title">✂️ Retouche manuelle</span>
        <button class="eraser-close" @click="$emit('cancel')">✕</button>
      </div>

      <div class="eraser-canvas-wrap" ref="wrapEl">
        <canvas
          ref="canvas"
          class="eraser-canvas"
          @mousedown="onDown"
          @mousemove="onMove"
          @mouseup="onUp"
          @mouseleave="onUp"
          @touchstart.prevent="onTouchStart"
          @touchmove.prevent="onTouchMove"
          @touchend="onUp"
        />
        <!-- Curseur visuel du pinceau -->
        <div
          v-if="showCursor"
          class="brush-cursor"
          :style="{
            left: cursorPos.x + 'px',
            top: cursorPos.y + 'px',
            width: displayBrushSize + 'px',
            height: displayBrushSize + 'px',
            borderColor: mode === 'magic' ? '#f90' : mode === 'restore' ? '#4af' : '#fff',
          }"
        />
        <div v-if="!ready" class="eraser-loading">Chargement…</div>
      </div>

      <div class="eraser-toolbar">
        <!-- Modes -->
        <div class="tool-section">
          <span class="tool-section-label">Mode</span>
          <div class="tool-group">
            <button :class="['tool-btn', mode === 'magic' ? 'active magic' : '']" @click="mode = 'magic'" title="Pinceau magique : efface les pixels de couleur similaire">
              🪄 Magique
            </button>
            <button :class="['tool-btn', mode === 'erase' ? 'active' : '']" @click="mode = 'erase'" title="Gomme manuelle">
              🖌 Gomme
            </button>
            <button :class="['tool-btn', mode === 'restore' ? 'active restore' : '']" @click="mode = 'restore'" title="Restaurer les pixels originaux">
              🔄 Restaurer
            </button>
          </div>
        </div>

        <!-- Taille pinceau -->
        <div class="tool-section">
          <span class="tool-section-label">Taille</span>
          <div class="tool-group">
            <input type="range" v-model.number="brushSize" min="4" max="100" class="brush-slider" />
            <span class="brush-val">{{ brushSize }}px</span>
          </div>
        </div>

        <!-- Tolérance (mode magique) -->
        <div class="tool-section" v-if="mode === 'magic'">
          <span class="tool-section-label">Tolérance</span>
          <div class="tool-group">
            <input type="range" v-model.number="tolerance" min="5" max="120" class="brush-slider" />
            <span class="brush-val">{{ tolerance }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="tool-section tool-section-actions">
          <div class="tool-group">
            <button class="tool-btn" @click="undo" :disabled="!canUndo">↩ Annuler</button>
            <button class="tool-btn" @click="reset">🔃 Reset</button>
          </div>
          <div class="tool-group">
            <button class="tool-btn tool-btn-cancel" @click="$emit('cancel')">Annuler</button>
            <button class="tool-btn tool-btn-save" @click="save" :disabled="saving">
              {{ saving ? '⏳' : '✅ Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({ src: { type: String, required: true } })
const emit = defineEmits(['save', 'cancel'])

const canvas = ref(null)
const wrapEl = ref(null)
const ready = ref(false)
const mode = ref('magic')
const brushSize = ref(30)
const tolerance = ref(40)
const saving = ref(false)
const drawing = ref(false)
const canUndo = ref(false)
const showCursor = ref(false)
const cursorPos = ref({ x: 0, y: 0 })

let ctx = null
let originalData = null   // ImageData original conservé pour restore
let undoStack = []
let sampledColor = null   // couleur échantillonnée au début du tracé (mode magique)
let canvasScale = { x: 1, y: 1 }  // ratio canvas coords / display coords

// Taille du curseur en px display (pas canvas)
const displayBrushSize = computed(() => {
  const rect = canvas.value?.getBoundingClientRect()
  const cw = canvas.value?.width || 1
  const dw = rect?.width || 1
  return Math.round(brushSize.value * (dw / cw))
})

onMounted(() => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const c = canvas.value
    if (!c) return
    const wrap = wrapEl.value
    const maxW = (wrap?.clientWidth || 640) - 2
    const maxH = 420
    const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight)
    c.width = Math.round(img.naturalWidth * scale)
    c.height = Math.round(img.naturalHeight * scale)
    ctx = c.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0, c.width, c.height)
    originalData = ctx.getImageData(0, 0, c.width, c.height)
    updateScale()
    ready.value = true
  }
  img.onerror = () => { ready.value = true }
  img.src = props.src
})

function updateScale() {
  const c = canvas.value
  const rect = c?.getBoundingClientRect()
  if (!c || !rect) return
  canvasScale = { x: c.width / rect.width, y: c.height / rect.height }
}

function getCanvasPos(clientX, clientY) {
  const rect = canvas.value.getBoundingClientRect()
  return {
    x: (clientX - rect.left) * canvasScale.x,
    y: (clientY - rect.top) * canvasScale.y,
  }
}

function getDisplayPos(clientX, clientY) {
  const rect = canvas.value.getBoundingClientRect()
  return { x: clientX - rect.left, y: clientY - rect.top }
}

function pushUndo() {
  if (!ctx || !canvas.value) return
  undoStack.push(ctx.getImageData(0, 0, canvas.value.width, canvas.value.height))
  if (undoStack.length > 30) undoStack.shift()
  canUndo.value = true
}

// ─── Algorithme pinceau magique ────────────────────────────────────────────
// Pour chaque pixel dans le rayon du pinceau : si sa couleur est proche de la
// couleur échantillonnée (au clic), on le rend transparent.
function sampleColor(x, y) {
  const d = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data
  return [d[0], d[1], d[2], d[3]]
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function applyMagicBrush(cx, cy) {
  if (!sampledColor) return
  const [sr, sg, sb] = sampledColor
  const r = Math.round(brushSize.value)
  const x0 = Math.max(0, Math.round(cx) - r)
  const y0 = Math.max(0, Math.round(cy) - r)
  const x1 = Math.min(canvas.value.width - 1, Math.round(cx) + r)
  const y1 = Math.min(canvas.value.height - 1, Math.round(cy) + r)
  const w = x1 - x0 + 1
  const h = y1 - y0 + 1
  if (w <= 0 || h <= 0) return
  const patch = ctx.getImageData(x0, y0, w, h)
  const data = patch.data
  const rr = r * r
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      // Dans le cercle ?
      const dx = px + x0 - cx, dy = py + y0 - cy
      if (dx * dx + dy * dy > rr) continue
      const idx = (py * w + px) * 4
      if (data[idx + 3] === 0) continue  // déjà transparent
      const dist = colorDistance(data[idx], data[idx + 1], data[idx + 2], sr, sg, sb)
      if (dist <= tolerance.value) {
        data[idx + 3] = 0
      }
    }
  }
  ctx.putImageData(patch, x0, y0)
}

function applyEraseBrush(cx, cy) {
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(cx, cy, brushSize.value, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function applyRestoreBrush(cx, cy) {
  if (!originalData) return
  const r = brushSize.value
  const x0 = Math.max(0, Math.round(cx) - r)
  const y0 = Math.max(0, Math.round(cy) - r)
  const x1 = Math.min(canvas.value.width - 1, Math.round(cx) + r)
  const y1 = Math.min(canvas.value.height - 1, Math.round(cy) + r)
  const w = x1 - x0 + 1
  const h = y1 - y0 + 1
  if (w <= 0 || h <= 0) return
  const rr = r * r
  const patch = ctx.getImageData(x0, y0, w, h)
  const cur = patch.data
  const orig = originalData.data
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = px + x0 - cx, dy = py + y0 - cy
      if (dx * dx + dy * dy > rr) continue
      const srcIdx = ((py + y0) * canvas.value.width + (px + x0)) * 4
      const dstIdx = (py * w + px) * 4
      cur[dstIdx]     = orig[srcIdx]
      cur[dstIdx + 1] = orig[srcIdx + 1]
      cur[dstIdx + 2] = orig[srcIdx + 2]
      cur[dstIdx + 3] = orig[srcIdx + 3]
    }
  }
  ctx.putImageData(patch, x0, y0)
}

function paint(cx, cy) {
  if (mode.value === 'magic') applyMagicBrush(cx, cy)
  else if (mode.value === 'erase') applyEraseBrush(cx, cy)
  else applyRestoreBrush(cx, cy)
}

// ─── Événements souris ──────────────────────────────────────────────────────
function onDown(e) {
  updateScale()
  const { x, y } = getCanvasPos(e.clientX, e.clientY)
  pushUndo()
  drawing.value = true
  if (mode.value === 'magic') sampledColor = sampleColor(x, y)
  paint(x, y)
  updateCursor(e.clientX, e.clientY)
}

function onMove(e) {
  updateCursor(e.clientX, e.clientY)
  if (!drawing.value) return
  const { x, y } = getCanvasPos(e.clientX, e.clientY)
  paint(x, y)
}

function onUp() { drawing.value = false; sampledColor = null }

function updateCursor(clientX, clientY) {
  const dp = getDisplayPos(clientX, clientY)
  cursorPos.value = { x: dp.x - displayBrushSize.value / 2, y: dp.y - displayBrushSize.value / 2 }
  showCursor.value = true
}

// ─── Événements touch ───────────────────────────────────────────────────────
function onTouchStart(e) {
  updateScale()
  const t = e.touches[0]
  const { x, y } = getCanvasPos(t.clientX, t.clientY)
  pushUndo()
  drawing.value = true
  if (mode.value === 'magic') sampledColor = sampleColor(x, y)
  paint(x, y)
}

function onTouchMove(e) {
  if (!drawing.value) return
  const t = e.touches[0]
  const { x, y } = getCanvasPos(t.clientX, t.clientY)
  paint(x, y)
}

// ─── Undo / Reset / Save ────────────────────────────────────────────────────
function undo() {
  if (!undoStack.length) return
  ctx.putImageData(undoStack.pop(), 0, 0)
  canUndo.value = undoStack.length > 0
}

function reset() {
  if (!originalData) return
  pushUndo()
  ctx.putImageData(originalData, 0, 0)
}

function save() {
  saving.value = true
  canvas.value.toBlob(blob => {
    emit('save', blob)
    saving.value = false
  }, 'image/png')
}
</script>

<style scoped>
.eraser-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  z-index: 9100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}
.eraser-modal {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-width: 760px;
  width: 100%;
  max-height: 94vh;
  box-shadow: 0 12px 48px rgba(0,0,0,0.3);
}
.eraser-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}
.eraser-title { font-weight: 700; font-size: 1em; }
.eraser-close {
  background: none; border: none; font-size: 1.2em;
  cursor: pointer; color: #888; padding: 2px 8px;
}
.eraser-canvas-wrap {
  flex: 1;
  min-height: 180px;
  background: repeating-conic-gradient(#bbb 0% 25%, #eee 0% 50%) 0 0 / 14px 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  cursor: none;
}
.eraser-canvas {
  display: block;
  max-width: 100%;
  touch-action: none;
  cursor: none;
}
.brush-cursor {
  position: absolute;
  border: 2px solid #fff;
  border-radius: 50%;
  pointer-events: none;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.4);
  transform: none;
}
.eraser-loading {
  position: absolute;
  color: #666;
  font-size: 0.9em;
}
.eraser-toolbar {
  padding: 10px 14px;
  border-top: 1px solid #eee;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  background: #f8f8f8;
  flex-shrink: 0;
}
.tool-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tool-section-label {
  font-size: 0.72em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #999;
  font-weight: 700;
}
.tool-section-actions {
  margin-left: auto;
  flex-direction: row;
  gap: 8px;
  align-items: center;
}
.tool-group {
  display: flex;
  align-items: center;
  gap: 5px;
}
.tool-btn {
  padding: 5px 12px;
  border-radius: 16px;
  border: 1.5px solid #d0d0d0;
  background: #fff;
  font-size: 0.82em;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  color: #444;
  white-space: nowrap;
}
.tool-btn:hover:not(:disabled) { border-color: var(--primary-teal); color: var(--primary-teal); }
.tool-btn.active { background: var(--primary-teal); color: #fff; border-color: var(--primary-teal); }
.tool-btn.active.magic { background: #e07b00; border-color: #e07b00; }
.tool-btn.active.restore { background: #2563eb; border-color: #2563eb; }
.tool-btn:disabled { opacity: 0.45; cursor: default; }
.tool-btn-cancel { color: #888; }
.tool-btn-save { background: var(--primary-teal); color: #fff; border-color: var(--primary-teal); }
.tool-btn-save:hover:not(:disabled) { background: #159897; }
.brush-slider { width: 80px; accent-color: var(--primary-teal); }
.brush-val { font-size: 0.78em; color: #666; min-width: 32px; }
</style>
