<template>
  <div class="products">
    <h2>Ce que nous proposons</h2>
    <p>Vêtements de seconde main en excellent état :</p>
    <div class="products-list">
      <div class="product-item" v-for="item in products" :key="item">
        <span class="product-icon">👕</span>
        <span>{{ item }}</span>
      </div>
    </div>
    <p class="highlight"><strong>💰 Prix mini</strong> dans un esprit de partage, d'écoute et de convivialité.</p>
  </div>
</template>

<script setup>
const products = [
  'Pour les enfants de 0 à 10 ans',
  'Chaussures',
  'Matériel de puériculture',
  'Vêtements pour futures mamans'
]
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
  margin: 15px 0;
}

.product-item {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-left: 4px solid var(--primary-coral);
  box-shadow: 0 2px 6px rgba(233, 94, 94, 0.1);
}

.product-icon {
  font-size: 1.3em;
}

.highlight {
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 2px solid var(--primary-coral);
  margin-top: 15px;
  color: var(--text-dark);
}

.highlight strong {
  color: var(--primary-coral);
}
</style>
