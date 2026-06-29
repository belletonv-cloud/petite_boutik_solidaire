import { ref, computed, onMounted, onUnmounted } from 'vue'
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore'
import { db } from '../firebase.js'

const DEFAULT_REGLES = [
  { jour: 3, semaines: [1, 3], label: 'mercredi' },
  { jour: 6, semaines: [1, 3], label: 'samedi' },
]

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function nthWeekday(y, m, wd, n) {
  const first = new Date(y, m, 1)
  return new Date(y, m, 1 + ((wd - first.getDay() + 7) % 7) + (n - 1) * 7)
}

// Composable partagé : statut d'ouverture (mêmes règles que le calendrier).
export function useOpeningStatus() {
  const regles = ref(DEFAULT_REGLES)
  const closures = ref([])
  const plage = ref('10h00 – 17h30')
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
      if (d.regles?.length) regles.value = d.regles
      if (d.plage) plage.value = d.plage
    }, () => {})
  })

  onUnmounted(() => {
    if (unsubClosures) unsubClosures()
    if (unsubHoraires) unsubHoraires()
  })

  function openingDates() {
    const out = []
    const today = new Date(); today.setHours(0, 0, 0, 0)
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
    const t = new Date(); t.setHours(0, 0, 0, 0)
    return openingDates().some(d => iso(d) === iso(t))
  })

  // Date de la prochaine ouverture (hors aujourd'hui), objet Date ou null
  const nextDate = computed(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0)
    return openingDates().find(d => iso(d) !== iso(t)) || null
  })

  const nextOpening = computed(() =>
    nextDate.value
      ? nextDate.value.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      : ''
  )

  return { openToday, nextOpening, nextDate, plage }
}
