<template>
  <teleport to="body">
    <div v-if="modelValue" class="app-modal-overlay" @click.self="close" role="dialog" aria-modal="true" :aria-label="title || 'Modale'" data-open="true">
      <div class="app-modal-content" ref="content" tabindex="-1">
        <button class="app-modal-close" @click="close" aria-label="Fermer la modale">✕</button>
        <h2 v-if="title" class="app-modal-title">{{ title }}</h2>
        <div class="app-modal-body">
          <slot />
        </div>
        <div v-if="footer" class="app-modal-footer">{{ footer }}</div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { onMounted, onUnmounted, watch, ref, nextTick } from 'vue'
const props = defineProps({ modelValue: { type: Boolean, default: false }, title: { type: String, default: '' }, footer: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue','close'])
const content = ref(null)

const close = () => {
  // ensure body scroll is always restored when closing the modal
  try { document.body.style.overflow = '' } catch (e) {}
  emit('update:modelValue', false)
  emit('close')
}

const onKey = (e) => { if (e.key === 'Escape') close() }

let _previousActive = null
const interceptorSelectors = ['.sticky-bar', '.section-nav', '.nav-inner']
const disableInterceptors = () => {
  try {
    interceptorSelectors.forEach(sel => document.querySelectorAll(sel).forEach(el => {
      if (!el.dataset.__oldPointer) el.dataset.__oldPointer = el.style.pointerEvents || ''
      el.style.pointerEvents = 'none'
    }))
  } catch (e) { /* ignore */ }
}
const restoreInterceptors = () => {
  try {
    interceptorSelectors.forEach(sel => document.querySelectorAll(sel).forEach(el => {
      if (el.dataset && Object.prototype.hasOwnProperty.call(el.dataset, '__oldPointer')) {
        el.style.pointerEvents = el.dataset.__oldPointer || ''
        delete el.dataset.__oldPointer
      }
    }))
  } catch (e) { /* ignore */ }
}

watch(() => props.modelValue, async (open) => {
  if (open) {
    // save previous focused element to restore focus on close
    try { _previousActive = document.activeElement } catch (e) { _previousActive = null }
    document.body.style.overflow = 'hidden'
    try { document.body.classList.add('modal-open') } catch (e) {}
    disableInterceptors()
    await nextTick()
    // focus content for accessibility and ensure it's visible
    if (content.value && typeof content.value.focus === 'function') {
      content.value.focus()
      try { content.value.scrollIntoView({ block: 'center', behavior: 'auto' }) } catch (e) {}
    }
    window.addEventListener('keydown', onKey)
  } else {
    // restore previous active focus
    if (_previousActive && typeof _previousActive.focus === 'function') {
      try { _previousActive.focus() } catch (e) {}
    }
    _previousActive = null
    document.body.style.overflow = ''
    try { document.body.classList.remove('modal-open') } catch (e) {}
    restoreInterceptors()
    window.removeEventListener('keydown', onKey)
  }
})

onUnmounted(() => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; try { document.body.classList.remove('modal-open') } catch (e) {} })
</script>

<style scoped>
.app-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999; /* very high to avoid interception */
  padding: 20px;
}
.app-modal-overlay__backdrop { position: absolute; inset:0; background: rgba(0,0,0,0.6) }
.app-modal-wrapper { position: relative; z-index: 1; display:flex; align-items:center; justify-content:center; width:100% }
.app-modal-content {
  background: #fff;
  max-width: 720px;
  width: 100%;
  max-height: 80vh;
  border-radius: 10px;
  padding: 18px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative; /* ensure close button stacks correctly */
}
.app-modal-title { margin: 0 0 8px 0; color: var(--primary-teal); font-size: 1rem; font-weight: 700; text-align: center; line-height: 1.2; padding: 6px 48px 0; max-width: calc(100% - 96px); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.app-modal-body { overflow: auto; padding-right: 8px; -webkit-overflow-scrolling: touch }
.app-modal-close {
  position: absolute;
  right: 12px;
  top: 12px;
  background: var(--primary-coral);
  color: white;
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  z-index: 3;
}

@media (max-width: 520px) {
  .app-modal-close { width:48px; height:48px; font-size:20px; right:10px; top:10px }
}
.app-modal-footer { margin-top: 12px }

/* small entrance animation */
.app-modal-content { transform: translateY(8px) scale(.995); opacity: 0; transition: transform 200ms ease, opacity 160ms ease }
.app-modal-overlay[data-open="true"] .app-modal-content, .app-modal-content:focus { transform: translateY(0) scale(1); opacity: 1 }
</style>
