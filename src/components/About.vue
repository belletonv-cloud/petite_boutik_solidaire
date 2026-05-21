<template>
  <section class="about">
    <h2>{{ titre }}</h2>
    <p>{{ texte }}</p>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../firebase.js'

const titre = ref('À propos')
const texte = ref("La P'tite Boutik Solidaire ouvre ses portes au 2, rue Jean-Monnet à Morlaix. Portée par l'Association Bras Ouverts de Morlaix, l'objectif de ce nouveau lieu est d'encourager le recyclage, de favoriser la convivialité à travers la mode enfantine responsable et d'aider les familles.")

onMounted(() => {
  onSnapshot(doc(db, 'config', 'textes'), snap => {
    if (!snap.exists()) return
    const d = snap.data()
    if (d.about_titre) titre.value = d.about_titre
    if (d.about_texte) texte.value = d.about_texte
  })
})
</script>

<style scoped>
.about {
  margin-bottom: 25px;
  padding: 25px;
  background: var(--secondary-cream);
  border-radius: 12px;
  border-left: 5px solid var(--primary-teal);
}

.about h2 {
  color: var(--primary-teal);
  margin-bottom: 12px;
}

.about p {
  line-height: 1.7;
  font-size: 1.05em;
  color: var(--text-dark);
}

.about strong {
  color: var(--primary-coral);
  font-weight: 600;
}
</style>
