<template>
  <div class="products">
    <h2>{{ titreSection }}</h2>
    <p>{{ sousTitre }}</p>
    <div class="products-list">
      <div class="product-item" v-for="item in products" :key="item.texte">
        <span class="product-icon">{{ item.emoji || '👕' }}</span>
        <span>{{ item.texte }}</span>
      </div>
    </div>

    <div class="brands">
      <h3>{{ titreMarques }}</h3>
      <div class="brands-list">
        <span class="brand-tag" v-for="brand in brands" :key="brand">{{ brand }}</span>
      </div>
    </div>

    <div class="prices">
      <h3>{{ titreTarifs }}</h3>
      <div class="prices-grid">
        <div class="price-item" v-for="p in prices" :key="p.label">
          <span class="price-label">{{ p.label }}</span>
          <span class="price-value">{{ p.price }}</span>
        </div>
      </div>
    </div>

    <p class="welcome"><strong>{{ bienvenue }}</strong></p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../firebase.js'

const titreSection = ref('Ce que nous proposons')
const sousTitre    = ref('Vêtements de seconde main en excellent état :')
const titreMarques = ref('Des marques de qualité')
const titreTarifs  = ref('Exemples de tarifs')
const bienvenue    = ref('Soyez les bienvenu(e)s !')

const DEFAULT_PRODUCTS = [
  { emoji: '👕', texte: 'Vêtements pour les enfants de 0 à 10 ans' },
  { emoji: '👟', texte: 'Chaussures' },
  { emoji: '🧸', texte: "Jouets, tapis d'éveil, livres" },
  { emoji: '🛒', texte: 'Matériel de puériculture (poussettes, siège auto, écharpe de portage, chaise haute…)' },
  { emoji: '🤱', texte: 'Vêtements pour futures mamans' },
]
const DEFAULT_BRANDS = ['Sergent Major','Okaidi','Jacadi','Vert Baudet','IKKS','Du Pareil au Même','Petit Bateau','Terre de Marins','Nike','…']
const DEFAULT_PRICES = [
  { label: 'Hauts', price: '1,00 €' },
  { label: 'Bas',   price: '1,50 €' },
  { label: 'Chaussures', price: '2,00 €' },
]

const products = ref([...DEFAULT_PRODUCTS])
const brands   = ref([...DEFAULT_BRANDS])
const prices   = ref([...DEFAULT_PRICES])

let unsub = null
onMounted(() => {
  unsub = onSnapshot(doc(db, 'config', 'textes'), snap => {
    if (!snap.exists()) return
    const d = snap.data()
    if (d.products_titre)   titreSection.value = d.products_titre
    if (d.products_sous)    sousTitre.value    = d.products_sous
    if (d.products_marques_titre) titreMarques.value = d.products_marques_titre
    if (d.products_tarifs_titre)  titreTarifs.value  = d.products_tarifs_titre
    if (d.products_bienvenue)     bienvenue.value    = d.products_bienvenue
    if (d.products_items && d.products_items.length)   products.value = d.products_items
    if (d.products_brands && d.products_brands.length) brands.value   = d.products_brands
    if (d.products_prices && d.products_prices.length) prices.value   = d.products_prices
  }, () => {})
})
onUnmounted(() => { if (unsub) unsub() })
</script>

<style scoped>
.products {
  background: linear-gradient(135deg, #FFF9F0 0%, #F5E6D3 100%);
  padding: 25px;
  border-radius: 12px;
  margin: 20px 0;
  border: 2px solid var(--secondary-beige);
}

.products h2 {
  color: var(--primary-teal);
  margin-bottom: 12px;
}

.products > p {
  margin-bottom: 15px;
  color: var(--text-dark);
  font-weight: 500;
}

.products-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin: 15px 0 25px;
}

.product-item {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-left: 4px solid var(--primary-teal);
  box-shadow: 0 2px 6px rgba(27, 169, 168, 0.1);
}

.product-icon { font-size: 1.3em; }

.brands { margin-bottom: 25px; }

.brands h3 {
  color: var(--primary-teal);
  margin-bottom: 12px;
  font-size: 1.05em;
}

.brands-list { display: flex; flex-wrap: wrap; gap: 8px; }

.brand-tag {
  background: white;
  border: 1.5px solid var(--primary-teal);
  color: var(--primary-teal);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.88em;
  font-weight: 600;
}

.prices h3 {
  color: var(--primary-teal);
  margin-bottom: 12px;
  font-size: 1.05em;
}

.prices-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.price-item {
  background: white;
  border-radius: 10px;
  padding: 14px 20px;
  text-align: center;
  border: 2px solid var(--primary-teal);
  min-width: 100px;
  flex: 1;
}

.price-label {
  display: block;
  font-size: 0.9em;
  color: var(--text-gray);
  margin-bottom: 4px;
}

.price-value {
  display: block;
  font-size: 1.3em;
  font-weight: 700;
  color: var(--primary-teal);
}

.welcome {
  text-align: center;
  font-size: 1.1em;
  color: var(--primary-teal);
  margin-top: 5px;
}
</style>
