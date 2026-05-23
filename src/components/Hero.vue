<template>
  <section class="hero" :style="heroStyle">
    <div class="hero-content hero-grid">
      <div class="hero-overlay"></div>
      <div class="hero-left">
        <p class="hero-tagline">{{ tagline }}</p>
        <div class="hero-actions" v-if="btn1Visible">
          <a v-if="btn1Visible" href="#calendrier" class="btn btn-outline" @click="scrollTo('calendrier')">{{ btn1Label }}</a>
        </div>
      </div>

      <div class="hero-right" v-if="btn2Visible">
        <div class="contact-card">
          <div class="contact-title">{{ contactTitle }}</div>
          <div class="contact-desc">{{ contactDesc }}</div>
          <div class="contact-actions">
            <a href="#contact" class="card-btn" @click="scrollTo('contact')">
              <span class="card-icon" aria-hidden="true" v-html="iconHtml"></span>
              <span class="card-text">{{ btn2Label }}</span>
            </a>
            <a href="#calendrier" class="card-btn" @click="scrollTo('calendrier')">
              <span class="card-icon" aria-hidden="true" v-html="btn1IconHtml"></span>
              <span class="card-text">{{ btn1Label }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
  <!-- Floating contact action (admin controlled) -->
  <a v-if="btn2Visible" href="#contact" class="fab" aria-label="Nous contacter" @click="scrollTo('contact')" v-html="mailSvg"></a>
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

const contactTitle = ref("Besoin d'aide ?")
const contactDesc = ref("Nous sommes là pour répondre à vos questions et vous accueillir à la boutique.")
// iconHtml is editable via admin (hero_btn2_icon in config.textes) and defaults to envelope SVG
const iconHtml = ref(mailSvg)

// small inline SVGs for default icons
const mailSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6.5C3 5.67157 3.67157 5 4.5 5H19.5C20.3284 5 21 5.67157 21 6.5V17.5C21 18.3284 20.3284 19 19.5 19H4.5C3.67157 19 3 18.3284 3 17.5V6.5Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 6.5L12 12.5L3 6.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
const clockSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.2"/><path d="M12 7v6l4 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
// admin-editable icons (defaults set above)
const iconHtml = ref(mailSvg)
const btn1IconHtml = ref(clockSvg)

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
    if (d.hero_contact_title) contactTitle.value = d.hero_contact_title
    if (d.hero_contact_desc) contactDesc.value = d.hero_contact_desc
    if (d.hero_btn2_icon) iconHtml.value = d.hero_btn2_icon
    if (d.hero_btn1_icon) btn1IconHtml.value = d.hero_btn1_icon
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
  box-shadow: 0 4px 20px rgba(27, 169, 168, 0.12);
  position: relative;
}

.hero-content {
  max-width: 1000px;
  margin: 0 auto;
}

.hero-grid { display:grid; grid-template-columns: 1fr 360px; gap: 22px; align-items:center }
.hero-left { text-align:left }
.hero-right { display:flex; align-items:center; justify-content:center }

.contact-card { background: rgba(255,255,255,0.06); padding:18px; border-radius:12px; text-align:left }
.contact-title { font-weight:700; color:white; margin-bottom:6px }
.contact-desc { color: rgba(255,255,255,0.9); font-size:0.95em; margin-bottom:12px }

.contact-actions { display:flex; gap:10px }
.card-btn { background: white; color: var(--primary-teal); padding:10px 12px; border-radius:8px; display:inline-flex; gap:8px; align-items:center; text-decoration:none; font-weight:700 }
.card-icon svg { width:18px; height:18px }
.card-text { font-size:0.95em }

.hero-overlay { position:absolute; inset:0; border-radius:15px; background: linear-gradient(135deg, rgba(255,255,255,0.02), rgba(0,0,0,0.04)); pointer-events:none }

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

.btn-cta {
  background: transparent;
  color: white;
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 1em;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 2px solid rgba(255,255,255,0.95);
}

.btn-cta:hover {
  background: white;
  color: var(--primary-teal);
  transform: translateY(-2px);
}

.btn-ghost {
  display: block;
  margin-top: 12px;
  color: white;
  opacity: 0.9;
  text-decoration: underline;
  font-weight: 600;
}

/* unified outline button style used for both actions */
.btn-outline {
  background: transparent;
  color: white;
  border: 2px solid rgba(255,255,255,0.95);
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-outline:hover { background: white; color: var(--primary-teal); transform: translateY(-2px); }

/* Primary small action (Horaires) - ensure border is visible */
.btn-primary {
  background: transparent;
  color: white;
  border: 2px solid rgba(255,255,255,0.95);
  padding: 12px 18px;
  border-radius: 10px;
  font-weight: 700;
}
.btn-primary:hover { background: white; color: var(--primary-teal); transform: translateY(-2px); }

.btn-icon { display:inline-flex; align-items:center; justify-content:center }
.btn-icon svg { display:block; width:18px; height:18px }

.cta-wrap { display:flex; flex-direction:column; align-items:center; gap:6px }

@media (max-width: 600px) {
  .hero-grid { grid-template-columns: 1fr; }
  .hero-left { text-align:center }
  .hero-right { margin-top: 12px }
  .btn-cta { width: 100%; justify-content: center }
  .btn-ghost { width: 100%; text-align: center }
}

/* Floating action button */
.fab {
  position: fixed;
  right: 18px;
  bottom: 18px;
  width: 56px;
  height: 56px;
  background: var(--primary-coral);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 26px rgba(233,94,94,0.18);
  z-index: 1200;
}
.fab svg { width:22px; height:22px }

@media (max-width: 600px) {
  .hero {
    padding: 40px 15px;
  }

  .hero-tagline {
    font-size: 1em;
  }
}
</style>
