<template>
  <div class="hours" id="horaires">
    <h2>Horaires d'ouverture</h2>
    <div class="hours-grid">
      <div class="hours-card">
        <span class="day-icon">📅</span>
        <p>
          Ouvert le <strong>{{ days[0] }}</strong> et le <strong>{{ days[1] }}</strong>
        </p>
      </div>
      <div class="hours-card">
        <span class="day-icon">👥</span>
        <p>Accueil par une équipe de bénévoles (mamans, amies et mamies)</p>
      </div>
    </div>
    <div class="contact-card">
      <h3>Nous contacter</h3>
      <div class="contact-item">
        <span class="icon">📞</span>
        <a :href="'tel:' + phoneRaw" class="phone-link">{{ phone }}</a>
      </div>
      <div class="contact-item">
        <span class="icon">📍</span>
        <span>{{ address }}</span>
      </div>
      <p class="parking">🅿️ Parking disponible</p>
    </div>
  </div>
</template>

<script setup>
const days = ['mercredi', 'samedi']
const phone = '06 20 70 54 96'
const phoneRaw = '0620705496'
const address = '2 rue Jean-Monnet, 29600 Morlaix'
</script>

<style scoped>
.hours {
  margin: 40px 0;
}

.hours h2 {
  color: var(--primary-teal);
  margin-bottom: 20px;
  text-align: center;
}

.hours-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
}

.hours-card {
  background: linear-gradient(135deg, #E8F5F5 0%, #E0F2F1 100%);
  padding: 20px;
  border-radius: 12px;
  border: 2px solid var(--primary-teal);
  text-align: center;
}

.day-icon {
  font-size: 2em;
  display: block;
  margin-bottom: 10px;
}

.hours-card p {
  color: var(--text-dark);
  line-height: 1.6;
  margin: 0;
}

.hours-card strong {
  color: var(--primary-coral);
  font-weight: 600;
}

.contact-card {
  background: linear-gradient(135deg, #FFF9F0 0%, #F5E6D3 100%);
  padding: 25px;
  border-radius: 12px;
  border: 2px solid var(--secondary-beige);
  text-align: center;
}

.contact-card h3 {
  color: var(--primary-teal);
  margin-bottom: 15px;
  font-size: 1.2em;
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
  color: var(--text-dark);
  font-weight: 500;
}

.icon {
  font-size: 1.3em;
}

.phone-link {
  color: var(--primary-coral);
  font-weight: 700;
  text-decoration: none;
}

.phone-link:hover {
  text-decoration: underline;
}

.parking {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid var(--secondary-beige);
  color: var(--text-gray);
  font-size: 0.95em;
}
</style>
