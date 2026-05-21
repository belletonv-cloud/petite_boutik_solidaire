<template>
  <div class="carousel-container">
    <h2>Découvrez notre boutique</h2>
    <p class="subtitle">Un lieu chaleureux pour toute la famille</p>
    <swiper
      :modules="modules"
      :slides-per-view="1"
      :loop="true"
      :autoplay="{ delay: 3000, disableOnInteraction: false }"
      :pagination="{ clickable: true }"
      :navigation="true"
      class="my-swiper"
      @swiper="s => swiperInstance = s"
    >
      <swiper-slide v-for="(img, idx) in images" :key="idx">
        <img :src="img.src" :alt="img.alt" class="slide-image" />
      </swiper-slide>
    </swiper>
    <div class="carousel-controls">
      <button class="pause-btn" @click="togglePause" :aria-label="isPaused ? 'Reprendre' : 'Pause'">
        {{ isPaused ? '▶ Reprendre' : '⏸ Pause' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import { onSnapshot, doc, collection, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase.js'

const modules = [Autoplay, Pagination, Navigation]

const allImages = [
  { id: '21', src: '/photos/PHOTO-2026-05-02-21-17-21.jpg', alt: 'Vitrine de la boutique' },
  { id: '24', src: '/photos/PHOTO-2026-05-02-21-17-24.jpg', alt: "Vue d'ensemble de la boutique" },
  { id: '222', src: '/photos/PHOTO-2026-05-02-21-17-222.jpg', alt: 'Vêtements suspendus en boutique' },
  { id: '11', src: '/photos/PHOTO-2026-05-02-21-17-11.jpg', alt: 'Rayon chaussures' },
  { id: '29', src: '/photos/PHOTO-2026-05-02-21-17-29.jpg', alt: 'Accueil en boutique' },
  { id: '28', src: '/photos/PHOTO-2026-05-02-21-17-28.jpg', alt: 'Espace poussettes' },
  { id: '22', src: '/photos/PHOTO-2026-05-02-21-17-22.jpg', alt: 'Vêtements en boutique' },
  { id: '092', src: '/photos/PHOTO-2026-05-02-21-17-092.jpg', alt: 'Matériel de puériculture' },
  { id: '09', src: '/photos/PHOTO-2026-05-02-21-17-09.jpg', alt: 'Rayon chaussures' },
]

const boutiqueState = ref({})
const dynamicPhotos = ref([])

onMounted(() => {
  onSnapshot(doc(db, 'config', 'galleries'), snap => {
    if (snap.exists()) {
      boutiqueState.value = snap.data().boutique || {}
    }
  })
  onSnapshot(query(collection(db, 'photos'), orderBy('createdAt')), snap => {
    dynamicPhotos.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
})

const images = computed(() => [
  ...allImages.filter(p => boutiqueState.value[p.id] !== false),
  ...dynamicPhotos.value
    .filter(p => p.gallery === 'boutique' && p.active)
    .map(p => ({ src: p.url, alt: p.alt }))
])

const swiperInstance = ref(null)
const isPaused = ref(false)

const togglePause = () => {
  if (!swiperInstance.value) return
  isPaused.value = !isPaused.value
  if (isPaused.value) {
    swiperInstance.value.autoplay.stop()
  } else {
    swiperInstance.value.autoplay.start()
  }
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
</style>
