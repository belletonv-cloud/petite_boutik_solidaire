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
        <canvas ref="canvas" class="eraser-canvas"
          @mousedown="onDown" @mousemove="onMove" @mouseup="onUp" @mouseleave="onUp"
          @touchstart.prevent="onTouchStart" @touchmove.prevent="onTouchMove" @touchend="onUp"
        />
        <!-- overlay lasso / maglasso -->
        <canvas ref="overlay" class="eraser-canvas eraser-overlay"
          v-show="isLassoMode"
          @mousedown="onDown" @mousemove="onMove" @mouseup="onUp"
          @dblclick="onDblClick"
          @touchstart.prevent="onTouchStart" @touchmove.prevent="onTouchMove" @touchend="onUp"
        />
        <div v-show="showCursor && ready && !isLassoMode" class="brush-cursor" :class="mode"
          :style="{ left: cursorX+'px', top: cursorY+'px', width: dispBrush+'px', height: dispBrush+'px' }"
        />
        <div v-if="isLassoMode && lassoStatus" class="lasso-hint">{{ lassoStatus }}</div>
        <div v-if="!ready" class="eraser-loading">Chargement…</div>
      </div>

      <div class="eraser-toolbar">
        <div class="tool-col">
          <div class="tool-label">Outil</div>
          <div class="tool-row">
            <button v-for="m in MODES" :key="m.id"
              :class="['mode-btn', 'mode-'+m.id, mode===m.id ? 'active' : '']"
              @click="setMode(m.id)" :title="m.tip"
            >{{ m.icon }} {{ m.label }}</button>
          </div>
        </div>

        <div class="tool-col tool-col-sliders">
          <div class="slider-row">
            <div class="tool-label">Taille <b>{{ brushSize }}px</b></div>
            <input type="range" v-model.number="brushSize" min="4" max="100" class="tool-range" />
          </div>
          <div class="slider-row">
            <div class="tool-label">Tolérance <b>{{ tolerance }}</b></div>
            <input type="range" v-model.number="tolerance" min="5" max="120" class="tool-range" />
          </div>
          <div class="slider-row">
            <div class="tool-label">Magnétisme <b>{{ snapRadius }}px</b></div>
            <input type="range" v-model.number="snapRadius" min="4" max="40" class="tool-range" />
          </div>
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
  { id: 'maglasso', icon: '🧲', label: 'Lasso magnétique', tip: 'Cliquez pour poser des ancres — s\'accroche aux contours. Double-clic pour terminer.' },
  { id: 'lasso',    icon: '🔵', label: 'Lasso libre',       tip: 'Tracez un contour : tout l\'extérieur sera effacé' },
  { id: 'magic',    icon: '🪄', label: 'Baguette',          tip: 'Efface les pixels de couleur similaire' },
  { id: 'erase',    icon: '🖌',  label: 'Gomme',             tip: 'Efface tout ce que le pinceau touche' },
  { id: 'restore',  icon: '🔄',  label: 'Restaurer',         tip: 'Remet les pixels originaux' },
]

const canvas   = ref(null)
const overlay  = ref(null)
const wrapEl   = ref(null)
const ready    = ref(false)
const mode     = ref('maglasso')
const brushSize   = ref(30)
const tolerance   = ref(40)
const snapRadius  = ref(12)
const saving      = ref(false)
const drawing     = ref(false)
const canUndo     = ref(false)
const showCursor  = ref(false)
const cursorX     = ref(0)
const cursorY     = ref(0)
const lassoStatus = ref('')

const isLassoMode = computed(() => mode.value === 'lasso' || mode.value === 'maglasso')

let ctx = null, octx = null
let originalData = null
let workingData  = null
let edgeMap      = null   // Float32Array des gradients Sobel
let undoStack    = []
let scaleX = 1, scaleY = 1
let canvasOffX = 0, canvasOffY = 0
let rafId = null
// Lasso libre
let lassoPoints = []
// Lasso magnétique
let magAnchors = []       // ancres posées par l'utilisateur (coords canvas)
let magPreview = []       // chemin snappé en cours (ancre → curseur)
let magLastClick = 0      // timestamp pour détecter double-clic
let dragAnchorIdx = -1    // index de l'ancre en cours de déplacement (-1 = aucune)

const dispBrush = computed(() => brushSize.value / scaleX)
const CLOSE_RADIUS = 16   // px canvas : distance pour fermer le lasso

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
    edgeMap = computeSobel(originalData)
    refreshScale()
    ready.value = true
  }
  img.onerror = () => { ready.value = true }
  img.src = props.src
  document.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  document.removeEventListener('keydown', onKey)
})

// ── Échelle / coordonnées ────────────────────────────────────────────────────
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

// ── Détection de contours (Sobel) ────────────────────────────────────────────
function computeSobel(imgData) {
  const { data, width, height } = imgData
  const map = new Float32Array(width * height)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const g = (px, py) => {
        const i = (py * width + px) * 4
        return 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]
      }
      const gx = -g(x-1,y-1) + g(x+1,y-1) - 2*g(x-1,y) + 2*g(x+1,y) - g(x-1,y+1) + g(x+1,y+1)
      const gy = -g(x-1,y-1) - 2*g(x,y-1) - g(x+1,y-1) + g(x-1,y+1) + 2*g(x,y+1) + g(x+1,y+1)
      map[y * width + x] = Math.sqrt(gx*gx + gy*gy)
    }
  }
  return map
}

// Snap : trouve le pixel de plus fort gradient dans le rayon
function snapToEdge(px, py) {
  const W = canvas.value.width, H = canvas.value.height
  const r = snapRadius.value
  let bx = Math.round(px), by = Math.round(py), best = -1
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx*dx + dy*dy > r*r) continue
      const nx = Math.round(px+dx), ny = Math.round(py+dy)
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
      const v = edgeMap[ny * W + nx]
      if (v > best) { best = v; bx = nx; by = ny }
    }
  }
  return { x: bx, y: by }
}

// Chemin magnétique entre deux ancres : interpolation + snap de chaque point
function magneticPath(x0, y0, x1, y1) {
  const dist = Math.hypot(x1-x0, y1-y0)
  const steps = Math.max(2, Math.round(dist / 2))
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const bx = x0 + (x1-x0)*t, by = y0 + (y1-y0)*t
    pts.push(snapToEdge(bx, by))
  }
  return pts
}

// Chemin entre deux ancres, en collant au bord de l'image quand les deux
// extrémités sont sur le bord (le tracé suit alors le pourtour au lieu de
// rentrer dans l'image vers un contour à fort contraste).
function segmentPath(a, b) {
  if (isOnBorder(a) && isOnBorder(b)) {
    const W = canvas.value.width, H = canvas.value.height
    return [a, ...borderPath(a, b, W, H)]
  }
  return magneticPath(a.x, a.y, b.x, b.y)
}

// ── Snap au bord du canvas ─────────────────────────────────────────────────
const EDGE_SNAP = 22  // px canvas : distance de snap au bord (zone aimantée généreuse)

function snapToBorder(px, py) {
  const W = canvas.value.width, H = canvas.value.height
  let x = px, y = py
  const dists = [
    { edge: 'top',    d: py,    snap: () => ({ x: Math.max(0, Math.min(W, px)), y: 0 }) },
    { edge: 'bottom', d: H-py,  snap: () => ({ x: Math.max(0, Math.min(W, px)), y: H }) },
    { edge: 'left',   d: px,    snap: () => ({ x: 0, y: Math.max(0, Math.min(H, py)) }) },
    { edge: 'right',  d: W-px,  snap: () => ({ x: W, y: Math.max(0, Math.min(H, py)) }) },
  ]
  const nearest = dists.sort((a, b) => a.d - b.d)[0]
  if (nearest.d <= EDGE_SNAP) return { ...nearest.snap(), onBorder: true }
  return { x: px, y: py, onBorder: false }
}

function isOnBorder(pt) {
  const W = canvas.value.width, H = canvas.value.height
  return pt.x <= 1 || pt.y <= 1 || pt.x >= W - 1 || pt.y >= H - 1
}

// ── Complétion par le périmètre entre deux points de bord ──────────────────
// Position sur le périmètre (sens horaire depuis coin supérieur gauche)
function perimPos(x, y, W, H) {
  if (y <= 1) return x                  // bord haut
  if (x >= W - 1) return W + y          // bord droit
  if (y >= H - 1) return W + H + (W-x) // bord bas
  return 2*W + H + (H-y)               // bord gauche
}

function perimPoint(pos, W, H) {
  const P = 2*(W+H)
  pos = ((pos % P) + P) % P
  if (pos <= W) return { x: pos, y: 0 }
  pos -= W; if (pos <= H) return { x: W, y: pos }
  pos -= H; if (pos <= W) return { x: W-pos, y: H }
  return { x: 0, y: H-(pos-W) }
}

function borderPath(p1, p2, W, H) {
  const P = 2*(W+H)
  const pos1 = perimPos(p1.x, p1.y, W, H)
  const pos2 = perimPos(p2.x, p2.y, W, H)
  let delta = pos2 - pos1
  // Choisir le chemin le plus court
  if (Math.abs(delta) > P/2) delta -= Math.sign(delta) * P
  const steps = Math.max(2, Math.round(Math.abs(delta) / 4))
  const pts = []
  for (let i = 1; i <= steps; i++) pts.push(perimPoint(pos1 + delta*(i/steps), W, H))
  return pts
}

// ── Overlay lasso ─────────────────────────────────────────────────────────────
function drawOverlay() {
  const o = overlay.value
  if (!o || !octx) return
  octx.clearRect(0, 0, o.width, o.height)

  // Zones aimantées des bords (toujours visibles en lasso magnétique)
  if (mode.value === 'maglasso') {
    const W = o.width, H = o.height
    const band = EDGE_SNAP
    octx.save()
    octx.fillStyle = 'rgba(56,150,255,0.13)'
    octx.fillRect(0, 0, W, band)               // haut
    octx.fillRect(0, H-band, W, band)          // bas
    octx.fillRect(0, 0, band, H)               // gauche
    octx.fillRect(W-band, 0, band, H)          // droite
    octx.restore()
  }

  const allPoints = mode.value === 'maglasso'
    ? [...magAnchors.flatMap((a, i) => i === 0 ? [a] : segmentPath(magAnchors[i-1], a)), ...magPreview]
    : lassoPoints

  if (allPoints.length < 2) return

  octx.save()
  octx.strokeStyle = mode.value === 'maglasso' ? '#f90' : '#00d0d0'
  octx.lineWidth = 1.5
  octx.setLineDash([5, 4])
  octx.beginPath()
  octx.moveTo(allPoints[0].x, allPoints[0].y)
  for (let i = 1; i < allPoints.length; i++) octx.lineTo(allPoints[i].x, allPoints[i].y)
  octx.stroke()

  // Points d'ancre
  if (mode.value === 'maglasso') {
    octx.setLineDash([])
    // Halo "bord actif" sur le périmètre si le premier ancre est sur un bord
    if (magAnchors.length > 0 && isOnBorder(magAnchors[0])) {
      const W = o.width, H = o.height
      octx.strokeStyle = 'rgba(0,200,100,0.4)'
      octx.lineWidth = 6
      octx.strokeRect(1, 1, W-2, H-2)
    }
    for (let i = 0; i < magAnchors.length; i++) {
      const a = magAnchors[i]
      const isDragging = dragAnchorIdx === i
      octx.beginPath()
      octx.arc(a.x, a.y, isDragging ? 6 : 4, 0, Math.PI*2)
      octx.fillStyle = isDragging ? '#f90' : '#fff'
      octx.fill()
      octx.strokeStyle = '#f90'
      octx.lineWidth = isDragging ? 2.5 : 1.5
      octx.stroke()
    }
    // Indicateur de fermeture
    if (magAnchors.length > 1) {
      const first = magAnchors[0]
      const lastPt = magPreview[magPreview.length-1] || magAnchors[magAnchors.length-1]
      const dist = Math.hypot(lastPt.x - first.x, lastPt.y - first.y)
      if (dist < CLOSE_RADIUS) {
        octx.beginPath()
        octx.arc(first.x, first.y, CLOSE_RADIUS, 0, Math.PI*2)
        octx.strokeStyle = '#0f0'
        octx.lineWidth = 2
        octx.stroke()
      }
    }
  }
  octx.restore()
}

// Applique le lasso (destination-in) depuis un tableau de points
function applyLassoPoints(points) {
  if (points.length < 3) return
  const W = canvas.value.width, H = canvas.value.height
  const mask = document.createElement('canvas')
  mask.width = W; mask.height = H
  const mctx = mask.getContext('2d')
  mctx.fillStyle = '#000'
  mctx.fillRect(0, 0, W, H)
  mctx.fillStyle = '#fff'
  mctx.beginPath()
  mctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) mctx.lineTo(points[i].x, points[i].y)
  mctx.closePath()
  mctx.fill()
  const maskData = mctx.getImageData(0, 0, W, H).data
  const d = workingData.data
  for (let i = 0; i < d.length; i += 4) {
    if (maskData[i] === 0) d[i+3] = 0
  }
  ctx.putImageData(workingData, 0, 0)
  octx.clearRect(0, 0, W, H)
}

// Projette un point sur le bord le plus proche du canvas, quelle que soit la distance.
function projectToBorder(pt) {
  const W = canvas.value.width, H = canvas.value.height
  const cands = [
    { x: Math.max(0, Math.min(W, pt.x)), y: 0, d: pt.y },
    { x: Math.max(0, Math.min(W, pt.x)), y: H, d: H - pt.y },
    { x: 0, y: Math.max(0, Math.min(H, pt.y)), d: pt.x },
    { x: W, y: Math.max(0, Math.min(H, pt.y)), d: W - pt.x },
  ].sort((a, b) => a.d - b.d)[0]
  return { x: cands.x, y: cands.y }
}

function closeMagLasso() {
  if (magAnchors.length < 2) { magAnchors = []; magPreview = []; drawOverlay(); return }
  pushUndo()
  const W = canvas.value.width, H = canvas.value.height
  const fullPath = []
  for (let i = 1; i < magAnchors.length; i++) {
    fullPath.push(...segmentPath(magAnchors[i-1], magAnchors[i]))
  }
  const first = magAnchors[0], last = magAnchors[magAnchors.length-1]
  // Vêtement qui déborde : dès qu'UNE extrémité touche un bord, on complète par le
  // périmètre. L'autre extrémité est projetée sur le bord le plus proche au besoin.
  if (isOnBorder(first) || isOnBorder(last)) {
    const a = isOnBorder(last)  ? last  : projectToBorder(last)
    const b = isOnBorder(first) ? first : projectToBorder(first)
    fullPath.push(...borderPath(a, b, W, H))
  } else {
    fullPath.push(...magneticPath(last.x, last.y, first.x, first.y))
  }
  applyLassoPoints(fullPath)
  magAnchors = []; magPreview = []; lassoStatus.value = ''
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
  rafId = requestAnimationFrame(() => { rafId = null; ctx.putImageData(workingData, 0, 0) })
}

// ── Pinceaux ─────────────────────────────────────────────────────────────────
function applyMagic(px, py) {
  const ix = Math.round(px), iy = Math.round(py)
  const W = workingData.width, H = workingData.height
  if (ix < 0 || iy < 0 || ix >= W || iy >= H) return
  const d = workingData.data
  const base = (iy * W + ix) * 4
  if (d[base+3] === 0) return
  const [sr, sg, sb] = [d[base], d[base+1], d[base+2]]
  const r = brushSize.value, rr = r*r, tol = tolerance.value
  const x0 = Math.max(0, ix-r), y0 = Math.max(0, iy-r)
  const x1 = Math.min(W-1, ix+r), y1 = Math.min(H-1, iy+r)
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if ((x-ix)*(x-ix)+(y-iy)*(y-iy) > rr) continue
      const i = (y*W+x)*4
      if (d[i+3] === 0) continue
      const dr = d[i]-sr, dg = d[i+1]-sg, db = d[i+2]-sb
      if (Math.sqrt(dr*dr+dg*dg+db*db) <= tol) d[i+3] = 0
    }
  }
  scheduleFlush()
}

function applyErase(px, py) {
  const W = workingData.width, H = workingData.height, d = workingData.data
  const r = brushSize.value, rr = r*r
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

function applyRestore(px, py) {
  const W = workingData.width, H = workingData.height
  const d = workingData.data, o = originalData.data
  const r = brushSize.value, rr = r*r
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

function paint(px, py) {
  if (mode.value === 'magic')   applyMagic(px, py)
  else if (mode.value === 'erase')   applyErase(px, py)
  else if (mode.value === 'restore') applyRestore(px, py)
}

const DRAG_RADIUS   = 10  // px canvas : rayon de détection pour saisir une ancre
const INSERT_RADIUS = 12  // px canvas : rayon de détection pour insérer sur un segment

function nearestAnchor(x, y) {
  let best = -1, bestD = Infinity
  for (let i = 0; i < magAnchors.length; i++) {
    const d = Math.hypot(x - magAnchors[i].x, y - magAnchors[i].y)
    if (d < DRAG_RADIUS && d < bestD) { best = i; bestD = d }
  }
  return best
}

// Trouve le segment le plus proche du point (x,y) parmi les segments du tracé.
// Retourne { segIdx, t } où segIdx est l'index de l'ancre de départ du segment,
// et t la position interpolée sur ce segment (pour placer la nouvelle ancre).
function nearestSegment(x, y) {
  if (magAnchors.length < 2) return null
  let bestSegIdx = -1, bestD = Infinity, bestT = 0
  for (let i = 0; i < magAnchors.length - 1; i++) {
    const a = magAnchors[i], b = magAnchors[i+1]
    // Point le plus proche sur le segment a→b
    const dx = b.x-a.x, dy = b.y-a.y
    const len2 = dx*dx + dy*dy
    if (len2 === 0) continue
    const t = Math.max(0, Math.min(1, ((x-a.x)*dx + (y-a.y)*dy) / len2))
    const px = a.x + t*dx, py = a.y + t*dy
    const d = Math.hypot(x-px, y-py)
    if (d < INSERT_RADIUS && d < bestD) { bestD = d; bestSegIdx = i; bestT = t }
  }
  if (bestSegIdx < 0) return null
  return { segIdx: bestSegIdx, t: bestT }
}

// ── Événements ───────────────────────────────────────────────────────────────
function setMode(m) {
  mode.value = m
  magAnchors = []; magPreview = []; lassoPoints = []; dragAnchorIdx = -1
  if (octx && overlay.value) octx.clearRect(0, 0, overlay.value.width, overlay.value.height)
  lassoStatus.value = m === 'maglasso' ? 'Cliquez pour poser des ancres le long du contour' : ''
  drawing.value = false
  if (m === 'maglasso') drawOverlay()  // afficher d'emblée les zones aimantées des bords
}

function onKey(e) {
  if (e.key === 'Escape') {
    if (mode.value === 'maglasso') { magAnchors = []; magPreview = []; drawOverlay(); lassoStatus.value = '' }
    else if (mode.value === 'lasso') { lassoPoints = []; drawOverlay() }
  }
  if (e.key === 'Enter' && mode.value === 'maglasso') closeMagLasso()
}

function onDown(e) {
  refreshScale()
  const { x, y } = toCanvas(e.clientX, e.clientY)

  // ── Lasso magnétique : poser une ancre ou déplacer une existante ──────────
  if (mode.value === 'maglasso') {
    const now = Date.now()

    // Clic sur une ancre existante → déplacement
    const nearIdx = nearestAnchor(x, y)
    if (nearIdx >= 0) {
      dragAnchorIdx = nearIdx
      lassoStatus.value = '✥ Déplacez l\'ancre'
      return
    }

    // Double-clic → fermer
    if (now - magLastClick < 350 && magAnchors.length > 1) { closeMagLasso(); return }
    magLastClick = now

    // Clic sur un segment existant → insérer une ancre entre les deux points
    const seg = nearestSegment(x, y)
    if (seg) {
      const a = magAnchors[seg.segIdx], b = magAnchors[seg.segIdx+1]
      const ix = a.x + (b.x-a.x)*seg.t, iy = a.y + (b.y-a.y)*seg.t
      const borderSnap = snapToBorder(ix, iy)
      const snapped = borderSnap.onBorder ? borderSnap : snapToEdge(ix, iy)
      magAnchors.splice(seg.segIdx+1, 0, snapped)
      dragAnchorIdx = seg.segIdx+1  // permettre de le déplacer immédiatement
      magPreview = []
      lassoStatus.value = '✥ Déplacez la nouvelle ancre'
      drawOverlay()
      return
    }

    // Clic près du premier ancre → s'y accrocher (sans fermer).
    // La fermeture se fait uniquement au double-clic / Entrée / clic sur le bouton.
    if (magAnchors.length > 1) {
      const first = magAnchors[0]
      if (Math.hypot(x - first.x, y - first.y) < CLOSE_RADIUS) {
        // Pose une ancre exactement sur le premier point (jointure aimantée)
        magAnchors.push({ x: first.x, y: first.y, onBorder: first.onBorder })
        magPreview = []
        lassoStatus.value = '🔗 Rejoint le départ — double-cliquez pour fermer'
        drawOverlay()
        return
      }
    }
    // Snap au bord du canvas si le curseur est proche
    const borderSnap = snapToBorder(x, y)
    const snapped = borderSnap.onBorder ? borderSnap : snapToEdge(x, y)
    magAnchors.push(snapped)
    magPreview = []
    lassoStatus.value = magAnchors.length === 1
      ? 'Cliquez le long du contour · le tracé colle au bord de l\'image'
      : 'Double-clic ou Entrée pour fermer'
    drawOverlay()
    return
  }

  // ── Lasso libre ──────────────────────────────────────────────────────────
  if (mode.value === 'lasso') {
    pushUndo()
    lassoPoints = [{ x, y }]
    drawing.value = true
    return
  }

  // ── Pinceaux ──────────────────────────────────────────────────────────────
  pushUndo()
  drawing.value = true
  paint(x, y)
}

function onMove(e) {
  updateCursor(e.clientX, e.clientY)
  const { x, y } = toCanvas(e.clientX, e.clientY)

  if (mode.value === 'maglasso') {
    // Déplacement d'ancre en cours
    if (dragAnchorIdx >= 0) {
      const borderSnap = snapToBorder(x, y)
      magAnchors[dragAnchorIdx] = borderSnap.onBorder ? borderSnap : snapToEdge(x, y)
      magPreview = []
      drawOverlay()
      return
    }
    if (!magAnchors.length) {
      // Changer curseur si on est près d'une ancre (zone de drag)
      return
    }
    const last = magAnchors[magAnchors.length - 1]
    const W = canvas.value.width, H = canvas.value.height
    // Hint si on survole une ancre ou un segment existant
    const nearIdx = nearestAnchor(x, y)
    if (nearIdx >= 0) {
      lassoStatus.value = '✥ Cliquez pour déplacer cette ancre'
      drawOverlay()
      return
    }
    const seg = nearestSegment(x, y)
    if (seg) {
      lassoStatus.value = '＋ Cliquez pour ajouter une ancre ici'
      drawOverlay()
      return
    }
    // Snap bord pour la preview aussi ; colle au bord si départ et cible y sont
    const borderSnap = snapToBorder(x, y)
    const target = borderSnap.onBorder ? borderSnap : { x, y, onBorder: false }
    magPreview = segmentPath(last, target)
    // Fermeture proche du premier ancre
    if (magAnchors.length > 1) {
      const first = magAnchors[0]
      const closeByAnchor = Math.hypot(target.x - first.x, target.y - first.y) < CLOSE_RADIUS
      const closeByBorder = borderSnap.onBorder && isOnBorder(first)
      if (closeByAnchor) lassoStatus.value = '🔗 Cliquez pour rejoindre le départ · double-clic pour fermer'
      else if (closeByBorder) {
        lassoStatus.value = '🟢 Cliquez — fermeture par le bord du cadre'
        magPreview = [...magneticPath(last.x, last.y, borderSnap.x, borderSnap.y),
                      ...borderPath(borderSnap, first, W, H)]
      } else {
        lassoStatus.value = isOnBorder(first) ? 'Retournez sur le bord pour fermer automatiquement' : 'Double-clic ou Entrée pour fermer'
      }
    }
    drawOverlay()
    return
  }

  if (mode.value === 'lasso') {
    if (!drawing.value) return
    lassoPoints.push({ x, y })
    drawOverlay()
    return
  }

  if (!drawing.value) return
  paint(x, y)
}

function onUp(e) {
  if (mode.value === 'maglasso' && dragAnchorIdx >= 0) {
    dragAnchorIdx = -1
    lassoStatus.value = magAnchors.length > 1 ? 'Double-clic ou Entrée pour fermer' : 'Cliquez pour poser des ancres'
    return
  }
  if (mode.value === 'lasso' && drawing.value) {
    if (lassoPoints.length > 3) {
      pushUndo()
      applyLassoPoints(lassoPoints)
    }
    lassoPoints = []
  }
  drawing.value = false
}

function onDblClick(e) {
  if (mode.value === 'maglasso' && magAnchors.length > 2) closeMagLasso()
}

function onTouchStart(e) {
  refreshScale()
  const t = e.touches[0]
  const { x, y } = toCanvas(t.clientX, t.clientY)
  if (mode.value === 'maglasso') {
    const snapped = snapToEdge(x, y)
    magAnchors.push(snapped); magPreview = []; drawOverlay(); return
  }
  if (mode.value === 'lasso') {
    pushUndo(); lassoPoints = [{ x, y }]; drawing.value = true; return
  }
  pushUndo(); drawing.value = true; paint(x, y)
}

function onTouchMove(e) {
  if (!drawing.value) return
  const t = e.touches[0]
  const { x, y } = toCanvas(t.clientX, t.clientY)
  if (mode.value === 'lasso') { lassoPoints.push({ x, y }); drawOverlay(); return }
  if (mode.value === 'maglasso') {
    if (!magAnchors.length) return
    const last = magAnchors[magAnchors.length-1]
    magPreview = magneticPath(last.x, last.y, x, y)
    drawOverlay(); return
  }
  paint(x, y)
}

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
.eraser-overlay {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  cursor: crosshair;
}

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
  pointer-events: none; white-space: nowrap;
}

.eraser-toolbar {
  padding: 10px 14px; border-top: 1px solid #eee;
  display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end;
  background: #f8f8f8; flex-shrink: 0;
}
.tool-col { display: flex; flex-direction: column; gap: 5px; }
.tool-col-actions { margin-left: auto; gap: 6px; }
.tool-label { font-size: 0.72em; text-transform: uppercase; letter-spacing: .05em; color: #999; font-weight: 700; }
.tool-row { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; }
.tool-range { width: 90px; accent-color: var(--primary-teal); }

.mode-btn {
  padding: 5px 11px; border-radius: 16px;
  border: 1.5px solid #d0d0d0; background: #fff;
  font-size: .82em; font-weight: 600; cursor: pointer;
  font-family: inherit; color: #444; transition: all .15s;
  white-space: nowrap;
}
.mode-btn:hover { border-color: var(--primary-teal); color: var(--primary-teal); }
.mode-btn.active.mode-maglasso { background: #d97706; color:#fff; border-color:#d97706; }
.mode-btn.active.mode-lasso    { background: #7c3aed; color:#fff; border-color:#7c3aed; }
.mode-btn.active.mode-magic    { background: #e07b00; color:#fff; border-color:#e07b00; }
.mode-btn.active.mode-erase    { background: var(--primary-teal); color:#fff; border-color:var(--primary-teal); }
.mode-btn.active.mode-restore  { background: #2563eb; color:#fff; border-color:#2563eb; }

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

.tool-col-sliders {
  background: #f0f0f0; border-radius: 10px; padding: 7px 10px;
  display: flex; flex-direction: column; gap: 5px;
}
.slider-row {
  display: flex; align-items: center; gap: 8px; white-space: nowrap;
}
.slider-row .tool-label { min-width: 130px; margin: 0; }
.slider-row .tool-range { width: 90px; }
</style>
