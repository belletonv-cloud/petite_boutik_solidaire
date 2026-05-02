<template>
  <section class="facebook-section">
    <a :href="facebookUrl" class="btn" target="_blank" rel="noopener noreferrer">
      {{ label }}
    </a>
  </section>
</template>

<script setup>
const facebookUrl = 'https://www.facebook.com/people/La-Ptite-Boutik-Solidaire-Morlaix/61581840912607/#'
const label = 'Suivez-nous sur Facebook'
</script>

<style scoped>
.facebook-section {
  text-align: center;
  margin: 30px 0;
}

.btn {
  display: inline-block;
  background: #4267B2;
  color: white;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 5px;
  font-size: 1em;
  font-weight: 500;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.btn:hover {
  background: #365899;
  transform: translateY(-2px);
}
</style>
