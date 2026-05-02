<template>
  <section class="social-media">
    <h2>Nos actualités en vidéo</h2>
    <p class="social-subtitle">Suivez nos actualités et découvrez nos derniers arrivages en vidéo !</p>
    <div class="social-container">
      <div class="video-container">
        <iframe
          src="https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F2685106605160519%2F&show_text=false&width=267&t=0"
          width="267"
          height="476"
          style="border:none;overflow:hidden"
          scrolling="no"
          frameborder="0"
          allowfullscreen="true"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen="true"
        ></iframe>
      </div>
      <div class="social-info">
        <h3>Suivez-nous !</h3>
        <div class="social-links">
          <a :href="facebookUrl" target="_blank" rel="noopener noreferrer" class="social-link facebook">
            👍 Facebook
          </a>
          <a href="https://www.instagram.com/la_ptite_boutik_morlaix/" target="_blank" rel="noopener noreferrer" class="social-link instagram">
            📸 Instagram
          </a>
        </div>
        <div class="social-stats">
          <p>👕 Vêtements pour les Kids de 0 à 10 ans</p>
          <p>🤲 Recycler par solidarité, ♻️ écologie et pour se rencontrer 👋</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const facebookUrl = 'https://www.facebook.com/people/La-Ptite-Boutik-Solidaire-Morlaix/61581840912607/#'
</script>

<style scoped>
.social-media {
  margin: 40px 0;
  text-align: center;
}

.social-media h2 {
  color: var(--primary-teal);
  margin-bottom: 8px;
}

.social-subtitle {
  color: var(--text-gray);
  font-size: 1em;
  margin-bottom: 25px;
}

.social-container {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 30px;
  align-items: center;
  background: linear-gradient(135deg, #FFF9F0 0%, #F5E6D3 100%);
  padding: 25px;
  border-radius: 12px;
  border: 2px solid var(--secondary-beige);
}

.video-container {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(27, 169, 168, 0.15);
}

.social-info h3 {
  color: var(--primary-teal);
  margin-bottom: 15px;
  font-size: 1.2em;
}

.social-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.social-link {
  display: inline-block;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  color: white;
}

.social-link.facebook {
  background: #1BA9A8;
}

.social-link.instagram {
  background: var(--primary-coral);
}

.social-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  text-decoration: none;
}

.social-stats {
  text-align: left;
  padding-top: 15px;
  border-top: 2px solid var(--secondary-beige);
}

.social-stats p {
  color: var(--text-dark);
  font-size: 0.95em;
  margin-bottom: 8px;
  line-height: 1.5;
}

.social-stats p:last-child {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .social-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .social-info {
    text-align: center;
  }

  .social-links {
    flex-direction: row;
    justify-content: center;
  }
}
</style>
