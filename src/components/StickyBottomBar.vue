<template>
  <div class="sticky-bar">
    <div class="bar-inner">
      <a :href="'tel:' + phoneRaw" class="bar-item bar-phone">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        {{ phone }}
      </a>
      <span class="bar-sep"></span>
      <span class="bar-item bar-address">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        {{ address }}
      </span>
      <span class="bar-sep"></span>
      <span class="bar-item bar-hours">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        {{ hours }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../firebase.js'

const phone = ref('06 20 70 54 96')
const phoneRaw = ref('0620705496')
const address = ref('2 rue Jean-Monnet, Morlaix')
const hours = ref('1er/3e mer. & sam. 10h-17h30')

onMounted(() => {
  onSnapshot(doc(db, 'config', 'textes'), snap => {
    if (!snap.exists()) return
    const d = snap.data()
    if (d.sticky_phone) phone.value = d.sticky_phone
    if (d.sticky_phone_raw) phoneRaw.value = d.sticky_phone_raw
    if (d.sticky_address) address.value = d.sticky_address
    if (d.sticky_hours) hours.value = d.sticky_hours
  })
})
</script>

<style scoped>
.sticky-bar {
  position: fixed;
  bottom: env(safe-area-inset-bottom, 0);
  left: 0;
  right: 0;
  z-index: 700;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid #e8e8e8;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  will-change: transform;
  touch-action: manipulation;
}

/* When modal is open, ensure sticky bar does not intercept pointer events */
body.modal-open .sticky-bar { pointer-events: none; }

.bar-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 8px 12px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0));
  gap: 6px;
  font-size: 0.78em;
}

.bar-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--text-gray);
  white-space: nowrap;
}

.bar-phone {
  color: var(--primary-teal);
  font-weight: 600;
  text-decoration: none;
}

.bar-phone:hover {
  text-decoration: underline;
}

.bar-sep {
  width: 1px;
  height: 14px;
  background: #ddd;
  flex-shrink: 0;
}

.bar-hours {
  color: var(--text-light);
}

@media (max-width: 640px) {
  .bar-inner {
    flex-wrap: wrap;
    gap: 3px 8px;
    padding: 6px 10px;
    font-size: 0.72em;
  }
  .bar-sep:nth-child(4) {
    display: none;
  }
  .bar-hours {
    width: 100%;
    justify-content: center;
    color: var(--text-light);
    font-size: 0.92em;
  }
}

@media (max-width: 420px) {
  .bar-inner {
    font-size: 0.65em;
    padding: 5px 8px;
  }
  .bar-sep:nth-child(2) {
    display: none;
  }
}
</style>
