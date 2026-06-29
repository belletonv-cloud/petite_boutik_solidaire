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
          :style="{ cursor: mode === 'erase' ? 'crosshair' : 'cell' }"
          @mousedown="onDown"
          @mousemove="onMove"
          @mouseup="onUp"
          @mouseleave="onUp"
          @touchstart.prevent="onTouchStart"
          @touchmove.prevent="onTouchMove"
          @touchend="onUp"
        />
        <div v-if="!ready" class="eraser-loading">Chargement…</div>
      </div>
      <div class="eraser-toolbar">
        <div class="eraser-tool-group">
          <button :class="['tool-btn', mode === 'erase' ? 'active' : '']" @click="mode = 'erase'" title="Effacer">🖌 Effacer</button>
          <button :class="['tool-btn', mode === 'restore' ? 'active' : '']" @click="mode = 'restore'" title="Restaurer">🔄 Restaurer</button>
        </div>
        <div class="eraser-tool-group">
          <label class="brush-label">Taille</label>
          <input type="range" v-model.number="brushSize" min="4" max="80" class="brush-slider" />
          <span class="brush-val">{{ brushSize }}px</span>
        </div>
        <div class="eraser-tool-group">
          <button class="tool-btn" @click="undo" :disabled="!canUndo" title="Annuler">↩ Annuler</button>
          <button class="tool-btn" @click="reset" title="Tout réinitialiser">🔃 Reset</button>
        </div>
        <div class="eraser-tool-group eraser-actions">
          <button class="tool-btn tool-btn-cancel" @click="$emit('cancel')">Annuler</button>
          <button class="tool-btn tool-btn-save" @click="save" :disabled="saving">{{ saving ? '⏳ Enregistrement…' : '✅ Enregistrer' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({ src: { type: String, required: true } })
const emit = defineEmits(['save', 'cancel'])

const canvas = ref(null)
const wrapEl = ref(null)
const ready = ref(false)
const mode = ref('erase')
const brushSize = ref(20)
const saving = ref(false)
const drawing = ref(false)
const canUndo = ref(false)

let ctx = null
let originalData = null
let undoStack = []

onMounted(() => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const c = canvas.value
    if (!c) return
    const wrap = wrapEl.value
    const maxW = wrap?.clientWidth || 600
    const maxH = 400
    const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight)
    c.width = Math.round(img.naturalWidth * scale)
    c.height = Math.round(img.naturalHeight * scale)
    ctx = c.getContext('2d')
    ctx.drawImage(img, 0, 0, c.width, c.height)
    originalData = ctx.getImageData(0, 0, c.width, c.height)
    ready.value = true
  }
  img.onerror = () => { ready.value = true }
  img.src = props.src
})

function getPos(e) {
  const rect = canvas.value.getBoundingClientRect()
  const scaleX = canvas.value.width / rect.width
  const scaleY = canvas.value.height / rect.height
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  }
}

function pushUndo() {
  undoStack.push(ctx.getImageData(0, 0, canvas.value.width, canvas.value.height))
  if (undoStack.length > 20) undoStack.shift()
  canUndo.value = true
}

function paint(x, y) {
  ctx.save()
  ctx.globalCompositeOperation = mode.value === 'erase' ? 'destination-out' : 'source-over'
  if (mode.value === 'restore' && originalData) {
    // Restore pixels from originalData in the brush area
    const r = brushSize.value
    const offCanvas = document.createElement('canvas')
    offCanvas.width = canvas.value.width
    offCanvas.height = canvas.value.height
    const offCtx = offCanvas.getContext('2d')
    offCtx.putImageData(originalData, 0, 0)
    ctx.save()
    ctx.globalCompositeOperation = 'source-over'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(offCanvas, 0, 0)
    ctx.restore()
    return
  }
  ctx.beginPath()
  ctx.arc(x, y, brushSize.value, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function onDown(e) {
  pushUndo()
  drawing.value = true
  const { x, y } = getPos(e)
  paint(x, y)
}
function onMove(e) {
  if (!drawing.value) return
  const { x, y } = getPos(e)
  paint(x, y)
}
function onUp() { drawing.value = false }

function onTouchStart(e) {
  pushUndo()
  drawing.value = true
  const t = e.touches[0]
  const { x, y } = getPos(t)
  paint(x, y)
}
function onTouchMove(e) {
  if (!drawing.value) return
  const t = e.touches[0]
  const { x, y } = getPos(t)
  paint(x, y)
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

async function save() {
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
  background: rgba(0,0,0,0.6);
  z-index: 9100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.eraser-modal {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-width: 720px;
  width: 100%;
  max-height: 90vh;
  box-shadow: 0 8px 40px rgba(0,0,0,0.25);
}
.eraser-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}
.eraser-title { font-weight: 700; font-size: 1em; }
.eraser-close {
  background: none;
  border: none;
  font-size: 1.2em;
  cursor: pointer;
  color: #888;
  padding: 2px 8px;
}
.eraser-canvas-wrap {
  flex: 1;
  min-height: 200px;
  background: repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 16px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}
.eraser-canvas {
  display: block;
  max-width: 100%;
  max-height: 400px;
  touch-action: none;
}
.eraser-loading {
  position: absolute;
  color: #666;
  font-size: 0.9em;
}
.eraser-toolbar {
  padding: 10px 12px;
  border-top: 1px solid #eee;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  background: #fafafa;
}
.eraser-tool-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.eraser-actions { margin-left: auto; }
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
}
.tool-btn:hover:not(:disabled) { border-color: var(--primary-teal); color: var(--primary-teal); }
.tool-btn.active { background: var(--primary-teal); color: #fff; border-color: var(--primary-teal); }
.tool-btn:disabled { opacity: 0.5; cursor: default; }
.tool-btn-cancel { color: #888; }
.tool-btn-save { background: var(--primary-teal); color: #fff; border-color: var(--primary-teal); }
.tool-btn-save:hover:not(:disabled) { background: #159897; }
.brush-label { font-size: 0.78em; color: #888; font-weight: 600; }
.brush-slider { width: 80px; accent-color: var(--primary-teal); }
.brush-val { font-size: 0.78em; color: #666; min-width: 30px; }
</style>
