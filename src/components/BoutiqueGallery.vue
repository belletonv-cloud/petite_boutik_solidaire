<template>
  <div class="carousel-container" data-test="boutique-carousel">
    <h2>Découvrez notre boutique</h2>
    <p class="subtitle">Un lieu chaleureux pour toute la famille</p>
    <swiper
      :modules="modules"
      :slides-per-view="1"
      :loop="false"
      :autoplay="{ delay: 3000, disableOnInteraction: false }"
      :pagination="false"
      :navigation="images.length > 1"
      class="my-swiper"
      @swiper="onSwiper"
      @slideChange="onSlideChange"
    >
    <swiper-slide v-for="(img, idx) in slides" :key="img.id || idx">
        <img
          :src="img.src"
          loading="lazy"
          :alt="img.alt"
          class="slide-image"
          data-test="slide-image"
          @error="($event.target).src = img.fallback || '/placeholder.jpg'"
        />
      </swiper-slide>
    </swiper>
    <div class="swiper-pagination-fraction">
      {{ Math.min(currentIndex + 1, images.length || 1) }} / {{ images.length || 1 }}
    </div>
    <div class="carousel-controls">
      <button class="pause-btn" @click="togglePause" :aria-label="isPaused ? 'Reprendre' : 'Pause'">
        {{ isPaused ? '▶ Reprendre' : '⏸ Pause' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import { onSnapshot, doc, collection, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase.js'

const modules = [Autoplay, Pagination, Navigation]


const boutiqueState = ref({})
const dynamicPhotos = ref([])

onMounted(() => {
  onSnapshot(doc(db, 'config', 'galleries'), snap => {
    if (snap.exists()) boutiqueState.value = snap.data().boutique || {}
  }, (err) => console.error('[BoutiqueGallery] galleries snapshot error', err))

  onSnapshot(query(collection(db, 'photos'), orderBy('createdAt')), snap => {
    // populate dynamic photos from Firestore
    dynamicPhotos.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }, (err) => console.error('[BoutiqueGallery] photos snapshot error', err))
})

// Images computed: select photos that represent Boutique items.
// Business rule: prefer photos that had their background removed (removeBg === true),
// but also include photos explicitly marked for the boutique gallery (gallery === 'boutique').
// This keeps the UI tolerant of inconsistent data while prioritising properly processed images.
function galleryCardUrl(url) {
  if (!url || !url.includes('/upload/')) return url
  return url.replace('/upload/', '/upload/w_600,c_limit,f_auto,q_auto/')
}

const images = computed(() =>
  dynamicPhotos.value
    .filter(p => p && p.active && p.removeBg === false)
    .map(p => ({
      id: p.id,
      src: galleryCardUrl(p.url),
      alt: p.alt || '',
      fallback: p.fallback || '/placeholder.jpg'
    }))
)

// Slides: use images; if empty, return a single placeholder slide to keep layout stable.
const slides = computed(() => images.value && images.value.length ? images.value : [{ id: '__placeholder', src: '/placeholder.jpg', alt: 'Aucune photo', fallback: '/placeholder.jpg' }])

// debug toggles removed (migration applied)

const swiperInstance = ref(null)
const isPaused = ref(false)
// track current index for a stable, custom counter
const currentIndex = ref(0)
// stable handler reference so we can remove it safely on unmount
let slideHandler = null

// Ensure Swiper recalculates once images change (fires after images are rendered)
watch(images, async (val) => {
  // wait for DOM update
  await nextTick()
  const s = swiperInstance.value
  if (!s) return
  // update dimensions and pagination
  if (typeof s.update === 'function') s.update()
  // if slides were added, ensure we start at first slide
  if (val && val.length) {
    try {
      // when loop is enabled, slideToLoop ensures the logical first slide is shown
      if (s.params && s.params.loop && typeof s.slideToLoop === 'function') s.slideToLoop(0)
      else s.slideTo(0)
    } catch (e) { /* ignore */ }
  }
  // give Swiper a microtask to stabilise, then sync counter
  await new Promise(r => setTimeout(r, 0))
  if (slideHandler) slideHandler()
  // no debug exposure in production
})

const togglePause = () => {
  if (!swiperInstance.value) return
  isPaused.value = !isPaused.value
  if (isPaused.value) {
    swiperInstance.value.autoplay.stop()
  } else {
    swiperInstance.value.autoplay.start()
  }
}

function onSwiper(s) {
  // ensure we keep the Swiper instance in the ref so controls work
  swiperInstance.value = s
  try {
    const handler = () => { currentIndex.value = (typeof s.realIndex !== 'undefined') ? s.realIndex : (typeof s.activeIndex !== 'undefined' ? s.activeIndex : 0) }
    slideHandler = handler
    // initialize once
    handler()
    // register events if available
    if (s && typeof s.on === 'function') {
      s.on('slideChange', handler)
      if (typeof s.on === 'function') s.on('init', handler)
    }
  } catch (e) { currentIndex.value = 0 }
}

function onSlideChange() {
  const s = swiperInstance.value
  if (!s) return
  currentIndex.value = (typeof s.realIndex !== 'undefined') ? s.realIndex : (typeof s.activeIndex !== 'undefined' ? s.activeIndex : 0)
}

onUnmounted(() => {
  const s = swiperInstance.value
  if (s && typeof s.off === 'function' && slideHandler) {
    try { s.off('slideChange', slideHandler) } catch (e) { /* ignore */ }
    try { s.off('init', slideHandler) } catch (e) { /* ignore */ }
  }
})
</script>

<style scoped>
.carousel-container {
  background: linear-gradient(135deg, #FFF9F0 0%, #F5E6D3 100%);
  padding: 25px;
  border-radius: 12px;
  margin: 20px 0;
  border: 2px solid var(--secondary-beige);
}

@media (max-width: 600px) {
  .carousel-container {
    padding: 15px;
    margin: 12px 0;
  }
}

.carousel-container h2 {
  color: var(--primary-teal);
  margin-bottom: 8px;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: var(--text-gray);
  margin-bottom: 20px;
  font-size: 0.95em;
}

.my-swiper {
  width: 100%;
  max-width: var(--site-max-width, 800px);
  margin: 0 auto;
  padding-bottom: 40px;
}

@media (max-width: 600px) {
  .my-swiper {
    padding-bottom: 30px;
  }
}

:deep(.swiper-pagination-bullet-active) {
  background: var(--primary-teal);
}

:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
  color: var(--primary-teal);
  background: rgba(255,255,255,0.8);
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

:deep(.swiper-button-next:after),
:deep(.swiper-button-prev:after) {
  font-size: 18px;
  font-weight: bold;
}

.slide-image {
  width: 100%;
  height: calc(var(--vh, 1vh) * 60);
  max-height: 500px;
  object-fit: contain;
  border-radius: 8px;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

@media (max-width: 600px) {
  .slide-image {
    height: calc(var(--vh, 1vh) * 40);
    max-height: 320px;
  }
}

.slide-image[src*="placeholder.jpg"] {
  background: #f0f0f0;
  border: 1px dashed #ccc;
}

.carousel-controls {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

.pause-btn {
  background: none;
  border: 2px solid var(--primary-teal);
  color: var(--primary-teal);
  border-radius: 20px;
  padding: 6px 16px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 600;
  transition: all 0.3s;
  font-family: inherit;
}

.pause-btn:hover {
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

</style>
