<script setup>
import SiteHeader from './components/SiteHeader.vue'
import Hero from './components/Hero.vue'
import About from './components/About.vue'
import Products from './components/Products.vue'
import Association from './components/Association.vue'
import Calendar from './components/Calendar.vue'
import Hours from './components/Hours.vue'
import Engagement from './components/Engagement.vue'
import Contact from './components/Contact.vue'
import FacebookButton from './components/FacebookButton.vue'
import SocialMedia from './components/SocialMedia.vue'
import SiteFooter from './components/SiteFooter.vue'
</script>

<template>
  <div class="container">
    <SiteHeader />
    <Hero />
    <About />
    <Products />
    <Association />
    <Calendar />
    <Hours id="horaires" />
    <Engagement />
    <Contact />
    <FacebookButton />
    <SocialMedia />
    <SiteFooter />
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
</style>
