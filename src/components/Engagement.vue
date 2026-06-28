<template>
  <section class="engagement">
    <h2>{{ titre }}</h2>
    <blockquote>{{ quote }}</blockquote>
    <div class="values-badge">
      <span class="badge" v-for="item in values" :key="item.label" tabindex="0">
        <span class="badge-label">{{ item.emoji }} {{ item.label }}</span>
        <span class="badge-desc">{{ item.desc }}</span>
      </span>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTextes } from '../composables/useTextes.js'

const textes = useTextes()
const titre = computed(() => textes.value.engagement_titre || 'Notre engagement')
const quote = computed(() => textes.value.engagement_quote || 'Nous voulons que chaque visiteur se sente attendu et bienvenu. Ici, on recycle, on partage, on crée du lien.')

const values = ref([
  { emoji: '♻️', label: 'Recycler', desc: 'Donnez une seconde vie aux vêtements de vos enfants' },
  { emoji: '🤝', label: 'Solidarité', desc: 'Des prix accessibles à toutes les familles' },
  { emoji: '🌍', label: 'Écologie', desc: 'Moins de déchets, plus de sens' },
  { emoji: '👋', label: 'Se rencontrer', desc: "Un lieu de convivialité et d'échange" },
])
</script>

<style scoped>
.engagement {
  margin: 40px 0;
  text-align: center;
}

.engagement h2 {
  color: var(--primary-teal);
  margin-bottom: 20px;
}

.engagement blockquote {
  font-style: italic;
  font-size: 1.15em;
  color: var(--text-dark);
  border-left: 5px solid var(--primary-coral);
  margin: 0 0 25px 0;
  line-height: 1.7;
  background: var(--secondary-cream);
  padding: 20px 20px 20px 24px;
  border-radius: 8px;
}

.values-badge {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.badge {
  position: relative;
  background: var(--primary-teal);
  color: white;
  padding: 10px 16px;
  border-radius: 20px;
  font-size: 0.95em;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(27, 169, 168, 0.2);
  cursor: default;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}

.badge:hover,
.badge:focus {
  background: var(--primary-teal-dark, #158f8e);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(27, 169, 168, 0.35);
}

.badge-label {
  display: block;
}

.badge-desc {
  display: block;
  max-height: 0;
  overflow: hidden;
  font-size: 0.82em;
  font-weight: 400;
  opacity: 0;
  transition: max-height 0.3s ease, opacity 0.3s ease, margin-top 0.3s ease;
  margin-top: 0;
  white-space: nowrap;
}

.badge:hover .badge-desc,
.badge:focus .badge-desc {
  max-height: 40px;
  opacity: 1;
  margin-top: 5px;
}
</style>
