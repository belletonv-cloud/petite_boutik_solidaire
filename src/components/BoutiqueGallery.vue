<template>
  <div class="carousel-container">
    <h2>Découvrez notre boutique</h2>
    <p class="subtitle">Un lieu chaleureux pour toute la famille</p>
    <swiper
      :modules="modules"
      :slides-per-view="1"
      :loop="images.length > 1"
      :autoplay="{ delay: 3000, disableOnInteraction: false }"
      :pagination="{ clickable: false, type: 'fraction' }"
      :navigation="images.length > 1"
      class="my-swiper"
      @swiper="onSwiper"
    >
    <swiper-slide v-for="(img, idx) in slides" :key="img.id || idx">
        <img
          :src="img.src"
          loading="lazy"
          :alt="img.alt"
          class="slide-image"
          @error="($event.target).src = img.fallback || '/placeholder.jpg'"
        />
      </swiper-slide>
    </swiper>
    <div class="swiper-pagination-fraction">
      {{ (typeof swiperInstance?.realIndex !== 'undefined' ? (swiperInstance.realIndex + 1) : (typeof swiperInstance?.activeIndex !== 'undefined' ? swiperInstance.activeIndex + 1 : 1)) }} / {{ slides.length || 1 }}
    </div>
    <div class="carousel-controls">
      <button class="pause-btn" @click="togglePause" :aria-label="isPaused ? 'Reprendre' : 'Pause'">
        {{ isPaused ? '▶ Reprendre' : '⏸ Pause' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
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
// Business rule: show photos that are active and have the removeBg flag
// (covers both "avec décor" and "fond supprimé").
const images = computed(() =>
  dynamicPhotos.value
    .filter(p => p && p.active && Object.prototype.hasOwnProperty.call(p, 'removeBg'))
    .map(p => ({
      id: p.id,
      src: (p.url || '').replace('upload/', 'upload/f_auto,q_auto/'),
      alt: p.alt || '',
      fallback: p.fallback || '/placeholder.jpg'
    }))
)

// Slides: use images; if empty, return a single placeholder slide to keep layout stable.
const slides = computed(() => images.value && images.value.length ? images.value : [{ id: '__placeholder', src: '/placeholder.jpg', alt: 'Aucune photo', fallback: '/placeholder.jpg' }])

// debug toggles removed (migration applied)

const swiperInstance = ref(null)
const isPaused = ref(false)

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
    try { s.slideTo(0) } catch (e) { /* ignore */ }
  }
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
}
</script>

<style scoped>
.carousel-container {
  background: linear-gradient(135deg, #FFF9F0 0%, #F5E6D3 100%);
  padding: 25px;
  border-radius: 12px;
  margin: 20px 0;
  border: 2px solid var(--secondary-beige);
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
  height: 400px;
  object-fit: cover;
  border-radius: 8px;
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

  .slide-image {
    width: 100%;
    height: auto;
    max-height: 60vh;
    object-fit: cover;
    border-radius: 8px;
  }

  .slide-image[src*="placeholder.jpg"] {
    background: #f0f0f0;
    border: 1px dashed #ccc;
  }

</style>
