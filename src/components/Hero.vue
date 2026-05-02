<template>
  <section class="hero">
    <div class="hero-content">
      <h1>{{ title }}</h1>
      <p class="hero-subtitle">{{ subtitle }}</p>
      <p class="hero-tagline">{{ tagline }}</p>
      <div class="hero-actions">
        <a href="#horaires" class="btn btn-primary">Voir les horaires</a>
        <a href="#contact" class="btn btn-secondary">Nous contacter</a>
      </div>
    </div>
  </section>
</template>

<script setup>
const title = "La P'tite Boutik Solidaire"
const subtitle = "Association Bras Ouverts de Morlaix"
const tagline = "Vêtements enfants, chaussures et puériculture à prix mini dans un esprit de partage et de convivialité"
</script>

<style scoped>
.hero {
  background: var(--gradient-cool);
  color: white;
  padding: 60px 20px;
  text-align: center;
  border-radius: 15px;
  margin-bottom: 40px;
  box-shadow: 0 4px 20px rgba(27, 169, 168, 0.2);
}

.hero-content {
  max-width: 600px;
  margin: 0 auto;
}

.hero h1 {
  font-size: 2.5em;
  margin-bottom: 10px;
  color: white;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
  font-weight: 700;
}

.hero-subtitle {
  font-size: 1.2em;
  opacity: 0.95;
  margin-bottom: 15px;
}

.hero-tagline {
  font-size: 1em;
  line-height: 1.6;
  margin-bottom: 30px;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-block;
  padding: 12px 28px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1em;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  text-decoration: none;
}

.btn-primary {
  background: white;
  color: var(--primary-teal);
}

.btn-primary:hover {
  background: var(--secondary-cream);
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

@media (max-width: 600px) {
  .hero h1 {
    font-size: 1.8em;
  }

  .hero {
    padding: 40px 15px;
  }
}
</style>
