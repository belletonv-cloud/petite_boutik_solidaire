<template>
  <section class="calendar">
    <h2>{{ titre }}</h2>
    <div class="next-dates">
      <h3>Prochaines ouvertures</h3>
      <div class="dates-list">
          <div
            class="date-item"
            :class="{ 'closed': date.closed }"
            v-for="date in nextDates"
            :key="date.iso"
            :style="{ borderLeftColor: date.color || '#1BA9A8' }"
          >
          <span class="date-day" :style="{ color: date.color || '#1BA9A8' }">{{ date.day }}</span>
          <span class="date-full">{{ date.label }}</span>
          <span class="date-closed-label" v-if="date.closed">{{ date.closedLabel || 'Fermé exceptionnellement' }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore'
import { db } from '../firebase.js'

// Règles d'ouverture par défaut (1ers et 3èmes mercredis + samedis)
const DEFAULT_REGLES = [
  { jour: 3, semaines: [1, 3], label: 'mercredi' },
  { jour: 6, semaines: [1, 3], label: 'samedi' },
]

const regles = ref(DEFAULT_REGLES)
const titre  = ref("Calendrier d'ouverture")
const firestoreClosures = ref([])
let unsubClosures = null
let unsubHoraires = null

onMounted(() => {
  // Fermetures exceptionnelles
  unsubClosures = onSnapshot(
    query(collection(db, 'fermetures'), orderBy('date')),
    snap => { firestoreClosures.value = snap.docs.map(d => ({ date: d.data().date, label: d.data().label || '' })) },
    () => {}
  )
  // Règles de récurrence depuis config/horaires
  unsubHoraires = onSnapshot(doc(db, 'config', 'horaires'), snap => {
    if (!snap.exists()) return
    const d = snap.data()
    if (d.titre_calendrier) titre.value = d.titre_calendrier
    if (d.regles && d.regles.length) {
      regles.value = d.regles
    } else {
      regles.value = DEFAULT_REGLES
    }
  }, () => {})
})

onUnmounted(() => {
  if (unsubClosures) unsubClosures()
  if (unsubHoraires) unsubHoraires()
})

function nthWeekdayOfMonth(year, month, weekday, n) {
  const first = new Date(year, month, 1)
  const diff = (weekday - first.getDay() + 7) % 7
  const day = 1 + diff + (n - 1) * 7
  return new Date(year, month, day)
}

function getOpeningDates(monthsAhead = 3) {
  const dates = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(today)
  end.setMonth(end.getMonth() + monthsAhead)
  const cursor = new Date(today.getFullYear(), today.getMonth(), 1)

  while (cursor <= end) {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    for (const regle of regles.value) {
      const jourNum = typeof regle.jour === 'number' ? regle.jour : parseInt(regle.jour)
      const semaines = regle.semaines || [1, 3]
      for (const occ of semaines) {
        const date = nthWeekdayOfMonth(year, month, jourNum, occ)
        if (date >= today && date <= end) {
          dates.push({ date, label_jour: regle.label || 'ouverture', color: regle.color || '#1BA9A8' })
        }
      }
    }
    cursor.setMonth(cursor.getMonth() + 1)
  }

  dates.sort((a, b) => a.date - b.date)
  return dates
}

const nextDates = computed(() => {
  const closedMap = {}
  firestoreClosures.value.forEach(c => { closedMap[c.date] = c.label || 'Fermé exceptionnellement' })

  return getOpeningDates(3)
    .slice(0, 9)
    .map(item => {
      const { date, label_jour, color } = item
      const iso = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
      return {
        iso,
        label_jour,
        color,
        closed: !!closedMap[iso],
        closedLabel: closedMap[iso] || '',
        day: date.toLocaleDateString('fr-FR', { weekday: 'long' }),
        label: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      }
    })
    .filter((_, idx, arr) => {
      const openCount = arr.slice(0, idx + 1).filter(d => !d.closed).length
      return openCount <= 8
    })
})
</script>

<style scoped>
.calendar {
  margin: 40px 0;
  text-align: center;
}

.calendar h2 {
  color: var(--primary-teal);
  margin-bottom: 20px;
}

.next-dates {
  background: linear-gradient(135deg, #FFF9F0 0%, #F5E6D3 100%);
  padding: 25px;
  border-radius: 12px;
  border: 2px solid var(--secondary-beige);
}

.next-dates h3 {
  color: var(--primary-teal);
  margin-bottom: 15px;
  font-size: 1.1em;
}

.dates-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.date-item {
  background: white;
  border-radius: 10px;
  padding: 12px 16px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-left: 4px solid var(--primary-teal);
}

.date-day {
  font-size: 0.8em;
  text-transform: capitalize;
  font-weight: 700;
  color: var(--primary-teal);
}

/* Couleurs par label de jour — mercredi = teal, samedi = coral, autres = teal par défaut */
.date-item.mercredi { border-left-color: var(--primary-teal); }
.date-item.mercredi .date-day { color: var(--primary-teal); }
.date-item.samedi { border-left-color: var(--primary-coral); }
.date-item.samedi .date-day { color: var(--primary-coral); }

.date-full {
  font-size: 0.95em;
  color: var(--text-dark);
  font-weight: 500;
}

.date-item.closed {
  opacity: 0.6;
  background: #fff5f5;
  border-left-color: #ccc !important;
}

.date-item.closed .date-day,
.date-item.closed .date-full {
  text-decoration: line-through;
  color: var(--text-gray);
}

.date-closed-label {
  font-size: 0.75em;
  color: var(--primary-coral);
  font-style: italic;
  margin-top: 2px;
}
</style>
