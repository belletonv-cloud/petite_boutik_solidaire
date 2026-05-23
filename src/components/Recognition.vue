<template>
  <div class="recognition" v-if="items && items.length">
    <h3>Ils nous font confiance</h3>
    <div class="badges">
      <template v-for="(r, i) in items" :key="i">
        <button class="badge" type="button" :data-recognition-index="i" @click="openModal(r,i)" :aria-label="r.alt || r.text || 'Badge'">
          <span class="badge-text">{{ r.text || r.title || r.name }}</span>
        </button>
      </template>
    </div>

    <Modal v-model="modalOpen" :title="modalAlt" @close="onModalClose">
      <div style="display:flex;align-items:center;justify-content:center;">
        <img :src="modalImage" :alt="modalAlt" class="trust-modal-img" style="max-width:100%;max-height:70vh;object-fit:contain;border-radius:8px;display:block;margin:0 auto" />
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import Modal from './Modal.vue'

const props = defineProps({ items: { type: Array, default: () => [] } })
const emit = defineEmits([])

const modalOpen = ref(false)
const modalImage = ref('')
const modalAlt = ref('')
let _lastBadgeEl = null

let purifier = null
onMounted(() => {
  import('dompurify').then(m => { purifier = m && (m.default || m) }).catch(() => { purifier = null })
})

const sanitizeIconSafe = (html) => {
  if (!html) return ''
  try {
    if (purifier && purifier.sanitize) {
      const out = purifier.sanitize(html, { ALLOWED_TAGS: [] })
      return out
    }
  } catch (e) {}
  return String(html).replace(/<[^>]*>/g, '')
}

const openModal = async (r, idx) => {
  if (!r || !r.src) return
  try { _lastBadgeEl = document.querySelector(`.badge[data-recognition-index="${idx}"]`) } catch (e) { _lastBadgeEl = null }
  try { modalImage.value = r.src ? new URL(r.src, window.location.href).href : r.src } catch (e) { modalImage.value = r.src }
  modalAlt.value = r.alt || r.text || r.title || 'Article'
  modalOpen.value = true
  await nextTick()
}

const onModalClose = () => {
  try {
    if (_lastBadgeEl && typeof _lastBadgeEl.focus === 'function') {
      _lastBadgeEl.focus()
      _lastBadgeEl = null
    }
  } catch (e) {}
}
</script>

<style scoped>
.recognition { margin-top: 35px; text-align: center }
.badges { display:flex; justify-content:center; gap:15px; flex-wrap:wrap }
.badge { display:inline-flex; align-items:center; gap:6px; background:white; border:2px solid var(--primary-teal); color:var(--primary-teal); padding:8px 14px; border-radius:24px; font-weight:600; cursor:pointer }
.badge-icon { display:none }
.badge-image { display:none }
.badge-text { display:block; max-width: 12rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
@media (max-width:600px) { 
  .badge{ padding:8px 12px }
  .badge-image{ display:none }
  .badge-text{ max-width: calc(100vw - 96px); font-size: 0.95em }
}

/* modal styles (same pattern as MentionsLegales.vue) */
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
  max-height: 70vh;
  overflow: hidden;
}
.mentions-content .mentions-body { height: calc(70vh - 120px); overflow-y: scroll; padding-right: 8px; -webkit-overflow-scrolling: touch; scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.18) transparent }
.mentions-content .mentions-body::-webkit-scrollbar { width: 10px }
.mentions-content .mentions-body::-webkit-scrollbar-track { background: transparent }
.mentions-content .mentions-body::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.16); border-radius: 8px }
.mentions-content h2 { margin-top: 0; color: var(--primary-teal); font-size: 1.1rem }
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
</style>
