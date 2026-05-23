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
  position: sticky;
  bottom: 0;
  width: 100%;
  z-index: 800;
}

.footer-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 18px 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.footer-section h4 {
  color: var(--secondary-cream);
  margin-bottom: 12px;
  font-size: 1.05em;
}

.footer-section p {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0. nine5em;
  margin-bottom: 6px;
  line-height: 1.4;
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
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.08);
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.85em;
  margin: 0;
}

.footer-bottom p {
  margin: 0;
}
</style>
