<template>
  <section class="association">
    <h2>{{ titreAssociation }}</h2>
    <p>{{ associationTexte }}</p>
    <div class="values">
      <div class="value-card" v-for="value in values" :key="value.title">
        <div class="value-icon">{{ value.icon }}</div>
        <h3>{{ value.title }}</h3>
        <p>{{ value.description }}</p>
      </div>
    </div>
    <div class="donate-callout" v-if="donsVisible">
      <h3>Vous souhaitez donner ?</h3>
      <p>{{ donsTexte }}</p>
      <p>{{ donsTexte2 }}</p>

      <div class="dons-grid">
        <div class="dons-accepted">
          <h4>Acceptés</h4>
          <ul>
            <li>👕 Vêtements enfants (0-10 ans) en bon état</li>
            <li>👟 Chaussures propres et en état</li>
            <li>🍼 Matériel de puériculture (propre, non endommagé)</li>
            <li>🤰 Vêtements maternité</li>
          </ul>
        </div>
        <div class="dons-rejected">
          <h4>Non acceptés</h4>
          <ul>
            <li>🧥 Vêtements très usés ou tâchés</li>
            <li>🚫 Sièges auto non contrôlés/âgés</li>
            <li>♻️ Articles cassés ou dangereux</li>
            <li>🧴 Produits d'hygiène entamés</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="recognition" v-if="recognition && recognition.length">
      <h3>Ils nous font confiance</h3>
    <div class="badges">
      <template v-for="(r, i) in recognition" :key="i">
        <button v-if="r.src" class="badge" type="button" :data-recognition-index="i" @click="openModal(r, i)" :aria-label="r.alt || 'Badge'">
          <img v-if="r.src" :src="r.src" :alt="r.alt || r.text || r.title || 'Badge'" class="badge-image" loading="lazy" decoding="async" />
          <span class="badge-icon" v-if="r.icon" v-html="sanitizeIconSafe(r.icon)"></span>
          <span class="badge-text">{{ r.text || r.title || r.name }}</span>
        </button>
        <button v-else class="badge" type="button" :data-recognition-index="i" :aria-label="r.alt || 'Badge'">
          <span class="badge-icon" v-if="r.icon" v-html="sanitizeIconSafe(r.icon)"></span>
          <span class="badge-text">{{ r.text || r.title || r.name }}</span>
        </button>
      </template>
    </div>
    </div>

    <Modal v-model:modelValue="modalOpen" title="Ils nous font confiance" @close="onModalClose">
      <img
        class="trust-modal-img"
        :src="modalImage"
        :alt="modalAlt"
      />
    </Modal>
  </section>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../firebase.js'
import Modal from './Modal.vue'
let purifier = null
const sanitizeIcon = (html) => {
  if (!html) return ''
  try {
    if (purifier && typeof purifier.sanitize === 'function') return purifier.sanitize(html)
  } catch (e) {}
  // fallback basic escape
  return String(html).replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const modalOpen = ref(false)
const modalImage = ref('')
const modalAlt = ref('')


const titreAssociation = ref("L'Association Bras Ouverts")
const associationTexte = ref("L'Association Bras Ouverts de Morlaix est portée par des bénévoles engagées qui œuvrent chaque jour pour créer du lien social et soutenir les familles du territoire.")
  const donsTexte  = ref("Nous acceptons avec gratitude vos dons de vêtements enfants (0-10 ans) en bon état, chaussures, matériel de puériculture et vêtements pour futures mamans.")
  const donsTexte2 = ref("Apportez vos dons directement à la boutique aux horaires d'ouverture.")
  const donsVisible = ref(true)
const recognition = ref([])

onMounted(() => {
  onSnapshot(doc(db, 'config', 'textes'), snap => {
    if (snap.exists()) {
      const data = snap.data()
      if (data.association_titre) titreAssociation.value = data.association_titre
      if (data.association_texte) associationTexte.value = data.association_texte
      if (data.dons_texte)  donsTexte.value  = data.dons_texte
      if (data.dons_texte2) donsTexte2.value = data.dons_texte2
      if (data.dons_visible !== undefined) donsVisible.value = data.dons_visible !== false && data.dons_visible !== 'false'
      if (Array.isArray(data.recognition_items) && data.recognition_items.length) recognition.value = data.recognition_items
      else if (!recognition.value.length) recognition.value = [ { text: 'À la une dans la presse locale', icon: '📰', src: '/documents/PHOTO-2026-05-02-21-17-283.jpg' } ]
    }
  })
  // try dynamic import of DOMPurify for sanitization
  import('dompurify').then(m => { purifier = m && (m.default || m) }).catch(() => { purifier = null })
})

// Helper to sanitise icon HTML and prefer emoji-only fallback
const sanitizeIconSafe = (html) => {
  if (!html) return ''
  try {
    if (purifier && purifier.sanitize) {
      const out = purifier.sanitize(html, { ALLOWED_TAGS: [] })
      return out
    }
  } catch (e) {}
  // strip tags
  return String(html).replace(/<[^>]*>/g, '')
}

let _lastBadgeEl = null
const openModal = async (r, idx) => {
  if (!r || !r.src) return
  // try to find the badge element by index (more robust on mobile)
  let el = null
  try {
    el = document.querySelector(`.badge[data-recognition-index="${idx}"]`)
  } catch (e) { el = null }
  _lastBadgeEl = el || null
  // resolve relative paths to absolute using import.meta.url so bundled assets resolve correctly
  try {
    modalImage.value = r.src ? new URL(r.src, import.meta.url).href : r.src
  } catch (e) {
    modalImage.value = r.src
  }
  modalAlt.value = r.alt || r.text || r.title || 'Article'
  modalOpen.value = true
  // wait a tick for the modal to render and then ensure content is visible and image sizing fixed
  await nextTick()
  const mod = document.querySelector('.app-modal-content')
  if (mod && typeof mod.scrollIntoView === 'function') mod.scrollIntoView({ block: 'center', behavior: 'smooth' })
  const img = mod?.querySelector('img')
  if (img) {
    if (img.complete) img.style.maxWidth = '100%'
    else img.addEventListener('load', () => { img.style.maxWidth = '100%' }, { once: true })
  }
}

const onModalClose = () => {
  // after closing the modal, scroll to the recognition section so the user
  // returns to "Ils nous font confiance"
  try {
    const el = document.querySelector('.recognition')
    if (el && typeof el.scrollIntoView === 'function') {
      // scroll to a comfortable offset so the heading isn't jammed to the top
      const y = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
    }
    // return focus to the badge that opened the modal (accessibility)
    if (_lastBadgeEl && typeof _lastBadgeEl.focus === 'function') {
      _lastBadgeEl.focus()
      _lastBadgeEl = null
    }
  } catch (e) { /* ignore */ }
}


// modal behavior removed; opening badges will use direct links for now

const values = [
  {
    icon: '♻️',
    title: 'Recyclage',
    description: 'Donner une seconde vie aux vêtements et lutter contre le gaspillage textile.'
  },
  {
    icon: '🤝',
    title: 'Solidarité',
    description: 'Aider les familles à s\'équiper à prix accessible, dans le respect et la bienveillance.'
  },
  {
    icon: '💛',
    title: 'Convivialité',
    description: 'Créer un lieu chaleureux où chacun·e se sent attendu·e et bienvenu·e.'
  }
]

/* Modal image sizing specific to recognition modal */
.trust-modal-img {
  max-width: 90vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  display: block;
  margin: 0 auto;
}
</script>

<style scoped>
.association {
  margin: 40px 0;
}

.association h2 {
  color: var(--primary-teal);
  margin-bottom: 15px;
}

.association > p {
  font-size: 1.05em;
  line-height: 1.7;
  margin-bottom: 30px;
  color: var(--text-dark);
}

.association strong {
  color: var(--primary-coral);
}

.values {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 35px;
}

.value-card {
  background: linear-gradient(135deg, #FFF9F0 0%, #F5E6D3 100%);
  padding: 25px 20px;
  border-radius: 12px;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 2px solid var(--secondary-beige);
}

.value-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(27, 169, 168, 0.15);
}

.value-icon {
  font-size: 2.5em;
  margin-bottom: 10px;
}

.value-card h3 {
  color: var(--primary-teal);
  margin-bottom: 8px;
  font-size: 1.15em;
}

.value-card p {
  color: var(--text-gray);
  font-size: 0.95em;
  line-height: 1.5;
}

.donate-callout {
  background: linear-gradient(135deg, #E95E5E15, #E95E5E08);
  border: 2px solid var(--primary-coral);
  border-radius: 12px;
  padding: 25px;
  text-align: center;
}

.donate-callout h3 {
  color: var(--primary-coral);
  margin-bottom: 12px;
  font-size: 1.2em;
}

.donate-callout p {
  color: var(--text-dark);
  line-height: 1.6;
  margin-bottom: 8px;
}

.recognition {
  margin-top: 35px;
  text-align: center;
}

.dons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-top: 14px;
}
.dons-grid h4 { color: var(--primary-teal); margin-bottom: 8px }
.dons-grid ul { list-style: none; padding: 0; margin: 0; color: var(--text-dark) }
.dons-grid li { padding: 6px 0; display:flex; gap:8px; align-items:flex-start }
.dons-accepted { background: #F7FFF9; border: 1px solid #CFF3E3; padding: 12px; border-radius: 8px }
.dons-rejected { background: #FFF7F7; border: 1px solid #F3CFCF; padding: 12px; border-radius: 8px }

.recognition h3 {
  color: var(--primary-teal);
  margin-bottom: 15px;
}

.badges {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 2px solid var(--primary-teal);
  color: var(--primary-teal);
  padding: 10px 18px;
  border-radius: 30px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9em;
  transition: all 0.3s;
  cursor: pointer;
  font-family: inherit;
}

.badge:hover {
  background: var(--primary-teal);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(27, 169, 168, 0.3);
}

.badge:focus {
  outline: 3px solid var(--coral);
  outline-offset: 2px;
}

.badge-icon {
  font-size: 1.2em;
}

.badge-image {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.04);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

@media (max-width: 600px) {
  .badge { padding: 8px 12px; gap: 6px }
  .badge-image { width: 42px; height: 42px }
  .badge-text { font-size: 0.85em }
}


.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1400; /* same as MentionsLegales */
  padding: 20px;
}

/* mentions/modal styles removed from Association.vue */

.modal-close {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--primary-coral);
  color: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 12;
}

.modal-close:hover { transform: scale(1.06) }


/* modal remnants removed */

/* modal styles removed from Association.vue; modal will be reimplemented centrally */
</style>
