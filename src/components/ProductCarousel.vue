<template>
  <div class="gallery-container">
    <h2>Galerie photos</h2>
    <p class="subtitle">Cliquez sur une photo pour la voir en grand</p>
    
    <div class="gallery-filter">
      <button
        @click="filter = 'boutique'"
        :class="{ active: filter === 'boutique' }"
        aria-label="Voir les photos de la boutique"
      >
        Boutique
      </button>
      <button
        @click="filter = 'articles'"
        :class="{ active: filter === 'articles' }"
        aria-label="Voir les photos des articles"
      >
        Articles
      </button>
    </div>

    <div class="search-row">
      <div class="search-field">
        <input type="search" v-model="filterQuery" placeholder="Rechercher (mot-clé/tag)" class="input-search" />
        <button v-if="filterQuery" class="search-clear" @click="filterQuery = ''" title="Effacer la recherche">✕</button>
      </div>
      <button class="btn-grid" @click="gridOpen = true" title="Ouvrir la vue en grille">🔳 Voir toutes les photos</button>
    </div>

    <swiper
      :modules="modules"
      :slides-per-view="1"
      :loop="images.length > 1"
      :autoplay="{ delay: 3500, disableOnInteraction: false }"
      :pagination="false"
      :navigation="images.length > 1"
      class="my-swiper"
      @swiper="onSwiper"
      @slideChange="onSlideChange"
    >
      <swiper-slide v-for="(img, idx) in images" :key="idx">
        <div class="slide-frame" @click="openModal(idx)">
          <img :src="img.src" :alt="img.alt" class="slide-image" :fetchpriority="idx === 0 ? 'high' : 'auto'" loading="lazy" decoding="async" width="600" height="500" @error="($event.target).src = '/placeholder.jpg'" />
        </div>
      </swiper-slide>
    </swiper>
    <div class="swiper-pagination-fraction">
      {{ (currentIndex || 0) + 1 }} / {{ images.length || 1 }}
    </div>

    <div class="carousel-controls">
      <button class="pause-btn" @click="togglePause" :aria-label="isPaused ? 'Reprendre' : 'Pause'">
        {{ isPaused ? '▶' : '⏸' }}
      </button>
    </div>

    <Modal v-model:modelValue="modalOpen" @close="closeModal">
      <div class="modal-content" @click.stop>
        <img v-if="logo" :src="logo" alt="Logo La P'tite Boutik Solidaire" class="modal-logo" />
        <button class="modal-nav modal-prev" @click="prevModal" aria-label="Précédente">‹</button>
        <button class="modal-nav modal-next" @click="nextModal" aria-label="Suivante">›</button>
        <div class="modal-img-wrap" ref="imgWrap">
          <div v-if="modalLoading" class="modal-spinner"></div>
          <div class="modal-image-outer">
            <img
              :src="images[modalIndex].fullSrc"
              :alt="images[modalIndex].alt"
              class="modal-image"
            :class="{ loading: modalLoading, interactive: enableMagnifier, zoomed: zoomFactor > 1 }"
              decoding="async"
              @load="modalLoading = false"
              @error="modalLoading = false"
              @pointerdown.prevent="onPointerDown"
              @wheel.prevent="onWheel"
              ref="modalImg"
            :style="{ transform: `scale(${zoomFactor}) translate(${(transformX/zoomFactor).toFixed(2)}px, ${(transformY/zoomFactor).toFixed(2)}px)`, transition: dragging ? 'none' : 'transform 150ms ease' }"
          />
          </div>

          <!-- elegant zoom controls: toggle + / - -->
          <div class="zoom-controls">
            <button class="zoom-toggle" @click.stop.prevent="toggleEnableMagnifier" :aria-pressed="enableMagnifier" :title="enableMagnifier ? 'Désactiver la loupe' : 'Activer la loupe'">🔎</button>
            <button v-if="enableMagnifier" class="zoom-small" @click.stop.prevent="zoomOut" title="-" aria-label="Dézoomer">−</button>
            <button v-if="enableMagnifier" class="zoom-small" @click.stop.prevent="zoomIn" title="+" aria-label="Zoomer">+</button>
          </div>
          <!-- joystick removed (replaced by direct pan & hint animation) -->
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-top:12px">
          <p class="modal-caption" style="margin:0">{{ images[modalIndex].alt }}</p>
          <p class="modal-counter" style="margin:0">{{ modalIndex + 1 }} / {{ images.length }}</p>
        </div>
      </div>
    </Modal>

    <!-- Grid modal view -->
    <div class="grid-overlay" v-if="gridOpen" @click.self="gridOpen = false">
      <div class="grid-content">
        <button class="grid-close" @click="gridOpen = false">✕</button>
        <div class="grid-search-row">
          <div class="search-field" style="width:100%">
            <input type="search" v-model="filterQuery" placeholder="Filtrer (mot-clé/tag)" class="input-search full" />
            <button v-if="filterQuery" class="search-clear" @click="filterQuery = ''" title="Effacer la recherche">✕</button>
          </div>
        </div>
        <div class="grid-wrap">
          <template v-if="isFiltering">
            <!-- skeleton placeholders -->
            <div class="grid-item skeleton" v-for="n in 8" :key="n">
              <div class="skeleton-thumb"></div>
              <div class="skeleton-caption"></div>
            </div>
          </template>
          <template v-else-if="baseImagesFiltered && baseImagesFiltered.length">
            <div class="grid-item" v-for="(img, i) in baseImagesFiltered" :key="i" @click="openFromGrid(i)">
              <img :src="img.thumb || img.src" :alt="img.alt" loading="lazy" decoding="async" width="320" height="240" />
              <div class="grid-caption">{{ img.alt }}</div>
            </div>
          </template>
          <div v-else class="empty-grid">Aucune photo trouvée pour "{{ filterQuery }}".</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watchEffect, watch } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase.js'
import logoUrl from '@/assets/logo.jpg'
import Modal from './Modal.vue'
import { nextTick } from 'vue'

const modules = [Autoplay, Pagination, Navigation]
const dynamicPhotos = ref([])

onMounted(() => {
  onSnapshot(
    query(collection(db, 'photos'), orderBy('createdAt')),
    snap => { dynamicPhotos.value = snap.docs.map(d => ({ id: d.id, ...d.data() })) },
    err => { console.warn('Firestore photos error:', err) }
  )
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})

function bgRemovalUrl(url, removeBg) {
  if (!removeBg || !url?.includes('cloudinary')) return url;
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.pathname.includes('/upload/')) {
      return url.replace('/upload/', '/upload/e_background_removal,f_auto/');
    }
    return url;
  } catch {
    return url; // Retourne l'URL originale si invalide
  }
}

const filter = ref('boutique') // 'boutique' ou 'articles'

// images before search filtering (respecting boutique/articles)
function cloudinaryTransform(url, transform) {
  if (!url || !url.includes('/upload/')) return url
  return url.replace('/upload/', `/upload/${transform}/`)
}

function thumbFor(url, removeBg) {
  if (!url) return url
  // prefer small, cropped, auto quality thumbnails
  const baseTransform = 'w_320,h_240,c_fill,f_auto,q_auto'
  if (removeBg) return cloudinaryTransform(url, `e_background_removal,${baseTransform}`)
  return cloudinaryTransform(url, baseTransform)
}

const baseImages = computed(() =>
  dynamicPhotos.value
    .filter(p => p.active && (
      // Articles: only photos that had background removal applied
      filter.value === 'articles' ? (p.removeBg === true)
      // Boutique: the rest (not background removed)
      : (p.removeBg !== true)
    ))
    .map(p => ({
      fullSrc: cloudinaryFullUrl(p.url, p.removeBg),
      src: cloudinaryCardUrl(p.url, p.removeBg),
      thumb: thumbFor(p.url, p.removeBg),
      alt: p.alt || '',
      tags: p.tags || []
    }))
)

function cloudinaryCardUrl(url, removeBg) {
  if (!url || !url.includes('/upload/')) return url
  const baseTransform = 'w_600,c_limit,f_auto,q_auto'
  if (removeBg) return url.replace('/upload/', `/upload/e_background_removal,${baseTransform}/`)
  return url.replace('/upload/', `/upload/${baseTransform}/`)
}

function cloudinaryFullUrl(url, removeBg) {
  if (!url || !url.includes('/upload/')) return url
  const baseTransform = 'w_1200,c_limit,f_auto,q_auto'
  if (removeBg) return url.replace('/upload/', `/upload/e_background_removal,${baseTransform}/`)
  return url.replace('/upload/', `/upload/${baseTransform}/`)
}

const filterQuery = ref('')
const isFiltering = ref(false)

// small debounce visually to show skeleton when search changes
let _filterTimer = null
watchEffect(() => {
  // read the ref to track it
  const _q = filterQuery.value
  isFiltering.value = true
  if (_filterTimer) clearTimeout(_filterTimer)
  _filterTimer = setTimeout(() => { isFiltering.value = false; _filterTimer = null }, 250)
})
onUnmounted(() => { if (_filterTimer) clearTimeout(_filterTimer) })

const baseImagesFiltered = computed(() => {
  const q = (filterQuery.value || '').trim().toLowerCase()
  if (!q) return baseImages.value
  return baseImages.value.filter(img => {
    if ((img.alt || '').toLowerCase().includes(q)) return true
    const tags = img.tags || []
    if (Array.isArray(tags)) return tags.some(t => (t || '').toLowerCase().includes(q))
    if (typeof tags === 'string') return tags.toLowerCase().includes(q)
    return false
  })
})

// final images shown in the carousel / grid — filtered by search (alt or tags)
const images = computed(() => {
  const q = (filterQuery.value || '').trim().toLowerCase()
  if (!q) return baseImages.value
  return baseImages.value.filter(img => {
    if ((img.alt || '').toLowerCase().includes(q)) return true
    const tags = img.tags || []
    if (Array.isArray(tags)) return tags.some(t => (t || '').toLowerCase().includes(q))
    if (typeof tags === 'string') return tags.toLowerCase().includes(q)
    return false
  })
})

const swiperInstance = ref(null)
const isPaused = ref(false)
const modalOpen = ref(false)
const modalIndex = ref(0)
const currentIndex = ref(0)
const gridOpen = ref(false)
const modalLoading = ref(false)
// magnifier state
const magnifierVisible = ref(false)
const enableMagnifier = ref(false)
const magnifierStyle = ref({})
const imgWrap = ref(null)
const modalImg = ref(null)

const zoomMin = 1
const zoomMax = 2.6
const zoomDuration = 6000 // ms to reach max
const zoomStepMs = 100
const zoomStep = (zoomMax - zoomMin) / (zoomDuration / zoomStepMs)
const zoomFactor = ref(1)
let _zoomTimer = null

// transform / pan state for full-image zoom (not circular lens)
const transformX = ref(0)
const transformY = ref(0)
const dragging = ref(false)
const _startPointer = { x: 0, y: 0 }
const _startTransform = { x: 0, y: 0 }

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

const onPointerMoveWindow = (e) => {
  if (!dragging.value || !modalImg.value) return
  const dx = e.clientX - _startPointer.x
  const dy = e.clientY - _startPointer.y
  // compute using displayed image size and current scale
  const rect = modalImg.value.getBoundingClientRect()
  const s = zoomFactor.value
  // rect.width is displayed width; scaled total width = rect.width * s
  const scaledW = rect.width * s
  const scaledH = rect.height * s
  // allowed visual translate range (in CSS-visible pixels)
  const minVisX = Math.min(0, (rect.width - scaledW))
  const minVisY = Math.min(0, (rect.height - scaledH))
  // internal transformX/Y values are stored in "internal" units where
  // the CSS uses translate(transformX/zoom). To move the visible image by dx pixels
  // we must update internal value by dx * zoom.
  const minInternalX = minVisX * s
  const minInternalY = minVisY * s
  transformX.value = clamp(_startTransform.x + dx * s, minInternalX, 0)
  transformY.value = clamp(_startTransform.y + dy * s, minInternalY, 0)
}

const onPointerUpWindow = (e) => {
  dragging.value = false
  // release pointer capture if present
  try {
    if (modalImg.value && typeof modalImg.value.releasePointerCapture === 'function' && _capturedPointerId) {
      modalImg.value.releasePointerCapture(_capturedPointerId)
    }
  } catch (err) { /* ignore */ }
  _capturedPointerId = null
  window.removeEventListener('pointermove', onPointerMoveWindow)
  window.removeEventListener('pointerup', onPointerUpWindow)
  // restore touch-action on image
  try { if (modalImg.value) modalImg.value.style.touchAction = '' } catch (e) {}
}

const lastTapTime = ref(0)
const onPointerDown = (e) => {
  if (!enableMagnifier.value) return
  // double-tap support for touch
  const now = Date.now()
  if (now - lastTapTime.value < 300) {
    // double tap: toggle zoom
    const rect = modalImg.value ? modalImg.value.getBoundingClientRect() : null
    const cx = rect ? e.clientX : 0
    const cy = rect ? e.clientY : 0
    if (zoomFactor.value === 1) {
      const next = Math.min(zoomMax, 1.8)
      const offsetX = rect ? cx - rect.left : 0
      const offsetY = rect ? cy - rect.top : 0
      // adjust transforms so the tapped point stays under the finger
      const prev = zoomFactor.value
      // visual translate before (Tvis_old) = transformX / prev
      const tvisOldX = prev ? transformX.value / prev : 0
      const tvisOldY = prev ? transformY.value / prev : 0
      const tvisNewX = tvisOldX + offsetX * (prev - next)
      const tvisNewY = tvisOldY + offsetY * (prev - next)
      zoomFactor.value = next
      // clamp using new zoom
      const scaledW2 = rect.width * next
      const scaledH2 = rect.height * next
      const minVisX2 = Math.min(0, rect.width - scaledW2)
      const minVisY2 = Math.min(0, rect.height - scaledH2)
      transformX.value = clamp(tvisNewX * next, minVisX2 * next, 0)
      transformY.value = clamp(tvisNewY * next, minVisY2 * next, 0)
    } else {
      zoomFactor.value = 1
      transformX.value = 0
      transformY.value = 0
    }
    lastTapTime.value = 0
    return
  }
  lastTapTime.value = now
  // only left button for pointer devices
  if (e.pointerType === 'mouse' && e.button !== 0) return
  dragging.value = true
  _startPointer.x = e.clientX
  _startPointer.y = e.clientY
  _startTransform.x = transformX.value
  _startTransform.y = transformY.value
  window.addEventListener('pointermove', onPointerMoveWindow)
  window.addEventListener('pointerup', onPointerUpWindow)
  // attempt to capture the pointer on the image so touch moves aren't stolen by scroll
  try {
    if (modalImg.value && typeof modalImg.value.setPointerCapture === 'function') {
      modalImg.value.setPointerCapture(e.pointerId)
      _capturedPointerId = e.pointerId
    }
  } catch (err) { /* ignore */ }
  // lock touch-action to prevent the browser handling the touch as page scroll while dragging
  try { if (modalImg.value) modalImg.value.style.touchAction = 'none' } catch (e) {}
}

// prevent the browser's touch scrolling when dragging the image
const applyTouchActionLock = (enable) => {
  try {
    if (!modalImg.value) return
    modalImg.value.style.touchAction = enable ? 'none' : ''
  } catch (e) {}
}

// Joystick state for mobile panning
const showJoystick = computed(() => {
  // only show when zoomed and small viewport
  return zoomFactor.value > 1 && window.innerWidth <= 700
})
// joystick removed; left the function updateKnob earlier to avoid breaking references
const updateKnob = (clientX, clientY) => {
  // noop now - joystick removed
}

// track captured pointer id for touch
let _capturedPointerId = null

const onWheel = (e) => {
  if (!enableMagnifier.value || !modalImg.value) return
  e.preventDefault()
  const delta = e.deltaY
  const prev = zoomFactor.value
  const step = 0.15
  const next = clamp(prev + (delta > 0 ? -step : step), zoomMin, zoomMax)
  if (next === prev) return
  // keep cursor point stable while zooming — compute using visual -> internal units
  const rect = modalImg.value.getBoundingClientRect()
  const offsetX = e.clientX - rect.left
  const offsetY = e.clientY - rect.top
  // compute Tvis_old (visual translate) and desired Tvis_new, then store internal = Tvis_new * next
  const tvisOldX = prev ? transformX.value / prev : 0
  const tvisOldY = prev ? transformY.value / prev : 0
  const tvisNewX = tvisOldX + offsetX * (prev - next)
  const tvisNewY = tvisOldY + offsetY * (prev - next)
  zoomFactor.value = next
  // clamp using new zoom
  const scaledW2 = rect.width * zoomFactor.value
  const scaledH2 = rect.height * zoomFactor.value
  const minVisX2 = Math.min(0, rect.width - scaledW2)
  const minVisY2 = Math.min(0, rect.height - scaledH2)
  transformX.value = clamp(tvisNewX * zoomFactor.value, minVisX2 * zoomFactor.value, 0)
  transformY.value = clamp(tvisNewY * zoomFactor.value, minVisY2 * zoomFactor.value, 0)
}

const startZoomRamp = () => {
  if (_zoomTimer) return
  _zoomTimer = setInterval(() => {
    zoomFactor.value = Math.min(zoomMax, zoomFactor.value + zoomStep)
    if (zoomFactor.value >= zoomMax && _zoomTimer) { clearInterval(_zoomTimer); _zoomTimer = null }
  }, zoomStepMs)
}
const stopZoomRamp = () => {
  if (_zoomTimer) { clearInterval(_zoomTimer); _zoomTimer = null }
  // reset quickly to min for now
  zoomFactor.value = zoomMin
}

// Deprecated circular lens handlers
const showMagnifier = (e) => {}
const hideMagnifier = (e) => {}
const toggleMagnifier = (e) => {}

const toggleEnableMagnifier = () => {
  enableMagnifier.value = !enableMagnifier.value
  if (!enableMagnifier.value) {
    // reset zoom and transform
    zoomFactor.value = 1
    transformX.value = 0
    transformY.value = 0
    dragging.value = false
    stopZoomRamp()
    return
  }
  // enabling: initialize zoom to a comfortable level and center image
  zoomFactor.value = Math.max(1.6, zoomMin)
  transformX.value = 0
  transformY.value = 0
}

const zoomIn = () => {
  if (!modalImg.value) { zoomFactor.value = Math.min(zoomMax, zoomFactor.value + 0.2); return }
  const prev = zoomFactor.value
  const next = Math.min(zoomMax, prev + 0.2)
  if (next === prev) return
  const rect = modalImg.value.getBoundingClientRect()
  const cx = lastPointer.value ? lastPointer.value.x : Math.round(rect.left + rect.width / 2)
  const cy = lastPointer.value ? lastPointer.value.y : Math.round(rect.top + rect.height / 2)
  const offsetX = cx - rect.left
  const offsetY = cy - rect.top
  // adjust transforms so the point remains under the cursor (visual -> internal units)
  const tvisOldX = prev ? transformX.value / prev : 0
  const tvisOldY = prev ? transformY.value / prev : 0
  const tvisNewX = tvisOldX + offsetX * (prev - next)
  const tvisNewY = tvisOldY + offsetY * (prev - next)
  zoomFactor.value = next
  // clamp using new zoom
  const scaledW = rect.width * zoomFactor.value
  const scaledH = rect.height * zoomFactor.value
  const minVisX2 = Math.min(0, rect.width - scaledW)
  const minVisY2 = Math.min(0, rect.height - scaledH)
  transformX.value = clamp(tvisNewX * zoomFactor.value, minVisX2 * zoomFactor.value, 0)
  transformY.value = clamp(tvisNewY * zoomFactor.value, minVisY2 * zoomFactor.value, 0)
}
const zoomOut = () => {
  if (!modalImg.value) { zoomFactor.value = Math.max(zoomMin, zoomFactor.value - 0.2); return }
  const prev = zoomFactor.value
  const next = Math.max(zoomMin, prev - 0.2)
  if (next === prev) return
  const rect = modalImg.value.getBoundingClientRect()
  const cx = lastPointer.value ? lastPointer.value.x : Math.round(rect.left + rect.width / 2)
  const cy = lastPointer.value ? lastPointer.value.y : Math.round(rect.top + rect.height / 2)
  const offsetX = cx - rect.left
  const offsetY = cy - rect.top
  const tvisOldX = prev ? transformX.value / prev : 0
  const tvisOldY = prev ? transformY.value / prev : 0
  const tvisNewX = tvisOldX + offsetX * (prev - next)
  const tvisNewY = tvisOldY + offsetY * (prev - next)
  zoomFactor.value = next
  const scaledW2 = rect.width * zoomFactor.value
  const scaledH2 = rect.height * zoomFactor.value
  const minVisX2 = Math.min(0, rect.width - scaledW2)
  const minVisY2 = Math.min(0, rect.height - scaledH2)
  transformX.value = clamp(tvisNewX * zoomFactor.value, minVisX2 * zoomFactor.value, 0)
  transformY.value = clamp(tvisNewY * zoomFactor.value, minVisY2 * zoomFactor.value, 0)
}

// pointer move handler for circular magnifier (deprecated) - kept for reference
const onMagnifierMove = (e) => {
  // no-op: lens behavior replaced by full-image zoom and pan handlers
}

// store last pointer position so +/- buttons update the lens immediately
const lastPointer = ref(null)

const computeMagnifierAt = (clientX, clientY) => {
  if (!modalImg.value) return
  const img = modalImg.value
  const rect = img.getBoundingClientRect()
  const x = clientX - rect.left
  const y = clientY - rect.top
  const rx = Math.max(0, Math.min(rect.width, x))
  const ry = Math.max(0, Math.min(rect.height, y))
  const size = Math.min(160, Math.max(120, Math.floor(window.innerWidth / 12)))
  const margin = 8
  const leftRaw = clientX - size / 2
  const topRaw = clientY - size / 2
  const left = Math.max(margin, Math.min(window.innerWidth - size - margin, leftRaw))
  const top = Math.max(margin, Math.min(window.innerHeight - size - margin, topRaw))
  const zoom = zoomFactor.value || 2
  const bgWidth = Math.round(rect.width * zoom)
  const bgHeight = Math.round(rect.height * zoom)
  const posX = Math.round(-(rx * zoom - size / 2))
  const posY = Math.round(-(ry * zoom - size / 2))
  magnifierStyle.value = {
    width: size + 'px',
    height: size + 'px',
    left: left + 'px',
    top: top + 'px',
    backgroundImage: `url(${img.src})`,
    backgroundSize: `${bgWidth}px ${bgHeight}px`,
    backgroundPosition: `${posX}px ${posY}px`
  }
}

// magnifier pane style (a small preview box inside the modal to the right)
const magnifierPaneStyle = ref({})
const updateMagnifierPane = (e) => {
  // deprecated: using lens that follows pointer instead
}
const logo = logoUrl
const overlayVariant = ref(1) // 1: subtle, 2: stronger coral
const logoSmall = ref(false)

const toggleOverlayVariant = () => { overlayVariant.value = overlayVariant.value === 1 ? 2 : 1 }
const toggleLogoSize = () => { logoSmall.value = !logoSmall.value }

// Fallback image for broken links
const placeholderImage = '/placeholder.jpg'

function preloadImage(src) {
  if (!src || src === placeholderImage) return
  const img = new Image()
  img.src = src
}

function preloadAdjacent(idx, list) {
  if (!list || !list.length) return
  const n = list.length
  for (const offset of [1, 2, -1, -2]) {
    const i = (idx + offset + n) % n
    if (list[i]?.fullSrc) preloadImage(list[i].fullSrc)
  }
}

// preload first N images when photos load
watch(dynamicPhotos, (photos) => {
  if (photos.length > 0) {
    // small delay to not block rendering
    setTimeout(() => {
      const imgs = images.value || []
      for (let i = 0; i < Math.min(imgs.length, 4); i++) {
        preloadImage(imgs[i]?.src)
        if (imgs[i]?.fullSrc) preloadImage(imgs[i].fullSrc)
      }
    }, 200)
  }
})

const onSwiper = (swiper) => {
  swiperInstance.value = swiper
  // initialize the custom counter
  currentIndex.value = typeof swiper.realIndex !== 'undefined' ? swiper.realIndex : (typeof swiper.activeIndex !== 'undefined' ? swiper.activeIndex : 0)
}

const togglePause = () => {
  if (!swiperInstance.value) return
  isPaused.value = !isPaused.value
  if (isPaused.value) {
    swiperInstance.value.autoplay.stop()
  } else {
    swiperInstance.value.autoplay.start()
  }
}

const openModal = (idx) => {
  modalIndex.value = idx
  currentIndex.value = idx
  modalOpen.value = true
  modalLoading.value = true
  // if the image was preloaded, consider it loaded immediately for UX
  const img = images[modalIndex.value]
  if (img && img.fullSrc) {
    const test = new Image()
    test.src = img.fullSrc
    if (test.complete) modalLoading.value = false
  }
  // ensure modal image fits well on large desktop screens by capping fullSrc transform
  preloadAdjacent(idx, images.value)
  // enable magnifier on large viewports
  enableMagnifier.value = window.innerWidth > 900
  // reset zoom/transform for the new image
  zoomFactor.value = 1
  transformX.value = 0
  transformY.value = 0
}

const openFromGrid = (idx) => {
  // open modal from the grid — grid shows baseImagesFiltered
  const clicked = baseImagesFiltered.value[idx]
  const targetIndex = images.value.findIndex(i => i.src === clicked.src)
  if (targetIndex !== -1) {
    openModal(targetIndex)
  } else {
    // fallback: open modal at first
    openModal(0)
  }
  gridOpen.value = false
}

const closeModal = () => {
  modalOpen.value = false
  document.body.style.overflow = ''
}

const prevModal = () => {
  modalIndex.value = (modalIndex.value - 1 + images.value.length) % images.value.length
  currentIndex.value = modalIndex.value
  modalLoading.value = true
  preloadAdjacent(modalIndex.value, images.value)
  // reset transforms
  zoomFactor.value = 1
  transformX.value = 0
  transformY.value = 0
}

const nextModal = () => {
  modalIndex.value = (modalIndex.value + 1) % images.value.length
  currentIndex.value = modalIndex.value
  modalLoading.value = true
  preloadAdjacent(modalIndex.value, images.value)
  // reset transforms
  zoomFactor.value = 1
  transformX.value = 0
  transformY.value = 0
}

const onKeydown = (e) => {
  if (!modalOpen.value) return
  if (e.key === 'Escape') closeModal()
  if (e.key === 'ArrowLeft') prevModal()
  if (e.key === 'ArrowRight') nextModal()
}

// keep the custom counter in sync when the swiper changes slides
const onSlideChange = (e) => {
  // Swiper emits the swiper instance as the event argument
  const s = e && e.realIndex !== undefined ? e : swiperInstance.value
  if (!s) return
  currentIndex.value = typeof s.realIndex !== 'undefined' ? s.realIndex : (typeof s.activeIndex !== 'undefined' ? s.activeIndex : 0)
  // preload full resolution of current and next slides for modal
  const imgs = images.value
  if (imgs && imgs.length) {
    const idx = currentIndex.value
    for (const offset of [0, 1, -1]) {
      const i = (idx + offset + imgs.length) % imgs.length
      if (imgs[i]?.fullSrc) preloadImage(imgs[i].fullSrc)
    }
  }
}
</script>

<style scoped>
.gallery-container {
  background: linear-gradient(135deg, #FFF9F0 0%, #F5E6D3 100%);
  padding: 25px;
  border-radius: 12px;
  margin: 20px 0;
  border: 2px solid var(--secondary-beige);
}

@media (max-width: 600px) {
  .gallery-container {
    padding: 15px;
    margin: 12px 0;
  }
}

.gallery-container h2 {
  color: var(--primary-teal);
  margin-bottom: 8px;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: var(--text-gray);
  margin-bottom: 20px;
  font-size: 0.9em;
  font-style: italic;
}

.my-swiper {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 40px;
}

@media (max-width: 600px) {
  .my-swiper {
    max-width: 100%;
    padding-bottom: 30px;
  }
}

:deep(.swiper-pagination-bullet-active) {
  background: var(--primary-teal);
}

:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
  color: var(--primary-teal);
  background: rgba(255,255,255,0.85);
  width: 34px;
  height: 34px;
  border-radius: 50%;
}

:deep(.swiper-button-next:after),
:deep(.swiper-button-prev:after) {
  font-size: 16px;
  font-weight: bold;
}

.slide-frame {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  /* keep animations light to improve frame rate */
  transition: transform 0.12s ease;
  border-radius: 10px;
  overflow: hidden;
  width: 100%;
  height: calc(var(--vh, 1vh) * 60);
  max-height: 500px;
}

@media (max-width: 600px) {
  .slide-frame {
    height: calc(var(--vh, 1vh) * 40);
    max-height: 320px;
  }
}

.slide-frame:hover {
  /* minimal transform to avoid layout jank; GPU hinting below */
  transform: translateZ(0) scale(1.008);
}

.slide-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.carousel-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.pause-btn {
  background: none;
  border: 2px solid var(--primary-teal);
  color: var(--primary-teal);
  border-radius: 50%;
  width: 34px;
  height: 34px;
  cursor: pointer;
  font-size: 0.85em;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pause-btn:hover {
  background: var(--primary-teal);
  color: white;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  /* subtle coral tint at the top fading to a dark backdrop for good contrast */
  background: linear-gradient(135deg, rgba(233,94,94,0.08) 0%, rgba(10,10,10,0.88) 100%);
  z-index: 1000;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  cursor: pointer;
}

.modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 900px;
  margin: 30px auto;
  cursor: default;
  background-color: rgb(245, 230, 211); /* warm beige */
  padding: 18px;
  border-radius: 12px;
  color: var(--text-dark);
}

  /* modal shows the brand logo (small) but not control text labels; keep styling for logo */
.modal-logo {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 56px;
  height: auto;
  border-radius: 6px;
  opacity: 0.95;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 12;
}

.modal-logo.small { width: 36px; opacity: 0.95 }

.modal-close:hover {
  background: #d14545;
  transform: scale(1.1);
}

/* bottom close button removed — only top close (✕) remains in modal */

.modal-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.92); /* nearly solid light for contrast */
  color: var(--text-dark);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  font-size: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  z-index: 10;
  box-shadow: 0 4px 14px rgba(0,0,0,0.12);
}

.modal-nav:hover {
  transform: translateY(-50%) scale(1.03);
  box-shadow: 0 6px 18px rgba(0,0,0,0.16);
}

.modal-prev { left: 12px; }
.modal-next { right: 12px; }

.modal-img-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  width: 100%;
  max-height: 80vh;
  overflow: auto;
}

  .modal-image-outer { display:flex; align-items:center; justify-content:center; overflow:hidden; width:100%; position:relative }
.modal-image { cursor: default; max-width: 100% }
.modal-image.interactive { cursor: grab }
.modal-image.interactive:active { cursor: grabbing }
.modal-img-wrap:hover .modal-image.interactive:not(.zoomed) { cursor: zoom-in }

/* mobile specific: make transform origin center so panning feels right and hide any overlaying controls */
@media (max-width: 700px) {
  .modal-image { transform-origin: center center !important }
  .zoom-controls { right: 6px; bottom: 6px }
  /* joystick removed */
}

.modal-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(0,0,0,0.08);
  border-top-color: var(--primary-coral);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  position: absolute;
  transition: opacity 220ms ease;
}

.magnifier {
  position: fixed;
  pointer-events: none;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.9);
  box-shadow: 0 6px 20px rgba(0,0,0,0.35);
  background-repeat: no-repeat;
  background-position: center center;
  background-color: #fff;
  z-index: 1700;
}

.magnifier-pane {
  position: fixed;
  background-repeat: no-repeat;
  background-position: center center;
}


.zoom-btn {
  position: absolute;
  right: 12px;
  bottom: 12px;
  background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(250,250,250,0.86));
  border-radius: 999px;
  padding: 8px 10px;
  border: 1px solid rgba(0,0,0,0.08);
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
  cursor: pointer;
}
/* removed zoom-btn */

.zoom-controls { position: absolute; right: 8px; bottom: 8px; display:flex; gap:8px; align-items:center }
.zoom-small { background: rgba(255,255,255,0.95); border-radius:8px; padding:6px 8px; border:1px solid rgba(0,0,0,0.06); cursor:pointer }
.zoom-toggle { background: rgba(255,255,255,0.95); border-radius:8px; padding:6px 8px; border:1px solid rgba(0,0,0,0.06); cursor:pointer }
.zoom-toggle[aria-pressed="true"] {
  /* active state: solid primary teal to ensure visibility */
  background: var(--primary-teal);
  color: white;
  border-color: rgba(0,0,0,0.08);
  box-shadow: 0 6px 18px rgba(17,150,140,0.12);
}

.magnifier-indicator {
  position: absolute;
  right: 14px;
  bottom: 14px;
  background: rgba(0,0,0,0.6);
  color: white;
  padding: 6px 8px;
  border-radius: 999px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(0,0,0,0.28);
  backdrop-filter: blur(3px);
}

.modal-img-wrap:hover .modal-image.interactive { cursor: zoom-in }

@keyframes spin {
  to { transform: rotate(360deg); }
}

.modal-image {
  width: auto;
  max-width: calc(100vw - 80px);
  height: auto;
  max-height: calc(80vh - 160px);
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
  transition: opacity 180ms ease, transform 220ms ease;
  opacity: 1;
  transform: translateY(0);
}

.modal-image.loading {
  opacity: 0;
  transform: translateY(6px);
}

.modal-image.hidden {
  visibility: hidden;
  position: absolute;
}

.modal-caption {
  color: var(--text-dark);
  font-size: 0.95em;
  margin-top: 12px;
  text-align: center;
  max-width: 80%;
}

.modal-counter {
  color: var(--text-gray);
  font-size: 0.85em;
  margin-top: 6px;
}
  .gallery-filter {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 15px;
  }

  .search-row {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 12px;
    align-items: center;
  }

  .input-search {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    width: 220px;
    /* Prevent long placeholders from wrapping and increasing the input height */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Hide native search clear buttons (WebKit / IE) to avoid double icons */
  input[type="search"]::-webkit-search-cancel-button,
  input[type="search"]::-webkit-search-decoration {
    -webkit-appearance: none;
    appearance: none;
  }
  input[type="search"]::-ms-clear,
  input[type="search"]::-ms-reveal {
    display: none;
    width: 0;
    height: 0;
  }

  .search-field { position: relative; display:inline-flex; align-items:center }
  .search-field .input-search { padding-right: 34px }
  .search-clear { position:absolute; right:8px; background:transparent; border:none; font-size:14px; cursor:pointer; color:#888 }

  .empty-grid { text-align:center; padding:30px; color:#666; font-size:1em }

  .btn-grid {
    padding: 8px 12px;
    background: var(--primary-teal);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }

  /* Grid modal */
  .grid-overlay {
    position: fixed;
    inset: 0;
    /* match modal overlay but slightly lighter */
    background: linear-gradient(135deg, rgba(233,94,94,0.06) 0%, rgba(10,10,10,0.86) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1200;
    padding: 20px;
  }

  .grid-content {
    background: white;
    max-width: 1000px;
    width: 100%;
    max-height: 90vh;
    overflow: auto;
    border-radius: 10px;
    padding: 16px;
    position: relative;
  }

  .grid-close {
    position: absolute;
    right: 14px;
    top: 12px;
    border: none;
    background: var(--primary-coral);
    color: white;
    border-radius: 50%;
    width: 44px;
    height: 44px;
    font-size: 22px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    line-height: 1;
  }
  .grid-close:hover { background: #d14545; }

  .grid-wrap { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-top: 8px }
  .grid-item { cursor: pointer; border-radius: 8px; overflow: hidden; background:#fafafa; display:flex;flex-direction:column;align-items:center }
  .grid-item img { width:100%; height:140px; object-fit:cover }
  .grid-caption { padding:6px 8px; font-size:0.85em; color:var(--text-gray); text-align:center }
  .grid-item.skeleton { background:transparent; cursor:default }
  .skeleton-thumb { width:100%; height:140px; background:linear-gradient(90deg,#eee,#f5f5f5,#eee); background-size:200% 100%; animation: shimmer 1.2s infinite }
  .skeleton-caption { width:70%; height:14px; margin:10px 0; background:linear-gradient(90deg,#eee,#f5f5f5,#eee); background-size:200% 100%; animation: shimmer 1.2s infinite }
  @keyframes shimmer { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }

  .gallery-filter button {
    padding: 8px 16px;
    border: 1px solid var(--primary-teal);
    background: white;
    color: var(--primary-teal);
    border-radius: 20px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }

  .gallery-filter button:hover {
    background: var(--primary-teal);
    color: white;
  }

  .gallery-filter button.active {
    background: var(--primary-teal);
    color: white;
  }

  .swiper-pagination-fraction {
    text-align: center;
    margin-top: 8px;
    font-size: 14px;
    color: var(--primary-teal);
    font-weight: 500;
  }

  .swiper-pagination-fraction::before {
    content: 'Photo ';
  }

  .slide-image[src*="placeholder.jpg"] {
    background: #f0f0f0;
    border: 1px dashed #ccc;
  }

</style>
