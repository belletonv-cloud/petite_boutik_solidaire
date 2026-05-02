<template>
  <section class="association">
    <h2>L'association Bras Ouverts</h2>
    <p>
      L'association <strong>Bras Ouverts de Morlaix</strong> est portée par des bénévoles engagées — mamans, amies et mamies —
      qui œuvrent chaque jour pour créer du lien social et soutenir les familles du territoire.
    </p>
    <div class="values">
      <div class="value-card" v-for="value in values" :key="value.title">
        <div class="value-icon">{{ value.icon }}</div>
        <h3>{{ value.title }}</h3>
        <p>{{ value.description }}</p>
      </div>
    </div>
    <div class="donate-callout">
      <h3>Vous souhaitez donner ?</h3>
      <p>
        Nous acceptons avec gratitude vos dons de vêtements enfants (0-10 ans) en bon état,
        chaussures, matériel de puériculture et vêtements pour futures mamans.
      </p>
      <p>Apportez vos dons directement à la boutique aux horaires d'ouverture.</p>
    </div>
  </section>
</template>

<script setup>
const values = [
  {
    icon: '♻️',
    title: 'Recyclage',
    description: 'Donner une seconde vie aux vêtements et lutter contre le gaspillage textile.'
  },
  {
    icon: '🤝',
    title: 'Solidarité',
    description: 'Aider les familles à s\'équiper à prix accessible, dans le respect et la bienveillance.'
  },
  {
    icon: '💛',
    title: 'Convivialité',
    description: 'Créer un lieu chaleureux où chacun·e se sent attendu·e et bienvenu·e.'
  }
]
</script>

<style scoped>
.association {
  margin: 40px 0;
}

.association h2 {
  color: var(--primary-teal);
  margin-bottom: 15px;
}

.association > p {
  font-size: 1.05em;
  line-height: 1.7;
  margin-bottom: 30px;
  color: var(--text-dark);
}

.association strong {
  color: var(--primary-coral);
}

.values {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 35px;
}

.value-card {
  background: linear-gradient(135deg, #FFF9F0 0%, #F5E6D3 100%);
  padding: 25px 20px;
  border-radius: 12px;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 2px solid var(--secondary-beige);
}

.value-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(27, 169, 168, 0.15);
}

.value-icon {
  font-size: 2.5em;
  margin-bottom: 10px;
}

.value-card h3 {
  color: var(--primary-teal);
  margin-bottom: 8px;
  font-size: 1.15em;
}

.value-card p {
  color: var(--text-gray);
  font-size: 0.95em;
  line-height: 1.5;
}

.donate-callout {
  background: linear-gradient(135deg, #E95E5E15, #E95E5E08);
  border: 2px solid var(--primary-coral);
  border-radius: 12px;
  padding: 25px;
  text-align: center;
}

.donate-callout h3 {
  color: var(--primary-coral);
  margin-bottom: 12px;
  font-size: 1.2em;
}

.donate-callout p {
  color: var(--text-dark);
  line-height: 1.6;
  margin-bottom: 8px;
}
</style>
