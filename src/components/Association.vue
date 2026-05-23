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
    <div class="donate-callout" v-if="donsVisible" tabindex="0">
      <div class="donate-head">
        <h3>Vous souhaitez donner ?</h3>
      </div>
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

    <Recognition :items="recognition" />
  </section>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../firebase.js'
import Recognition from './Recognition.vue'
let purifier = null
const sanitizeIcon = (html) => {
  if (!html) return ''
  try {
    if (purifier && typeof purifier.sanitize === 'function') return purifier.sanitize(html)
  } catch (e) {}
  // fallback basic escape
  return String(html).replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Recognition handled by dedicated component


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

// Recognition modal handled by src/components/Recognition.vue

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
  background: #ffffff;
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid rgba(0,0,0,0.05);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease, color 0.18s ease;
  will-change: transform, box-shadow;
}

.donate-callout h3 {
  color: var(--primary-teal);
  margin-bottom: 10px;
  font-weight: 700;
}

.donate-callout p { color: var(--text-dark); line-height: 1.6; margin-bottom: 8px }

.recognition {
  margin-top: 35px;
  text-align: center;
}

.donate-head { display:flex; align-items:center; gap:10px }
.dons-grid { display:flex; gap:10px; flex-wrap:wrap }
.dons-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 14px }
.dons-grid h4 { color: var(--primary-teal); margin-bottom: 8px }
.dons-grid ul { list-style: none; padding: 0; margin: 0; color: var(--text-dark) }
.dons-grid li { padding: 6px 0; display:flex; gap:8px; align-items:flex-start }
.dons-accepted, .dons-rejected { background: #ffffff; border: 1px solid rgba(0,0,0,0.04); padding: 12px; border-radius: 8px; transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease }

/* Hover / focus style for donate callout */
.donate-callout:hover,
.donate-callout:focus-visible {
  transform: translateY(-6px);
  box-shadow: 0 14px 36px rgba(27,169,168,0.14);
  background: linear-gradient(180deg, var(--primary-teal) 0%, #0ea9a8 100%);
  color: #fff;
}

.donate-callout:hover h3,
.donate-callout:focus-visible h3 { color: #fff }
.donate-callout:hover p,
.donate-callout:focus-visible p { color: rgba(255,255,255,0.95) }

.donate-callout:hover .dons-accepted,
.donate-callout:focus-visible .dons-accepted,
.donate-callout:hover .dons-rejected,
.donate-callout:focus-visible .dons-rejected {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.12);
  color: #fff;
}

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

.badge-image { display: none }

@media (max-width: 600px) {
  .badge { padding: 8px 12px; gap: 6px }
  .badge-image { display: none }
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

/* Modal image sizing specific to recognition modal */
.trust-modal-img {
  max-width: 90vw;
  max-height: 70vh; /* limit image height so modal chrome (close) stays visible */
  object-fit: contain;
  border-radius: 8px;
}

.modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: 80vh;
  overflow-y: auto; /* ensure modal content scrolls internally */
  gap: 8px;
  position: relative; /* for absolute-positioned debug */
  padding-bottom: 48px; /* leave room for debug / close button */
}

.modal-debug {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #fff;
  background: rgba(0,0,0,0.45);
  padding: 6px 8px;
  border-radius: 6px;
  max-width: 90vw;
  word-break: break-all;
  z-index: 100001;
}
</style>
