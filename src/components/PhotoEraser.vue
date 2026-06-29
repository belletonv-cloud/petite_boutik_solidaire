<template>
  <div class="eraser-modal-overlay" @click.self="$emit('cancel')">
    <div class="eraser-modal">
      <div class="eraser-header">
        <span class="eraser-title">✂️ Retouche manuelle</span>
        <button class="eraser-close" @click="$emit('cancel')">✕</button>
      </div>

      <!-- Canvas -->
      <div class="eraser-canvas-wrap" ref="wrapEl" @mouseleave="showCursor = false" @mouseenter="showCursor = true">
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
        <div
          v-show="showCursor && ready"
          class="brush-cursor"
          :class="mode"
          :style="{
            left: cursorX + 'px',
            top:  cursorY + 'px',
            width:  displayBrush + 'px',
            height: displayBrush + 'px',
          }"
        />
        <div v-if="!ready" class="eraser-loading">Chargement…</div>
      </div>

      <!-- Toolbar -->
      <div class="eraser-toolbar">

        <div class="tool-col">
          <div class="tool-label">Outil</div>
          <div class="tool-row">
            <button
              v-for="m in MODES" :key="m.id"
              :class="['mode-btn', mode === m.id ? 'active-' + m.id : '']"
              @click="mode = m.id"
              :title="m.tip"
            >{{ m.icon }} {{ m.label }}</button>
          </div>
        </div>

        <div class="tool-col">
          <div class="tool-label">Taille&nbsp;<b>{{ brushSize }}px</b></div>
          <input type="range" v-model.number="brushSize" min="4" max="100" class="tool-range" />
        </div>

        <div class="tool-col" v-show="mode === 'magic'">
          <div class="tool-label">Tolérance&nbsp;<b>{{ tolerance }}</b></div>
          <input type="range" v-model.number="tolerance" min="5" max="120" class="tool-range" />
        </div>

        <div class="tool-col tool-col-actions">
          <div class="tool-row">
            <button class="action-btn" @click="undo" :disabled="!canUndo" title="Annuler la dernière action">↩ Défaire</button>
            <button class="action-btn" @click="reset" title="Remettre l'image d'origine">🔃 Tout réinitialiser</button>
          </div>
          <div class="tool-row">
            <button class="action-btn action-cancel" @click="$emit('cancel')">Annuler</button>
            <button class="action-btn action-save" @click="save" :disabled="saving">{{ saving ? '⏳' : '✅ Conserver' }}</button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({ src: { type: String, required: true } })
const emit  = defineEmits(['save', 'cancel'])

const MODES = [
  { id: 'magic',   icon: '🪄', label: 'Baguette', tip: 'Efface les pixels de couleur similaire sous le pinceau' },
  { id: 'erase',   icon: '🖌',  label: 'Gomme',    tip: 'Efface tout ce que le pinceau touche' },
  { id: 'restore', icon: '🔄',  label: 'Restaurer', tip: 'Remet les pixels originaux' },
]

const canvas  = ref(null)
const wrapEl  = ref(null)
const ready   = ref(false)
const mode    = ref('magic')
const brushSize  = ref(30)
const tolerance  = ref(40)
const saving     = ref(false)
const drawing    = ref(false)
const canUndo    = ref(false)
const showCursor = ref(false)
const cursorX = ref(0)   // relatif au wrapper
const cursorY = ref(0)

let ctx = null
let originalData = null
let undoStack    = []
// ratio coords canvas / coords display (pour mapper souris → pixels)
let scaleX = 1, scaleY = 1
// décalage du canvas dans le wrapper (si centré)
let canvasOffsetX = 0, canvasOffsetY = 0

const displayBrush = computed(() => brushSize.value / scaleX)

// ── Initialisation ──────────────────────────────────────────────────────────
onMounted(() => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const c = canvas.value
    if (!c) return
    const wrap = wrapEl.value
    const maxW = (wrap?.clientWidth  || 700) - 4
    const maxH = 400
    const s = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight)
    c.width  = Math.round(img.naturalWidth  * s)
    c.height = Math.round(img.naturalHeight * s)
    ctx = c.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0, c.width, c.height)
    originalData = ctx.getImageData(0, 0, c.width, c.height)
    refreshScale()
    ready.value = true
  }
  img.onerror = () => { ready.value = true }
  img.src = props.src
})

function refreshScale() {
  const c    = canvas.value
  const wrap = wrapEl.value
  if (!c || !wrap) return
  const cr = c.getBoundingClientRect()
  const wr = wrap.getBoundingClientRect()
  scaleX = c.width  / cr.width
  scaleY = c.height / cr.height
  canvasOffsetX = cr.left - wr.left
  canvasOffsetY = cr.top  - wr.top
}

// Convertit clientX/Y → coordonnées canvas (pixels réels)
function toCanvas(clientX, clientY) {
  const wr = wrapEl.value.getBoundingClientRect()
  const relX = clientX - wr.left - canvasOffsetX
  const relY = clientY - wr.top  - canvasOffsetY
  return { x: relX * scaleX, y: relY * scaleY }
}

// Mise à jour du curseur visuel (coordonnées dans le wrapper)
function updateCursor(clientX, clientY) {
  const wr = wrapEl.value?.getBoundingClientRect()
  if (!wr) return
  cursorX.value = clientX - wr.left - displayBrush.value / 2
  cursorY.value = clientY - wr.top  - displayBrush.value / 2
}

// ── Undo ─────────────────────────────────────────────────────────────────────
function pushUndo() {
  if (!ctx || !canvas.value) return
  undoStack.push(ctx.getImageData(0, 0, canvas.value.width, canvas.value.height))
  if (undoStack.length > 30) undoStack.shift()
  canUndo.value = true
}
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

// ── Algorithmes de peinture ──────────────────────────────────────────────────

// Pinceau magique : rééchantillonne à chaque position (comme la gomme de fond Photoshop)
function applyMagic(cx, cy) {
  const ix = Math.round(cx), iy = Math.round(cy)
  if (ix < 0 || iy < 0 || ix >= canvas.value.width || iy >= canvas.value.height) return
  const probe = ctx.getImageData(ix, iy, 1, 1).data
  // Si le pixel sous le curseur est déjà transparent, ne rien faire
  if (probe[3] === 0) return
  const [sr, sg, sb] = [probe[0], probe[1], probe[2]]
  const r  = Math.round(brushSize.value)
  const x0 = Math.max(0, ix - r), y0 = Math.max(0, iy - r)
  const x1 = Math.min(canvas.value.width - 1, ix + r)
  const y1 = Math.min(canvas.value.height - 1, iy + r)
  const w = x1 - x0 + 1, h = y1 - y0 + 1
  if (w <= 0 || h <= 0) return
  const patch = ctx.getImageData(x0, y0, w, h)
  const d = patch.data, rr = r * r, tol = tolerance.value
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = px + x0 - ix, dy = py + y0 - iy
      if (dx*dx + dy*dy > rr) continue
      const i = (py * w + px) * 4
      if (d[i+3] === 0) continue
      const dr = d[i]-sr, dg = d[i+1]-sg, db = d[i+2]-sb
      if (Math.sqrt(dr*dr + dg*dg + db*db) <= tol) d[i+3] = 0
    }
  }
  ctx.putImageData(patch, x0, y0)
}

// Gomme franche
function applyErase(cx, cy) {
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(cx, cy, brushSize.value, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// Restaurer depuis l'original
function applyRestore(cx, cy) {
  if (!originalData) return
  const r  = Math.round(brushSize.value)
  const ix = Math.round(cx), iy = Math.round(cy)
  const x0 = Math.max(0, ix - r), y0 = Math.max(0, iy - r)
  const x1 = Math.min(canvas.value.width  - 1, ix + r)
  const y1 = Math.min(canvas.value.height - 1, iy + r)
  const w = x1 - x0 + 1, h = y1 - y0 + 1
  if (w <= 0 || h <= 0) return
  const patch = ctx.getImageData(x0, y0, w, h)
  const cur = patch.data, orig = originalData.data, rr = r * r
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = px + x0 - ix, dy = py + y0 - iy
      if (dx*dx + dy*dy > rr) continue
      const si = ((py + y0) * canvas.value.width + (px + x0)) * 4
      const di = (py * w + px) * 4
      cur[di]=orig[si]; cur[di+1]=orig[si+1]; cur[di+2]=orig[si+2]; cur[di+3]=orig[si+3]
    }
  }
  ctx.putImageData(patch, x0, y0)
}

function paint(cx, cy) {
  if (mode.value === 'magic')   applyMagic(cx, cy)
  else if (mode.value === 'erase')   applyErase(cx, cy)
  else applyRestore(cx, cy)
}

// ── Événements ───────────────────────────────────────────────────────────────
function onDown(e) {
  refreshScale()
  drawing.value = true
  pushUndo()
  const { x, y } = toCanvas(e.clientX, e.clientY)
  paint(x, y)
}
function onMove(e) {
  updateCursor(e.clientX, e.clientY)
  if (!drawing.value) return
  const { x, y } = toCanvas(e.clientX, e.clientY)
  paint(x, y)
}
function onUp() { drawing.value = false }

function onTouchStart(e) {
  refreshScale()
  drawing.value = true
  pushUndo()
  const t = e.touches[0]
  const { x, y } = toCanvas(t.clientX, t.clientY)
  paint(x, y)
}
function onTouchMove(e) {
  if (!drawing.value) return
  const t = e.touches[0]
  const { x, y } = toCanvas(t.clientX, t.clientY)
  paint(x, y)
}

// ── Sauvegarder ──────────────────────────────────────────────────────────────
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
.eraser-title { font-weight: 700; font-size: 1em; }
.eraser-close { background: none; border: none; font-size: 1.2em; cursor: pointer; color: #888; padding: 2px 8px; }

.eraser-canvas-wrap {
  flex: 1; min-height: 160px;
  background: repeating-conic-gradient(#bbb 0% 25%, #eee 0% 50%) 0 0 / 14px 14px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; position: relative; cursor: none;
}
.eraser-canvas { display: block; max-width: 100%; touch-action: none; cursor: none; }
.eraser-loading { position: absolute; color: #666; font-size: .9em; }

/* Curseur visuel */
.brush-cursor {
  position: absolute; border-radius: 50%; pointer-events: none;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1.5px rgba(0,0,0,0.5);
}
.brush-cursor.magic   { border-color: #f90; }
.brush-cursor.restore { border-color: #4af; }
.brush-cursor.erase   { border-color: #fff; }

/* Toolbar */
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
.mode-btn.active-magic   { background: #e07b00; color: #fff; border-color: #e07b00; }
.mode-btn.active-erase   { background: var(--primary-teal); color: #fff; border-color: var(--primary-teal); }
.mode-btn.active-restore { background: #2563eb; color: #fff; border-color: #2563eb; }

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
