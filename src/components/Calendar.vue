<template>
  <section class="calendar">
    <h2>Calendrier d'ouverture</h2>
    <div class="calendar-image-container">
      <img src="@/assets/calendar.png" alt="Calendrier d'ouverture 2025" class="calendar-image" />
    </div>
    <div class="dates-info">
      <p class="dates-note">
        La boutique accueille les familles <strong>les mercredis et les samedis</strong>.
      </p>
      <p class="dates-detail">
        Consultez le calendrier ci-dessus pour les dates précises d'ouverture.
        D'autres dates à venir selon les besoins !
      </p>
    </div>
  </section>
</template>

<script setup>
</script>

<style scoped>
.calendar {
  margin: 40px 0;
  text-align: center;
}

.calendar h2 {
  color: var(--primary-teal);
  margin-bottom: 20px;
}

.calendar-image-container {
  margin-bottom: 20px;
  padding: 15px;
  background: var(--secondary-cream);
  border-radius: 12px;
  border: 2px solid var(--secondary-beige);
}

.calendar-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(27, 169, 168, 0.15);
}

.dates-info {
  background: linear-gradient(135deg, #FFF9F0 0%, #F5E6D3 100%);
  padding: 20px;
  border-radius: 12px;
  border: 2px solid var(--secondary-beige);
}

.dates-note {
  font-size: 1.05em;
  color: var(--text-dark);
  margin-bottom: 10px;
  font-weight: 600;
}

.dates-note strong {
  color: var(--primary-teal);
}

.dates-detail {
  color: var(--text-gray);
  font-size: 0.95em;
  margin: 0;
  line-height: 1.6;
}
</style>
