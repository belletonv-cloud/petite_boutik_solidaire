<template>
  <footer class="site-footer">
    <div class="footer-content">
      <div class="footer-section">
        <h4>{{ name }}</h4>
        <p>{{ address }}</p>
        <p>{{ association }}</p>
      </div>
      <div class="footer-section">
        <h4>Contact</h4>
        <p>
          <a :href="'tel:' + phoneRaw" class="footer-link">📞 {{ phone }}</a>
        </p>
        <p class="handle">📸 {{ handle }}</p>
      </div>
      <div class="footer-section">
        <h4>Suivez-nous</h4>
        <div class="footer-links">
          <a href="https://www.facebook.com/people/La-Ptite-Boutik-Solidaire-Morlaix/61581840912607/#" target="_blank" rel="noopener noreferrer" class="footer-link">Facebook</a>
          <a href="https://www.instagram.com/la_ptite_boutik_morlaix/" target="_blank" rel="noopener noreferrer" class="footer-link">Instagram</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; {{ currentYear }} La P'tite Boutik Solidaire — Association Bras Ouverts de Morlaix</p>
    </div>
  </footer>
</template>

<script setup>
const name = "La P'tite Boutik Solidaire"
const address = '2 rue Jean-Monnet, 29600 Morlaix'
const association = 'Association Bras Ouverts de Morlaix'
const phone = '06 20 70 54 96'
const phoneRaw = '0620705496'
const handle = '@la_ptite_boutik_morlaix'
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.site-footer {
  background: linear-gradient(135deg, var(--primary-teal) 0%, var(--primary-teal-dark) 100%);
  color: white;
  margin-top: 50px;
  padding-top: 0;
}

.footer-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 25px;
}

.footer-section h4 {
  color: var(--secondary-cream);
  margin-bottom: 12px;
  font-size: 1.05em;
}

.footer-section p {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.95em;
  margin-bottom: 8px;
  line-height: 1.5;
}

.footer-link {
  color: var(--secondary-cream);
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.2s ease;
}

.footer-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.handle {
  color: var(--secondary-cream);
  font-style: italic;
}

.footer-links {
  display: flex;
  gap: 15px;
}

.footer-bottom {
  text-align: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9em;
  margin: 0;
}

.footer-bottom p {
  margin: 0;
}
</style>
