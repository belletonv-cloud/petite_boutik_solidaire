<template>
  <header class="site-header">
    <div class="header-content">
      <img src="@/assets/logo.jpg" alt="Logo La P'tite Boutik Solidaire" class="logo" />
      <div class="header-text">
        <h1>La P'tite Boutik Solidaire</h1>
        <p class="tagline">Association Bras Ouverts de Morlaix</p>
      </div>
    </div>
  </header>
</template>

<script setup>
</script>

<style scoped>
.site-header {
  background: var(--secondary-cream);
  border-bottom: 3px solid var(--primary-teal);
  padding: 25px 20px;
  margin-bottom: 30px;
  border-radius: 0 0 15px 15px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
  max-width: 800px;
  margin: 0 auto;
}

.logo {
  width: 90px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(27, 169, 168, 0.15));
}

.header-text {
  text-align: left;
}

.header-text h1 {
  color: var(--primary-teal);
  margin-bottom: 4px;
  font-size: 1.8em;
  font-weight: 700;
}

.tagline {
  color: var(--primary-coral);
  font-size: 0.95em;
  font-weight: 500;
}

@media (max-width: 600px) {
  .header-content {
    flex-direction: column;
    gap: 12px;
  }

  .header-text {
    text-align: center;
  }

  .header-text h1 {
    font-size: 1.4em;
  }

  .logo {
    width: 70px;
  }
}
</style>
