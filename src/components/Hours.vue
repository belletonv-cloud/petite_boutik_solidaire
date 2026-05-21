<template>
  <div class="hours" id="horaires">
    <h2>{{ titre }}</h2>
    <div class="hours-grid">
      <div class="hours-card" v-for="regle in regles" :key="regle.label" :style="{ borderColor: regle.color || '#1BA9A8' }">
        <span class="day-icon">{{ regle.emoji || '📅' }}</span>
        <p :style="{ color: regle.color || '#1BA9A8' }">{{ regle.texte_jours }}</p>
      </div>
      <div class="hours-card">
        <span class="day-icon">🕙</span>
        <p><strong>{{ plage }}</strong></p>
      </div>
      <div class="hours-card">
        <span class="day-icon">👥</span>
        <p>{{ benevoles }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../firebase.js'

const DEFAULT_REGLES = [
  { label: 'mercredi', texte_jours: '1ers et 3èmes mercredis' },
  { label: 'samedi',  texte_jours: '1ers et 3èmes samedis' },
]

const titre    = ref("Horaires d'ouverture")
const regles   = ref(DEFAULT_REGLES)
const plage    = ref('10h00 – 17h30 sans interruption')
const benevoles = ref('Accueil par une équipe de bénévoles (mamans, amies et mamies)')

let unsubHoraires = null

onMounted(() => {
  unsubHoraires = onSnapshot(doc(db, 'config', 'horaires'), snap => {
    if (!snap.exists()) return
    const d = snap.data()
    if (d.horaires_titre) titre.value    = d.horaires_titre
    if (d.regles && d.regles.length) regles.value = d.regles
    if (d.plage)     plage.value = d.plage
    if (d.benevoles) benevoles.value = d.benevoles
  }, () => {})
})

onUnmounted(() => { if (unsubHoraires) unsubHoraires() })
</script>

<style scoped>
.hours {
  margin: 40px 0;
}

.hours h2 {
  color: var(--primary-teal);
  margin-bottom: 20px;
  text-align: center;
}

.hours-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
}

.hours-card {
  background: linear-gradient(135deg, #E8F5F5 0%, #E0F2F1 100%);
  padding: 20px;
  border-radius: 12px;
  border: 2px solid var(--primary-teal);
  text-align: center;
}

.day-icon {
  font-size: 2em;
  display: block;
  margin-bottom: 10px;
}

.hours-card p {
  color: var(--text-dark);
  line-height: 1.6;
  margin: 0;
}

.hours-card strong {
  color: var(--primary-teal);
  font-weight: 700;
}
</style>
