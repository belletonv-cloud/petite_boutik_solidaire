<template>
  <div class="recognition" v-if="items && items.length">
    <h3>Ils nous font confiance</h3>
    <div class="badges">
      <template v-for="(r, i) in items" :key="i">
        <button v-if="r.src" class="badge" type="button" :data-recognition-index="i" @click="openModal(r,i)" :aria-label="r.alt || r.text || 'Badge'">
          <img v-if="r.src" :src="r.src" :alt="r.alt || r.text || r.title || 'Badge'" class="badge-image" loading="lazy" decoding="async" />
          <span class="badge-icon" v-if="r.icon" v-html="sanitizeIconSafe(r.icon)"></span>
          <span class="badge-text">{{ r.text || r.title || r.name }}</span>
        </button>
        <div v-else class="badge" :aria-label="r.alt || 'Badge'">
          <span class="badge-icon" v-if="r.icon" v-html="sanitizeIconSafe(r.icon)"></span>
          <span class="badge-text">{{ r.text || r.title || r.name }}</span>
        </div>
      </template>
    </div>

    <Modal v-model:modelValue="modalOpen" :title="modalAlt" @close="onModalClose">
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
.badge { display:inline-flex; align-items:center; gap:8px; background:white; border:2px solid var(--primary-teal); color:var(--primary-teal); padding:10px 18px; border-radius:30px; font-weight:600; cursor:pointer }
.badge-image { width:56px; height:56px; object-fit:cover; border-radius:8px }
@media (max-width:600px) { .badge{ padding:8px 12px } .badge-image{ width:42px; height:42px } }
</style>
