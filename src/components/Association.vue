<template>
  <section class="association">
    <h2>{{ titreAssociation }}</h2>
    <p>{{ associationTexte }}</p>
    <div class="values">
      <div class="value-card" v-for="value in values" :key="value.title">
        <div class="value-icon">{{ value.icon }}</div>
        <h3>{{ value.title }}</h3>
        <p>{{ value.description }}</p>
      </div>
    </div>
    <div class="donate-callout" v-if="donsVisible">
      <h3>Vous souhaitez donner ?</h3>
      <p>{{ donsTexte }}</p>
      <p>{{ donsTexte2 }}</p>
    </div>

    <div class="recognition">
      <h3>Ils nous font confiance</h3>
      <div class="badges">
        <button class="badge" @click="openModal('/documents/PHOTO-2026-05-02-21-17-283.jpg')" aria-label="Voir l'article de presse">
          <span class="badge-icon">📰</span>
          <span class="badge-text">À la une dans la presse locale</span>
        </button>
      </div>
    </div>

    <div class="modal-overlay" v-if="modalOpen" @click.self="closeModal" role="dialog" aria-modal="true" :aria-label="modalAlt">
      <div class="modal-content">
        <button class="modal-close" @click="closeModal" aria-label="Fermer la modale">✕</button>
        <img :src="modalImage" :alt="modalAlt" class="modal-image" />
        <a :href="modalImage" target="_blank" rel="noopener noreferrer" class="modal-link">Ouvrir en pleine taille</a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../firebase.js'

const modalOpen = ref(false)
const modalImage = ref('')
const modalAlt = ref('')

const titreAssociation = ref("L'Association Bras Ouverts")
const associationTexte = ref("L'Association Bras Ouverts de Morlaix est portée par des bénévoles engagées — mamans, amies et mamies — qui œuvrent chaque jour pour créer du lien social et soutenir les familles du territoire.")
const donsTexte  = ref("Nous acceptons avec gratitude vos dons de vêtements enfants (0-10 ans) en bon état, chaussures, matériel de puériculture et vêtements pour futures mamans.")
const donsTexte2 = ref("Apportez vos dons directement à la boutique aux horaires d'ouverture.")
const donsVisible = ref(true)

onMounted(() => {
  onSnapshot(doc(db, 'config', 'textes'), snap => {
    if (snap.exists()) {
      const data = snap.data()
      if (data.association_titre) titreAssociation.value = data.association_titre
      if (data.association_texte) associationTexte.value = data.association_texte
      if (data.dons_texte)  donsTexte.value  = data.dons_texte
      if (data.dons_texte2) donsTexte2.value = data.dons_texte2
      if (data.dons_visible !== undefined) donsVisible.value = data.dons_visible !== false && data.dons_visible !== 'false'
    }
  })
})

const openModal = (src) => {
  modalImage.value = src
  modalAlt.value = src.includes('284') ? 'Courrier de l\'Assemblée Nationale' : 'Article de presse'
  modalOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  modalOpen.value = false
  document.body.style.overflow = ''
}

const values = [
  {
    icon: '♻️',
    title: 'Recyclage',
    description: 'Donner une seconde vie aux vêtements et lutter contre le gaspillage textile.'
  },
  {
    icon: '🤝',
    title: 'Solidarité',
    description: 'Aider les familles à s\'équiper à prix accessible, dans le respect et la bienveillance.'
  },
  {
    icon: '💛',
    title: 'Convivialité',
    description: 'Créer un lieu chaleureux où chacun·e se sent attendu·e et bienvenu·e.'
  }
]
</script>

<style scoped>
.association {
  margin: 40px 0;
}

.association h2 {
  color: var(--primary-teal);
  margin-bottom: 15px;
}

.association > p {
  font-size: 1.05em;
  line-height: 1.7;
  margin-bottom: 30px;
  color: var(--text-dark);
}

.association strong {
  color: var(--primary-coral);
}

.values {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 35px;
}

.value-card {
  background: linear-gradient(135deg, #FFF9F0 0%, #F5E6D3 100%);
  padding: 25px 20px;
  border-radius: 12px;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 2px solid var(--secondary-beige);
}

.value-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(27, 169, 168, 0.15);
}

.value-icon {
  font-size: 2.5em;
  margin-bottom: 10px;
}

.value-card h3 {
  color: var(--primary-teal);
  margin-bottom: 8px;
  font-size: 1.15em;
}

.value-card p {
  color: var(--text-gray);
  font-size: 0.95em;
  line-height: 1.5;
}

.donate-callout {
  background: linear-gradient(135deg, #E95E5E15, #E95E5E08);
  border: 2px solid var(--primary-coral);
  border-radius: 12px;
  padding: 25px;
  text-align: center;
}

.donate-callout h3 {
  color: var(--primary-coral);
  margin-bottom: 12px;
  font-size: 1.2em;
}

.donate-callout p {
  color: var(--text-dark);
  line-height: 1.6;
  margin-bottom: 8px;
}

.recognition {
  margin-top: 35px;
  text-align: center;
}

.recognition h3 {
  color: var(--primary-teal);
  margin-bottom: 15px;
}

.badges {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 2px solid var(--primary-teal);
  color: var(--primary-teal);
  padding: 10px 18px;
  border-radius: 30px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9em;
  transition: all 0.3s;
  cursor: pointer;
  font-family: inherit;
}

.badge:hover {
  background: var(--primary-teal);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(27, 169, 168, 0.3);
}

.badge:focus {
  outline: 3px solid var(--coral);
  outline-offset: 2px;
}

.badge-icon {
  font-size: 1.2em;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modal-close {
  position: absolute;
  top: -15px;
  right: -15px;
  background: var(--primary-coral);
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 10;
}

.modal-close:hover {
  background: #d14545;
  transform: scale(1.1);
}

.modal-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
}

.modal-link {
  margin-top: 15px;
  color: var(--primary-teal);
  text-decoration: none;
  font-weight: 600;
  padding: 8px 16px;
  border: 2px solid var(--primary-teal);
  border-radius: 20px;
  transition: all 0.3s;
}

.modal-link:hover {
  background: var(--primary-teal);
  color: white;
}
</style>
