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
          <img :src="img.src" :alt="img.alt" class="slide-image" @error="($event.target).src = '/placeholder.jpg'" />
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

    <div class="modal-overlay" v-if="modalOpen" @click.self="closeModal" role="dialog" aria-modal="true">
      <div class="modal-content">
        <button class="modal-close" @click="closeModal" aria-label="Fermer">✕</button>
        <button class="modal-nav modal-prev" @click="prevModal" aria-label="Précédente">‹</button>
        <button class="modal-nav modal-next" @click="nextModal" aria-label="Suivante">›</button>
        <img :src="images[modalIndex].fullSrc" :alt="images[modalIndex].alt" class="modal-image" loading="lazy" />
        <p class="modal-caption">{{ images[modalIndex].alt }}</p>
        <p class="modal-counter">{{ modalIndex + 1 }} / {{ images.length }}</p>
      </div>
    </div>

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
              <img :src="img.thumb || img.src" :alt="img.alt" loading="lazy" width="320" height="240" />
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
import { ref, computed, onMounted, onUnmounted, watchEffect } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase.js'

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
      fullSrc: p.url?.includes('cloudinary') ? p.url.replace('/upload/', '/upload/f_auto,q_auto/') : p.url,
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

// Fallback image for broken links
const placeholderImage = '/placeholder.jpg'

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
  // keep modalIndex and currentIndex consistent when opening modal from a slide
  currentIndex.value = idx
  modalOpen.value = true
  document.body.style.overflow = 'hidden'
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
}

const nextModal = () => {
  modalIndex.value = (modalIndex.value + 1) % images.value.length
  currentIndex.value = modalIndex.value
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
  transition: transform 0.2s;
  border-radius: 10px;
  overflow: hidden;
  width: 100%;
  height: 60vh;
  max-height: 500px;
}

@media (max-width: 600px) {
  .slide-frame {
    height: 40vh;
    max-height: 320px;
  }
}

.slide-frame:hover {
  transform: scale(1.015);
}

.slide-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 90vw;
  max-height: 90vh;
}

.modal-close {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--primary-coral);
  color: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.modal-close:hover {
  background: #d14545;
  transform: scale(1.1);
}

.modal-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.1);
  color: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  font-size: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 10;
}

.modal-nav:hover {
  background: rgba(255,255,255,0.25);
  transform: translateY(-50%) scale(1.1);
}

.modal-prev { left: 12px; }
.modal-next { right: 12px; }

.modal-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
}

.modal-caption {
  color: rgba(255,255,255,0.8);
  font-size: 0.9em;
  margin-top: 12px;
  text-align: center;
  max-width: 80%;
}

.modal-counter {
  color: rgba(255,255,255,0.45);
  font-size: 0.8em;
  margin-top: 4px;
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
    background: rgba(0,0,0,0.8);
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

  .grid-close { position: absolute; right: 14px; top: 12px; border: none; background: transparent; font-size: 20px; cursor: pointer }

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
