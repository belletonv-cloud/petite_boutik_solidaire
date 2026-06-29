<script setup>
import { ref, computed, onMounted } from 'vue'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from './firebase.js'
import SiteHeader from './components/SiteHeader.vue'
import Hero from './components/Hero.vue'
import About from './components/About.vue'
import Products from './components/Products.vue'
import Gallery from './components/ProductCarousel.vue'
import BoutiqueGallery from './components/BoutiqueGallery.vue'
import Association from './components/Association.vue'
import Calendar from './components/Calendar.vue'
import Hours from './components/Hours.vue'
import Engagement from './components/Engagement.vue'
import Contact from './components/Contact.vue'
import SocialMedia from './components/SocialMedia.vue'
import SiteFooter from './components/SiteFooter.vue'
import ActuBanner from './components/ActuBanner.vue'
import OpenStatusBanner from './components/OpenStatusBanner.vue'
import SectionNav from './components/SectionNav.vue'
import StickyBottomBar from './components/StickyBottomBar.vue'
import MentionsLegales from './components/MentionsLegales.vue'

const blocs = ref({})

const DEFAULT_ORDER = ['hero', 'about', 'boutique-gallery', 'carousel', 'collection', 'association', 'calendrier', 'engagement', 'contact', 'social']

const SECTION_LABELS = {
  hero: 'Accueil',
  about: 'À propos',
  'boutique-gallery': 'Boutique',
  carousel: 'Galerie photos',
  collection: 'Nos produits',
  association: 'Association',
  calendrier: 'Horaires',
  engagement: 'Engagement',
  contact: 'Contact',
  social: 'Réseaux'
}

const isVisible = (id) => {
  if (blocs.value[id] === undefined) return true
  return blocs.value[id].visible !== false
}

const isInNav = (id) => {
  if (blocs.value[id] === undefined) return true
  return blocs.value[id].showInNav !== false
}

const blocOrder = computed(() => {
  if (blocs.value._order && Array.isArray(blocs.value._order)) return blocs.value._order
  return DEFAULT_ORDER
})

const sectionLinks = computed(() =>
  blocOrder.value
    .filter(id => SECTION_LABELS[id] && isVisible(id) && isInNav(id))
    .map(id => ({ id, label: SECTION_LABELS[id] }))
)

onMounted(() => {
  onSnapshot(doc(db, 'config', 'blocs'), snap => {
    if (snap.exists()) blocs.value = snap.data()
  })

  // Intercepte tous les clics sur ancres # (au cas où l'élément cible
  // ne serait pas trouvé par la navigation native du navigateur)
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented) return
    const a = e.target.closest('a[href^="#"]')
    if (!a) return
    const id = a.getAttribute('href').slice(1)
    if (!id) return
    const el = document.getElementById(id)
    if (!el) return
    e.preventDefault()
    el.scrollIntoView({ behavior: 'instant', block: 'start' })
  })
})
</script>

<template>
  <div class="container">
    <SiteHeader />
    <OpenStatusBanner />
    <ActuBanner />

    <SectionNav v-if="sectionLinks.length" :sections="sectionLinks" />

    <template v-for="id in blocOrder" :key="id">
      <Hero          v-if="id === 'hero'             && isVisible('hero')"              id="hero" />
      <About         v-if="id === 'about'            && isVisible('about')"             id="about" />
      <BoutiqueGallery v-if="id === 'boutique-gallery' && isVisible('boutique-gallery')" id="boutique-gallery" />
      <Products      v-if="id === 'collection'       && isVisible('collection')"        id="collection" />
      <Gallery       v-if="id === 'carousel'         && isVisible('carousel')"          id="carousel" />
      <FouilleGallery v-if="id === 'fouille'          && isVisible('fouille')"           id="fouille" />
      <Association   v-if="id === 'association'      && isVisible('association')"       id="association" />
      <div         v-if="id === 'calendrier'       && isVisible('calendrier')"        id="calendrier" class="calendrier-section">
        <Calendar />
        <Hours />
      </div>
      <Engagement    v-if="id === 'engagement'       && isVisible('engagement')"        id="engagement" />
      <Contact       v-if="id === 'contact'          && isVisible('contact')"           id="contact" />
      <SocialMedia   v-if="id === 'social'           && isVisible('social')"            id="social" />
    </template>

    <SiteFooter />
    <MentionsLegales />
    <StickyBottomBar />
  </div>
</template>

<style>
:root {
  --site-max-width: 100%;
}
body {
  padding-top: 48px;
  padding-bottom: 48px;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* ensure container expands so footer sticks to bottom reliably */
.container { flex: 1 0 auto }
</style>

<style scoped>
.container {
  max-width: var(--site-max-width, 800px);
  margin: 0 auto;
  padding: 20px;
  background-color: #FAFAFA !important;
  color: #333333 !important;
}

@media (max-width: 600px) {
  .container {
    padding: 12px;
  }
}

.calendrier-section {
  scroll-margin-top: 64px;
}
</style>
