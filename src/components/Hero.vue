<template>
  <section class="hero" :style="heroStyle">
    <div class="hero-content">
      <div class="hero-overlay"></div>

      <div class="hero-center">
        <div class="cta-card">
          <div class="cta-title" v-if="contactTitle">{{ contactTitle }}</div>
          <div class="cta-desc" v-if="contactDesc">{{ contactDesc }}</div>

          <div class="cta-actions">
            <a href="#contact" class="full-btn primary" @click="scrollTo('contact')" :aria-label="btn2Label" :title="btn2Label" role="button">
              <span class="btn-icon" aria-hidden="true" v-html="iconHtml"></span>
              <span class="btn-label">{{ btn2Label }}</span>
            </a>
            <a href="#calendrier" class="full-btn" @click="scrollTo('calendrier')" :aria-label="btn1Label" :title="btn1Label" role="button">
              <span class="btn-icon" aria-hidden="true" v-html="btn1IconHtml"></span>
              <span class="btn-label">{{ btn1Label }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useTextes } from '../composables/useTextes.js'

const textes = useTextes()

const mailSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6.5C3 5.67157 3.67157 5 4.5 5H19.5C20.3284 5 21 5.67157 21 6.5V17.5C21 18.3284 20.3284 19 19.5 19H4.5C3.67157 19 3 18.3284 3 17.5V6.5Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 6.5L12 12.5L3 6.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
const clockSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.2"/><path d="M12 7v6l4 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'

const gradientStart = computed(() => textes.value.hero_gradient_start || '#1BA9A8')
const gradientEnd = computed(() => textes.value.hero_gradient_end || '#E95E5E')
const gradientAngle = computed(() => textes.value.hero_gradient_angle ?? 135)
const btn1Label = computed(() => textes.value.hero_btn1_label || 'Horaires')
const btn2Label = computed(() => textes.value.hero_btn2_label || 'Nous contacter')
const contactTitle = computed(() => textes.value.hero_contact_title || "Besoin d'aide ?")
const contactDesc = computed(() => textes.value.hero_contact_desc || "Nous sommes là pour répondre à vos questions et vous accueillir à la boutique.")
const iconHtml = computed(() => textes.value.hero_btn2_icon || mailSvg)
const btn1IconHtml = computed(() => textes.value.hero_btn1_icon || clockSvg)

const heroStyle = computed(() => ({
  background: `linear-gradient(${gradientAngle.value}deg, ${gradientStart.value} 0%, ${gradientEnd.value} 100%)`
}))

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
}
</script>

<style scoped>
.hero {
  color: white;
  padding: 30px 12px; /* reduced to make block ~50% smaller */
  text-align: center;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 18px rgba(27, 169, 168, 0.08);
  position: relative;
}

.hero-content {
  max-width: var(--site-max-width, 800px);
  margin: 0 auto;
}

.hero-center { display:flex; align-items:center; justify-content:center; padding: 12px 8px }

.cta-card { background: transparent; padding:0; border-radius:0; max-width:100%; box-shadow: none; text-align:left; width:100% }
.cta-title { font-weight:700; color:white; margin-bottom:2px; font-size:0.95em }
.cta-desc { color: rgba(255,255,255,0.95); font-size:0.9em; margin-bottom:6px; line-height:1.25; max-height:2.4em; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical }

.cta-actions { display:flex; gap:10px; align-items:center; justify-content:center; width:100% }
.full-btn { display:inline-flex; align-items:center; justify-content:center; gap:10px; padding:8px 12px; border-radius:8px; width:100%; text-decoration:none; border: 2px solid rgba(27,169,168,0.16); background: transparent; color: rgba(255,255,255,0.95); font-weight:700 }
.full-btn.primary { font-weight:800 }
.full-btn:not(.primary) { font-weight:700 }
.full-btn .btn-icon svg { width:18px; height:18px }
.full-btn { transition: transform 140ms ease, background 140ms ease, color 140ms ease, border-color 140ms ease }
.full-btn:focus-visible { outline: 3px solid rgba(255,255,255,0.12); outline-offset: 3px }
.full-btn:hover { transform: translateY(-2px); background: linear-gradient(180deg, var(--primary-teal), var(--primary-teal-dark)); color: white; border-color: rgba(27,169,168,0.28) }

.hero-overlay { position:absolute; inset:0; border-radius:15px; background: linear-gradient(135deg, rgba(255,255,255,0.02), rgba(0,0,0,0.04)); pointer-events:none }

.btn-icon { display:inline-flex; align-items:center; justify-content:center }
.btn-icon svg { display:block; width:18px; height:18px }

@media (max-width: 600px) {
  .hero {
    padding: 40px 15px;
  }
}
</style>
