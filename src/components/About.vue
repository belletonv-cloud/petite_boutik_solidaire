<template>
  <section class="about">
    <h2>À propos</h2>
    <p>
      La P'tite Boutik Solidaire ouvre ses portes au <strong>2, rue Jean-Monnet à Morlaix</strong>.
      Porté par l'association Bras Ouverts de Morlaix, l'objectif de ce nouveau lieu est d'encourager le recyclage,
      de favoriser la convivialité à travers la mode enfantine responsable et d'aider les familles.
    </p>
  </section>
</template>

<script setup>
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
