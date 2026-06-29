<template>
  <div class="fouille-section" v-if="items.length">
    <h2>🧺 La Fouille</h2>
    <p class="subtitle">Des pépites à dénicher — venez fouiller !</p>
    <div class="fouille-grid">
      <div
        v-for="item in items"
        :key="item.id"
        class="fouille-card"
      >
        <img
          :src="item.url"
          :alt="item.alt || 'Article à la fouille'"
          loading="lazy"
          @error="$event.target.src = '/placeholder.jpg'"
        />
        <p v-if="item.alt" class="fouille-label">{{ item.alt }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePhotos } from '../composables/usePhotos.js'

const dynamicPhotos = usePhotos()

const items = computed(() =>
  dynamicPhotos.value.filter(p => p && p.active && p.gallery === 'fouille')
)
</script>

<style scoped>
.fouille-section {
  padding: 30px 20px;
  background: #FFF9F0;
  border-radius: 12px;
  margin: 20px 0;
  border: 2px dashed var(--secondary-beige, #F5E6D3);
}

.fouille-section h2 {
  color: var(--primary-teal, #1BA9A8);
  text-align: center;
  margin-bottom: 6px;
}

.subtitle {
  text-align: center;
  color: var(--text-gray, #666);
  margin-bottom: 24px;
  font-size: 0.95em;
  font-style: italic;
}

.fouille-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

@media (max-width: 600px) {
  .fouille-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }
}

.fouille-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0,0,0,0.08);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: default;
}

.fouille-card:hover {
  transform: translateY(-3px) rotate(0.5deg);
  box-shadow: 0 4px 14px rgba(0,0,0,0.13);
}

.fouille-card img {
  width: 100%;
  aspect-ratio: 3/4;
  object-fit: cover;
  display: block;
}

.fouille-label {
  padding: 6px 8px;
  font-size: 0.8em;
  color: var(--text-gray, #666);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}
</style>
