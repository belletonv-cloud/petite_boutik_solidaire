<script setup>
import { ref, computed, onMounted } from 'vue'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from './firebase.js'
import SiteHeader from './components/SiteHeader.vue'
import Hero from './components/Hero.vue'
import About from './components/About.vue'
import Products from './components/Products.vue'
import Gallery from './components/ProductCarousel.vue'
import Association from './components/Association.vue'
import Calendar from './components/Calendar.vue'
import Hours from './components/Hours.vue'
import Engagement from './components/Engagement.vue'
import Contact from './components/Contact.vue'
import SocialMedia from './components/SocialMedia.vue'
import SiteFooter from './components/SiteFooter.vue'
import ActuBanner from './components/ActuBanner.vue'

const blocs = ref({})

const DEFAULT_ORDER = ['hero', 'about', 'carousel', 'collection', 'association', 'calendrier', 'engagement', 'contact', 'social']

const isVisible = (id) => {
  if (blocs.value[id] === undefined) return true
  return blocs.value[id].visible !== false
}

const blocOrder = computed(() => {
  if (blocs.value._order && Array.isArray(blocs.value._order)) return blocs.value._order
  return DEFAULT_ORDER
})

onMounted(() => {
  onSnapshot(doc(db, 'config', 'blocs'), snap => {
    if (snap.exists()) blocs.value = snap.data()
  })
})
</script>

<template>
  <div class="container">
    <SiteHeader />
    <ActuBanner />

    <template v-for="id in blocOrder" :key="id">
      <Hero          v-if="id === 'hero'       && isVisible('hero')"       />
      <About         v-if="id === 'about'      && isVisible('about')"      />
      <Products      v-if="id === 'collection' && isVisible('collection')" />
      <Gallery       v-if="id === 'carousel'   && isVisible('carousel')"   />
      <Association   v-if="id === 'association'&& isVisible('association')"/>
      <Calendar      v-if="id === 'calendrier' && isVisible('calendrier')" />
      <Hours         v-if="id === 'calendrier' && isVisible('calendrier')" id="horaires" />
      <Engagement    v-if="id === 'engagement' && isVisible('engagement')" />
      <Contact       v-if="id === 'contact'    && isVisible('contact')"    id="contact" />
      <SocialMedia   v-if="id === 'social'     && isVisible('social')"     />
    </template>

    <SiteFooter />
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #FAFAFA !important;
  color: #333333 !important;
}
</style>
