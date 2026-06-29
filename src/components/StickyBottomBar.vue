<template>
  <div class="sticky-bar" :class="{ 'is-open': openToday }">
    <div class="bar-status" :class="openToday ? 'open' : 'closed'">
      <span class="status-dot" aria-hidden="true"></span>
      <template v-if="openToday">Ouvert aujourd'hui</template>
      <template v-else-if="nextOpening">Fermé · ouvert {{ nextOpening }}</template>
      <template v-else>Fermé aujourd'hui</template>
    </div>
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
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useTextes } from '../composables/useTextes.js'

const textes = useTextes()
const phone    = computed(() => textes.value.sticky_phone    || '06 20 70 54 96')
const phoneRaw = computed(() => textes.value.sticky_phone_raw || '0620705496')
const address  = computed(() => textes.value.sticky_address  || '2 rue Jean-Monnet, Morlaix')
const hours    = computed(() => textes.value.sticky_hours    || '1er/3e mer. & sam. 10h-17h30')

// ── Statut d'ouverture (mêmes règles que le calendrier) ───────────────────────
const DEFAULT_REGLES = [
  { jour: 3, semaines: [1, 3], label: 'mercredi' },
  { jour: 6, semaines: [1, 3], label: 'samedi' },
]
const regles = ref(DEFAULT_REGLES)
const closures = ref([])
let unsubClosures = null, unsubHoraires = null

onMounted(() => {
  unsubClosures = onSnapshot(
    query(collection(db, 'fermetures'), orderBy('date')),
    snap => { closures.value = snap.docs.map(d => d.data().date) },
    () => {}
  )
  unsubHoraires = onSnapshot(doc(db, 'config', 'horaires'), snap => {
    if (snap.exists() && snap.data().regles?.length) regles.value = snap.data().regles
  }, () => {})
})
onUnmounted(() => {
  if (unsubClosures) unsubClosures()
  if (unsubHoraires) unsubHoraires()
})

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
function nthWeekday(y, m, wd, n) {
  const first = new Date(y, m, 1)
  return new Date(y, m, 1 + ((wd - first.getDay() + 7) % 7) + (n - 1) * 7)
}
function openingDates() {
  const out = []
  const today = new Date(); today.setHours(0,0,0,0)
  const end = new Date(today); end.setMonth(end.getMonth() + 3)
  const cursor = new Date(today.getFullYear(), today.getMonth(), 1)
  while (cursor <= end) {
    const y = cursor.getFullYear(), m = cursor.getMonth()
    for (const r of regles.value) {
      const jour = typeof r.jour === 'number' ? r.jour : parseInt(r.jour)
      if (isNaN(jour)) continue
      for (const occ of (r.semaines || [1, 3])) {
        const date = nthWeekday(y, m, jour, occ)
        if (date >= today && date <= end && !closures.value.includes(iso(date))) out.push(date)
      }
    }
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return out.sort((a, b) => a - b)
}
const openToday = computed(() => {
  const t = new Date(); t.setHours(0,0,0,0)
  return openingDates().some(d => iso(d) === iso(t))
})
const nextOpening = computed(() => {
  const t = new Date(); t.setHours(0,0,0,0)
  const next = openingDates().find(d => iso(d) !== iso(t))
  return next ? next.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''
})
</script>

<style scoped>
.sticky-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 700;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid #e8e8e8;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
  backface-visibility: hidden;
  overscroll-behavior: none;
  touch-action: pan-y;
}

/* When modal is open, ensure sticky bar does not intercept pointer events */
body.modal-open .sticky-bar { pointer-events: none; }

/* Bandeau de statut intégré au-dessus de la barre */
.bar-status {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 0.82em; font-weight: 700; letter-spacing: 0.02em;
  padding: 7px 12px;
  text-transform: uppercase;
}
.bar-status.open {
  color: #fff;
  background: linear-gradient(135deg, #1BA9A8 0%, #16937f 100%);
}
.bar-status.closed {
  color: var(--text-gray);
  background: #f3f1ec;
  text-transform: none;
  font-weight: 600;
  font-size: 0.78em;
}
.status-dot {
  width: 9px; height: 9px; border-radius: 50%;
  flex-shrink: 0;
}
.bar-status.open .status-dot {
  background: #fff;
  box-shadow: 0 0 0 0 rgba(255,255,255,0.75);
  animation: barPulse 1.7s infinite;
}
.bar-status.closed .status-dot { background: #c3bdb0; }
@keyframes barPulse {
  0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.75); }
  70%  { box-shadow: 0 0 0 9px rgba(255,255,255,0); }
  100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
}

.bar-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: var(--site-max-width, 800px);
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
