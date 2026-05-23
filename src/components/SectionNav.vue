<template>
  <nav class="section-nav">
    <div class="nav-inner">
      <div class="nav-brand">
        <img src="@/assets/logo.jpg" alt="Logo" class="nav-logo" />
      </div>

      <div class="nav-links">
        <a
          v-for="sec in sections"
          :key="sec.id"
          :href="`#${sec.id}`"
          class="nav-link"
          :class="{ active: activeId === sec.id }"
          @click="onClick(sec.id)"
        >{{ sec.label }}</a>
      </div>

      <button class="nav-burger" @click="toggleMenu" aria-label="Menu">
        <span class="burger-line"></span>
        <span class="burger-line"></span>
        <span class="burger-line"></span>
      </button>
    </div>

    <div class="nav-dropdown" :class="{ open }">
      <a
        v-for="sec in sections"
        :key="sec.id"
        :href="`#${sec.id}`"
        class="dropdown-link"
        :class="{ active: activeId === sec.id, 'touch-active': touchedId === sec.id }"
        @click="onClick(sec.id)"
        @touchstart="onTouchStart(sec.id)"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
      >{{ sec.label }}</a>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  sections: {
    type: Array,
    required: true
  }
})

const open = ref(false)
const activeId = ref('')
const touchedId = ref(null)

let lastClickedId = null
let clickTimeout = null
let scrollTick = null

function toggleMenu() {
  open.value = !open.value
}

function onClick(id) {
  lastClickedId = id
  activeId.value = id
  open.value = false
  if (clickTimeout) clearTimeout(clickTimeout)
  clickTimeout = setTimeout(() => { lastClickedId = null }, 1200)
}

function onTouchStart(id) {
  touchedId.value = id
}

function onTouchEnd() {
  touchedId.value = null
}

function refreshActive() {
  if (lastClickedId) return

  let best = null
  let bestDist = Infinity
  for (const sec of props.sections) {
    const el = document.getElementById(sec.id)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    if (rect.bottom <= 0) continue
    const dist = Math.abs(rect.top - 56)
    if (dist < bestDist) {
      bestDist = dist
      best = sec.id
    }
  }
  if (best) activeId.value = best
}

function onScroll() {
  if (scrollTick) return
  scrollTick = requestAnimationFrame(() => {
    refreshActive()
    scrollTick = null
  })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  refreshActive()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  if (scrollTick) cancelAnimationFrame(scrollTick)
  if (clickTimeout) clearTimeout(clickTimeout)
})
</script>

<style scoped>
.section-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 800;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.nav-inner {
  display: flex;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 8px;
  position: relative;
  min-height: 48px;
  gap: 4px;
}

/* ==================== Brand ==================== */
.nav-brand {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.nav-logo {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

/* ==================== Desktop links ==================== */
.nav-links {
  display: flex;
  align-items: center;
  gap: 1px;
  margin-left: auto;
}

.nav-link {
  flex-shrink: 0;
  padding: 6px 5px;
  font-size: 0.7em;
  color: var(--text-gray);
  text-decoration: none;
  border-radius: 4px;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.nav-link:hover,
.nav-link:focus-visible {
  color: white;
  background: var(--primary-teal);
  text-decoration: none;
}

.nav-link.active {
  color: white;
  background: var(--primary-teal);
  font-weight: 600;
}

/* ==================== Mobile burger ==================== */
.nav-burger {
  display: none;
  margin-left: auto;
  width: 36px;
  height: 36px;
  border: none;
  background: var(--primary-teal);
  border-radius: 6px;
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-shrink: 0;
}

.burger-line {
  display: block;
  width: 18px;
  height: 2.5px;
  background: white;
  border-radius: 2px;
}

.nav-burger:active {
  opacity: 0.8;
}

/* ==================== Mobile dropdown ==================== */
.nav-dropdown {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  padding: 6px 0;
  max-height: 60vh;
  overflow-y: auto;
}

.nav-dropdown.open {
  display: block;
}

.dropdown-link {
  display: block;
  padding: 12px 20px;
  font-size: 0.95em;
  color: var(--text-dark);
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: var(--primary-teal);
}

.dropdown-link:hover,
.dropdown-link:focus-visible,
.dropdown-link:focus {
  background: var(--primary-teal) !important;
  color: white !important;
  text-decoration: none !important;
}

.dropdown-link:active {
  background: var(--primary-teal) !important;
  color: white !important;
}

.dropdown-link.active {
  background: #e8f3f3;
  color: var(--primary-teal-dark);
  font-weight: 600;
}

.dropdown-link.touch-active {
  background: var(--primary-teal) !important;
  color: white !important;
}

/* ==================== Responsive ==================== */
@media (max-width: 767px) {
  .nav-links { display: none; }
  .nav-burger { display: flex; }
  .nav-dropdown { position: fixed; top: 48px; }
}

@media (min-width: 768px) and (max-width: 899px) {
  .nav-link { padding: 6px 4px; font-size: 0.68em; }
}
</style>
