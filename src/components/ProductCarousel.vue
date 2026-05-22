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

    <swiper
      :modules="modules"
      :slides-per-view="1"
      :loop="images.length > 1"
      :autoplay="{ delay: 3500, disableOnInteraction: false }"
      :pagination="false"
      :navigation="images.length > 1"
      :auto-height="true"
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
        <img :src="images[modalIndex].src" :alt="images[modalIndex].alt" class="modal-image" />
        <p class="modal-caption">{{ images[modalIndex].alt }}</p>
        <p class="modal-counter">{{ modalIndex + 1 }} / {{ images.length }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

const images = computed(() =>
  dynamicPhotos.value
    .filter(p => p.active && (
      // Articles: only photos that had background removal applied
      filter.value === 'articles' ? (p.removeBg === true)
      // Boutique: the rest (not background removed)
      : (p.removeBg !== true)
    ))
    .map(p => ({ src: bgRemovalUrl(p.url, p.removeBg), alt: p.alt }))
)

const swiperInstance = ref(null)
const isPaused = ref(false)
const modalOpen = ref(false)
const modalIndex = ref(0)
const currentIndex = ref(0)

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
}

.slide-frame:hover {
  transform: scale(1.015);
}

.slide-image {
  display: block;
  width: 100%;
  height: auto;
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
  top: -18px;
  right: -18px;
  background: var(--primary-coral);
  color: white;
  border: none;
  border-radius: 50%;
  width: 38px;
  height: 38px;
  font-size: 18px;
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

  .slide-image {
    width: 100%;
    height: auto;
    max-height: 60vh;
    object-fit: contain;
    border-radius: 8px;
  }

  .slide-image[src*="placeholder.jpg"] {
    background: #f0f0f0;
    border: 1px dashed #ccc;
  }

</style>
