<template>
  <div>
    <div class="mentions-modal" v-if="open" role="dialog" aria-modal="true" aria-label="Mentions légales" @click.self="close">
      <div class="mentions-content">
        <button class="mentions-close" @click="close" aria-label="Fermer">✕</button>
        <h2 v-html="mentionsTitle"> </h2>
        <div class="mentions-body" v-html="sanitizedHtml(mentionsContent)"></div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../firebase.js'

const open = ref(false)
const fullPage = ref(false)
const mentionsTitle = ref('✅ Mentions légales – La P’tite Boutik Solidaire')
const mentionsContent = ref(`
<p><strong>Éditeur du site</strong><br>
Association Bras Ouverts de Morlaix — “La P’tite Boutik Solidaire"<br>
Siège social : 2 rue Jean‑Monnet, 29600 Morlaix<br>
Téléphone : 06 20 70 54 96</p>

<p><strong>Association loi 1901 à but non lucratif.</strong><br>
L’association ne perçoit pas de subventions publiques et n’emploie pas de salariés.<br>
Elle n’exerce aucune activité nécessitant un numéro SIRET ou des obligations fiscales spécifiques.</p>

<p><strong>Responsable de la publication</strong><br>
Association Bras Ouverts de Morlaix.</p>

<p><strong>Hébergement</strong><br>
Le site est hébergé par :<br>
Cloudflare, Inc.<br>
101 Townsend St, San Francisco, CA 94107, USA<br>
Site : <a href="https://www.cloudflare.com" target="_blank" rel="noopener">https://www.cloudflare.com</a></p>

<p><strong>Propriété intellectuelle</strong><br>
Les contenus présents sur ce site (textes, images, logos, photographies) sont la propriété de l’association ou de leurs auteurs. Toute reproduction, distribution ou modification nécessite une autorisation préalable.</p>

<p><strong>Protection des données</strong><br>
Le site ne collecte aucune donnée personnelle. Aucune information n’est transmise ou vendue à des tiers.</p>

<p><strong>Responsabilité</strong><br>
L’association s’efforce de fournir des informations exactes et à jour. Elle ne saurait être tenue responsable en cas d’erreur, d’omission ou d’indisponibilité du site.</p>
`)

// Listen for admin-managed textes in Firestore
onSnapshot(doc(db, 'config', 'textes'), snap => {
  if (!snap.exists()) return
  const data = snap.data()
  if (data.mentions_title) mentionsTitle.value = data.mentions_title
  if (data.mentions_content) mentionsContent.value = data.mentions_content
})

// open via global event — when opened we push a route so /mentions is reachable
const handler = () => {
  try { history.pushState(null, '', '/mentions') } catch (e) {}
  fullPage.value = true
  open.value = true
  // enable escape key to close
  const onKey = (e) => { if (e.key === 'Escape') close() }
  window.addEventListener('keydown', onKey)
  onUnmounted(() => window.removeEventListener('keydown', onKey))
}
onMounted(() => {
  window.addEventListener('open-mentions', handler)
  // if the user visited /mentions show full page
  try {
    if (window.location && window.location.pathname && window.location.pathname.includes('/mentions')) {
      fullPage.value = true
      open.value = true
    }
  } catch (e) {}
})
onUnmounted(() => {
  window.removeEventListener('open-mentions', handler)
})

const close = () => {
  open.value = false
  if (fullPage.value) {
    // go back to root without reloading if possible
    try { history.replaceState(null, '', '/') } catch (e) {}
  }
}

let purifier = null
// Try to dynamically load DOMPurify at runtime; if not available, fallback to a simple sanitizer.
onMounted(async () => {
  try {
    const mod = await import('dompurify')
    purifier = (mod && (mod.default || mod))
  } catch (e) {
    purifier = null
  }
})

const simpleSanitize = (input) => {
  if (!input) return ''
  // remove script/style tags
  let s = input.replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
  // remove on* attributes and javascript: URIs
  s = s.replace(/on\w+\s*=\s*"[^"]*"/gi, '')
  s = s.replace(/on\w+\s*=\s*'[^']*'/gi, '')
  s = s.replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"')
  s = s.replace(/href\s*=\s*'javascript:[^']*'/gi, "href='#'")
  return s
}

const sanitizedHtml = (html) => {
  if (!html) return ''
  try {
    if (purifier && typeof purifier.sanitize === 'function') {
      return purifier.sanitize(html, { ALLOWED_TAGS: ['b','i','em','strong','p','br','a','ul','ol','li','h3','h2','h4','small'] })
    }
  } catch (e) {
    // fall through to simple sanitizer
  }
  return simpleSanitize(html)
}
</script>

<style scoped>
.mentions-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1400;
  padding: 20px;
}
.mentions-content {
  background: #fff;
  max-width: 720px;
  width: 100%;
  border-radius: 10px;
  padding: 16px 18px;
  position: relative;
  box-shadow: 0 12px 40px rgba(0,0,0,0.25);
  color: var(--text-dark);
  max-height: 70vh; /* reduced height */
  overflow: hidden;
}
.mentions-content .mentions-body { height: calc(70vh - 120px); overflow-y: scroll; padding-right: 8px; -webkit-overflow-scrolling: touch; scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.18) transparent }

/* WebKit scrollbar styling */
.mentions-content .mentions-body::-webkit-scrollbar { width: 10px }
.mentions-content .mentions-body::-webkit-scrollbar-track { background: transparent }
.mentions-content .mentions-body::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.16); border-radius: 8px }
.mentions-content h2 { margin-top: 0; color: var(--primary-teal); font-size: 1.1rem }
.mentions-content h3 { color: var(--primary-coral); margin-bottom: 6px; font-size: 0.95rem }
.mentions-content p { line-height: 1.5; color: #333; font-size: 0.95rem }
.mentions-content a { color: var(--primary-teal); text-decoration: underline }
.mentions-close {
  position: absolute;
  right: 12px;
  top: 12px;
  background: var(--primary-coral);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
}
.mentions-content a { color: var(--primary-teal) }
</style>
