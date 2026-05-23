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
import { ref, computed, onMounted } from 'vue'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../firebase.js'

// tagline intentionally removed — content will be controlled via admin if needed
const tagline = ref('')
const gradientStart = ref('#1BA9A8')
const gradientEnd = ref('#E95E5E')
const gradientAngle = ref(135)
const btn1Label = ref('Horaires')
const btn1Visible = ref(true)
const btn2Label = ref('Nous contacter')
const btn2Visible = ref(true)

const contactTitle = ref("Besoin d'aide ?")
const contactDesc = ref("Nous sommes là pour répondre à vos questions et vous accueillir à la boutique.")
// iconHtml is editable via admin (hero_btn2_icon in config.textes) and defaults to envelope SVG

// small inline SVGs for default icons
const mailSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6.5C3 5.67157 3.67157 5 4.5 5H19.5C20.3284 5 21 5.67157 21 6.5V17.5C21 18.3284 20.3284 19 19.5 19H4.5C3.67157 19 3 18.3284 3 17.5V6.5Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 6.5L12 12.5L3 6.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
const clockSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.2"/><path d="M12 7v6l4 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
// admin-editable icons (defaults set above)
const btn1IconHtml = ref(clockSvg)
const iconHtml = ref(mailSvg)

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
  padding: 30px 12px; /* reduced to make block ~50% smaller */
  text-align: center;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 18px rgba(27, 169, 168, 0.08);
  position: relative;
}

.hero-content {
  max-width: 900px;
  margin: 0 auto;
}

.hero-center { display:flex; align-items:center; justify-content:center; padding: 12px 8px }

.cta-card { background: rgba(255,255,255,0.05); padding:8px 10px; border-radius:10px; max-width:320px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); text-align:center }
.cta-title { font-weight:800; color:white; margin-bottom:4px; font-size:0.98em }
.cta-desc { color: rgba(255,255,255,0.95); font-size:0. nineem; margin-bottom:8px; line-height:1.3; max-height:2.6em; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical }

.cta-actions { display:flex; gap:10px; align-items:center; justify-content:center; width:100% }
.full-btn { display:inline-flex; align-items:center; justify-content:center; gap:10px; padding:8px 12px; border-radius:10px; width:100%; text-decoration:none }
.full-btn.primary { background: linear-gradient(180deg, var(--primary-coral), #e64f4f); color:white; font-weight:800; }
.full-btn:not(.primary) { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.95); font-weight:700 }
.full-btn .btn-icon svg { width:18px; height:18px }
.full-btn:focus-visible { outline: 3px solid rgba(255,255,255,0.12); outline-offset: 3px }
.full-btn:hover { transform: translateY(-2px) }

  .contact-card { display:none }
  .contact-title { display:none }
  .contact-desc { display:none }

  .card-btn { display:none }
  .card-icon { display:none }
  .card-text { display:none }

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
