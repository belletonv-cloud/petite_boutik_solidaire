<template>
  <div class="open-status" v-if="openToday" role="status">
    <span class="os-pulse" aria-hidden="true"></span>
    <div class="os-text">
      <strong class="os-title">C'est ouvert aujourd'hui&nbsp;!</strong>
      <span class="os-sub">La P'tite Boutik Solidaire vous accueille · {{ plage }}</span>
    </div>
  </div>
  <a class="open-next" v-else-if="nextOpening" href="#horaires">
    <span class="on-dot" aria-hidden="true"></span>
    Prochaine ouverture&nbsp;: <strong>{{ nextOpening }}</strong>
  </a>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore'
import { db } from '../firebase.js'

const DEFAULT_REGLES = [
  { jour: 3, semaines: [1, 3], label: 'mercredi' },
  { jour: 6, semaines: [1, 3], label: 'samedi' },
]

const regles = ref(DEFAULT_REGLES)
const plage  = ref('10h00 – 17h30')
const closures = ref([])
let unsubClosures = null
let unsubHoraires = null

onMounted(() => {
  unsubClosures = onSnapshot(
    query(collection(db, 'fermetures'), orderBy('date')),
    snap => { closures.value = snap.docs.map(d => d.data().date) },
    () => {}
  )
  unsubHoraires = onSnapshot(doc(db, 'config', 'horaires'), snap => {
    if (!snap.exists()) return
    const d = snap.data()
    if (d.regles && d.regles.length) regles.value = d.regles
    if (d.plage) plage.value = d.plage
  }, () => {})
})

onUnmounted(() => {
  if (unsubClosures) unsubClosures()
  if (unsubHoraires) unsubHoraires()
})

const iso = (date) =>
  `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`

function nthWeekdayOfMonth(year, month, weekday, n) {
  const first = new Date(year, month, 1)
  const diff = (weekday - first.getDay() + 7) % 7
  return new Date(year, month, 1 + diff + (n - 1) * 7)
}

// Toutes les dates d'ouverture sur ~3 mois, triées
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
        const date = nthWeekdayOfMonth(y, m, jour, occ)
        if (date >= today && date <= end && !closures.value.includes(iso(date))) out.push(date)
      }
    }
    cursor.setMonth(cursor.getMonth() + 1)
  }
  out.sort((a, b) => a - b)
  return out
}

const openToday = computed(() => {
  const today = new Date(); today.setHours(0,0,0,0)
  return openingDates().some(d => iso(d) === iso(today))
})

const nextOpening = computed(() => {
  const today = new Date(); today.setHours(0,0,0,0)
  const next = openingDates().find(d => iso(d) !== iso(today))
  if (!next) return ''
  return next.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
})
</script>

<style scoped>
.open-status {
  display: flex; align-items: center; gap: 14px;
  background: linear-gradient(135deg, #16c060 0%, #0a9a78 100%);
  color: #fff;
  padding: 14px 22px;
  border-radius: 14px;
  margin: 0 0 16px;
  box-shadow: 0 6px 22px rgba(16,170,100,0.38);
  animation: osIn 0.4s ease;
}
.os-pulse {
  flex-shrink: 0;
  width: 16px; height: 16px; border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 0 rgba(255,255,255,0.7);
  animation: osPulse 1.6s infinite;
}
.os-text { display: flex; flex-direction: column; line-height: 1.25; }
.os-title { font-size: 1.35em; font-weight: 800; letter-spacing: 0.01em; }
.os-sub { font-size: 0.92em; opacity: 0.95; }

.open-next {
  display: inline-flex; align-items: center; gap: 8px;
  background: #fff7ed; color: var(--primary-coral, #e8744f);
  border: 1.5px solid var(--primary-coral, #e8744f);
  padding: 8px 16px; border-radius: 999px;
  font-size: 0.9em; text-decoration: none;
  margin: 0 0 16px;
}
.open-next:hover { background: #ffeede; }
.on-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--primary-coral, #e8744f); }

@keyframes osPulse {
  0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.7); }
  70%  { box-shadow: 0 0 0 14px rgba(255,255,255,0); }
  100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
}
@keyframes osIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (max-width: 600px) {
  .os-title { font-size: 1.12em; }
  .os-sub { font-size: 0.82em; }
}
</style>
