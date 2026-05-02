<template>
  <section class="engagement">
    <h2>Notre engagement</h2>
    <blockquote>{{ quote }}</blockquote>
    <div class="values-badge">
      <span class="badge">♻️ Recycler</span>
      <span class="badge">🤝 Solidarité</span>
      <span class="badge">🌍 Écologie</span>
      <span class="badge">👋 Se rencontrer</span>
    </div>
  </section>
</template>

<script setup>
const quote = 'Nous voulons que chaque visiteur se sente attendu et bienvenu. Ici, on recycle, on partage, on crée du lien.'
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
  padding-left: 20px;
  margin: 0 0 25px 0;
  line-height: 1.7;
  background: var(--secondary-cream);
  padding: 20px;
  border-radius: 8px;
}

.values-badge {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.badge {
  background: linear-gradient(135deg, var(--primary-teal), var(--primary-coral-light));
  color: white;
  padding: 10px 16px;
  border-radius: 20px;
  font-size: 0.95em;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(27, 169, 168, 0.2);
}
</style>
