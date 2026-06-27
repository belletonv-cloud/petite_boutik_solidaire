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
      <p>&copy; {{ currentYear }} La P'tite Boutik Solidaire — Association Bras Ouverts de Morlaix — <button class="footer-mentions" @click="openMentions">Mentions légales</button></p>
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

<script>
export default {
  methods: {
    openMentions() {
      // dispatch a global event that the Mentions component listens to
      window.dispatchEvent(new Event('open-mentions'))
    }
  }
}
</script>

<style scoped>
.site-footer {
  background: linear-gradient(135deg, var(--primary-teal) 0%, var(--primary-teal-dark) 100%);
  color: white;
  margin-top: 50px;
  padding-top: 0;
}

.footer-content {
  max-width: var(--site-max-width, 800px);
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

.footer-mentions {
  background: transparent;
  border: none;
  color: var(--secondary-cream);
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
  padding: 0;
}
.footer-mentions:hover { opacity: 0.9 }

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
