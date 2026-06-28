<template>
  <section class="contact">
    <h2>{{ titre }}</h2>
    <div class="contact-grid">
      <div class="contact-info">
        <div class="info-group">
          <h3><span aria-hidden="true">📍</span> Localisation</h3>
          <p>{{ address }}</p>
        </div>
        <div class="info-group">
          <h3><span aria-hidden="true">📞</span> Téléphone</h3>
          <a :href="'tel:' + phoneRaw" class="phone-link">{{ phone }}</a>
        </div>
        <div class="info-group">
          <h3><span aria-hidden="true">🅿️</span> Parking</h3>
          <p>Disponible sur place</p>
        </div>
      </div>
      <div class="contact-map">
        <iframe
          :src="mapUrl"
          title="Carte Google Maps — La P'tite Boutik Solidaire"
          width="100%"
          height="250"
          style="border:0; border-radius: 10px;"
          allowfullscreen=""
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
        <a
          :href="'https://maps.google.com/?q=' + addressEncoded"
          target="_blank"
          rel="noopener noreferrer"
          class="maps-link"
          aria-label="Ouvrir l'adresse dans Google Maps (ouvre un nouvel onglet)"
        >Ouvrir dans Google Maps →</a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useTextes } from '../composables/useTextes.js'

const textes = useTextes()
const titre = computed(() => textes.value.contact_titre || 'Nous trouver')
const address = computed(() => textes.value.contact_address || '2 rue Jean-Monnet, 29600 Morlaix')
const phone = computed(() => textes.value.contact_phone || '06 20 70 54 96')
const phoneRaw = computed(() => textes.value.contact_phone_raw || '0620705496')
const mapUrl = computed(() => textes.value.contact_map_url || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2688.5!2d-3.8275!3d48.5775!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s2+Rue+Jean+Monnet%2C+29600+Morlaix!5e0!3m2!1sfr!2sfr!4v1700000000000')
const addressEncoded = computed(() => address.value.replace(/ /g, '+'))
</script>

<style scoped>
.contact {
  margin: 40px 0;
}

.contact h2 {
  color: var(--primary-teal);
  margin-bottom: 20px;
  text-align: center;
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  align-items: start;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-group {
  background: linear-gradient(135deg, #E8F5F5 0%, #E0F2F1 100%);
  padding: 20px;
  border-radius: 12px;
  border-left: 5px solid var(--primary-teal);
}

.info-group h3 {
  color: var(--primary-teal);
  margin-bottom: 8px;
  font-size: 1.05em;
}

.info-group p {
  color: var(--text-dark);
  margin: 0;
  line-height: 1.6;
}

.phone-link {
  color: var(--primary-coral);
  text-decoration: none;
  font-weight: 700;
  font-size: 1.1em;
}

.phone-link:hover {
  text-decoration: underline;
}

.contact-map {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(27, 169, 168, 0.15);
}

.maps-link {
  display: block;
  text-align: center;
  margin-top: 10px;
  color: var(--primary-teal);
  font-size: 0.9em;
  font-weight: 600;
  text-decoration: none;
}

.maps-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}
</style>
