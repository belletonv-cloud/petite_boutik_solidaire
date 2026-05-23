<template>
  <section class="hero" :style="heroStyle">
    <div class="hero-content">
      <p class="hero-tagline">{{ tagline }}</p>
      <div class="hero-actions" v-if="btn1Visible || btn2Visible">
        <a v-if="btn1Visible" href="#calendrier" class="btn btn-primary" @click="scrollTo('calendrier')">{{ btn1Label }}</a>
        <a v-if="btn2Visible" href="#contact" class="btn btn-secondary" @click="scrollTo('contact')">{{ btn2Label }}</a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../firebase.js'

const tagline = ref("Vêtements enfants, chaussures et puériculture à prix mini dans un esprit de partage et de convivialité")
const gradientStart = ref('#1BA9A8')
const gradientEnd = ref('#E95E5E')
const gradientAngle = ref(135)
const btn1Label = ref('Voir les horaires')
const btn1Visible = ref(true)
const btn2Label = ref('Nous contacter')
const btn2Visible = ref(true)

const heroStyle = computed(() => ({
  background: `linear-gradient(${gradientAngle.value}deg, ${gradientStart.value} 0%, ${gradientEnd.value} 100%)`
}))

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'instant', block: 'start' })
  }
}

onMounted(() => {
  onSnapshot(doc(db, 'config', 'textes'), snap => {
    if (!snap.exists()) return
    const d = snap.data()
    if (d.hero_tagline) tagline.value = d.hero_tagline
    if (d.hero_gradient_start) gradientStart.value = d.hero_gradient_start
    if (d.hero_gradient_end) gradientEnd.value = d.hero_gradient_end
    if (d.hero_gradient_angle !== undefined) gradientAngle.value = d.hero_gradient_angle
    if (d.hero_btn1_label) btn1Label.value = d.hero_btn1_label
    if (d.hero_btn1_visible !== undefined) btn1Visible.value = d.hero_btn1_visible
    if (d.hero_btn2_label) btn2Label.value = d.hero_btn2_label
    if (d.hero_btn2_visible !== undefined) btn2Visible.value = d.hero_btn2_visible
  })
})
</script>

<style scoped>
.hero {
  color: white;
  padding: 60px 20px;
  text-align: center;
  border-radius: 15px;
  margin-bottom: 40px;
  box-shadow: 0 4px 20px rgba(27, 169, 168, 0.2);
}

.hero-content {
  max-width: 600px;
  margin: 0 auto;
}

.hero-tagline {
  font-size: 1.15em;
  line-height: 1.7;
  margin-bottom: 30px;
  opacity: 0.95;
}

.hero-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-block;
  padding: 12px 28px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1em;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn:focus-visible {
  outline: 3px solid white;
  outline-offset: 3px;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  text-decoration: none;
}

.btn-primary {
  background: white;
  color: var(--primary-teal);
}

.btn-primary:hover {
  background: var(--secondary-cream);
}

.btn-secondary {
  background: transparent;
  color: white;
  border-color: white;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

@media (max-width: 600px) {
  .hero {
    padding: 40px 15px;
  }

  .hero-tagline {
    font-size: 1em;
  }
}
</style>
