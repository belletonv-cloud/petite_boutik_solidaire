<template>
  <div class="gallery-container">
    <h2>Galerie photos</h2>
    <p class="subtitle">Cliquez sur une photo pour la voir en grand</p>
    <swiper
      :modules="modules"
      :slides-per-view="1"
      :loop="true"
      :autoplay="{ delay: 3000, disableOnInteraction: false }"
      :pagination="{ clickable: true }"
      :navigation="true"
      class="my-swiper"
      @swiper="onSwiper"
    >
      <swiper-slide v-for="(img, idx) in images" :key="idx">
        <div class="slide-frame" @click="openModal(idx)">
          <img :src="img.src" :alt="img.alt" class="slide-image" />
        </div>
      </swiper-slide>
    </swiper>

    <div class="carousel-controls">
      <button class="pause-btn" @click="togglePause" :aria-label="isPaused ? 'Reprendre' : 'Pause'">
        {{ isPaused ? '▶ Reprendre' : '⏸ Pause' }}
      </button>
    </div>

    <div class="modal-overlay" v-if="modalOpen" @click.self="closeModal" role="dialog" aria-modal="true">
      <div class="modal-content">
        <button class="modal-close" @click="closeModal" aria-label="Fermer">✕</button>
        <img :src="images[modalIndex].src" :alt="images[modalIndex].alt" class="modal-image" />
      </div>
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

// Toutes les photos (produits + boutique) en une seule galerie
const allImages = [
  { id: '07', src: '/photos/PHOTO-2026-05-02-21-17-07.jpg', alt: 'Salopette et t-shirt' },
  { id: '072', src: '/photos/PHOTO-2026-05-02-21-17-072.jpg', alt: 'Sandales' },
  { id: '13', src: '/photos/PHOTO-2026-05-02-21-17-13.jpg', alt: 'Tenue complète' },
  { id: '17', src: '/photos/PHOTO-2026-05-02-21-17-17.jpg', alt: 'Tenue bébé et nounours' },
  { id: '18', src: '/photos/PHOTO-2026-05-02-21-17-18.jpg', alt: 'Combinaison bébé' },
  { id: '20', src: '/photos/PHOTO-2026-05-02-21-17-20.jpg', alt: 'Cheval à bascule' },
  { id: '212', src: '/photos/PHOTO-2026-05-02-21-17-212.jpg', alt: 'Trotteur VTech' },
  { id: '25', src: '/photos/PHOTO-2026-05-02-21-17-25.jpg', alt: 'Veste kaki' },
  { id: '252', src: '/photos/PHOTO-2026-05-02-21-17-252.jpg', alt: 'Robe rose' },
  { id: '26', src: '/photos/PHOTO-2026-05-02-21-17-26.jpg', alt: 'Ensemble marine' },
  { id: '262', src: '/photos/PHOTO-2026-05-02-21-17-262.jpg', alt: 'Ensemble blanc rayé' },
  { id: '12', src: '/photos/PHOTO-2026-05-02-21-17-12.jpg', alt: 'Veste marine' },
  { id: '14', src: '/photos/PHOTO-2026-05-02-21-17-14.jpg', alt: 'Robe et peluche' },
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

const galleriesState = ref({ gallery: {} })
const dynamicPhotos = ref([])
const photoAlts = ref({})

onMounted(() => {
  onSnapshot(doc(db, 'config', 'galleries'), snap => {
    if (snap.exists()) {
      const data = snap.data()
      galleriesState.value = { gallery: data.gallery || {} }
    }
  })
  onSnapshot(doc(db, 'config', 'photoAlts'), snap => {
    if (snap.exists()) photoAlts.value = snap.data()
  })
  onSnapshot(query(collection(db, 'photos'), orderBy('createdAt')), snap => {
    dynamicPhotos.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
})

const altFor = (id, defaultAlt) => photoAlts.value[id] ?? defaultAlt

const images = computed(() => [
  ...allImages.filter(p => galleriesState.value.gallery[p.id] !== false)
    .map(p => ({ src: p.src, alt: altFor(p.id, p.alt) })),
  ...dynamicPhotos.value
    .filter(p => p.active)
    .map(p => ({ src: p.url, alt: p.alt }))
])

const swiperInstance = ref(null)
const isPaused = ref(false)
const modalOpen = ref(false)
const modalIndex = ref(0)

const onSwiper = (swiper) => {
  swiperInstance.value = swiper
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
  modalOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  modalOpen.value = false
  document.body.style.overflow = ''
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

.slide-frame {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.slide-frame:hover {
  transform: scale(1.02);
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
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.modal-close {
  position: absolute;
  top: -15px;
  right: -15px;
  background: var(--primary-coral);
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 10;
}

.modal-close:hover {
  background: #d14545;
  transform: scale(1.1);
}

.modal-image {
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
}
</style>
