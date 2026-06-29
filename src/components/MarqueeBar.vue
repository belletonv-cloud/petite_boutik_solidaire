<template>
  <div class="marquee" v-if="message" role="marquee" aria-label="Annonces">
    <div class="marquee-track">
      <span class="marquee-item" v-for="n in 4" :key="n">
        {{ message }}<span class="marquee-sep">✦</span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'

const actu = ref({ visible: false, titre: '', message: '', defilant: true })
let unsub = null

onMounted(() => {
  unsub = onSnapshot(doc(db, 'config', 'actualite'), snap => {
    if (snap.exists()) Object.assign(actu.value, snap.data())
  }, () => {})
})
onUnmounted(() => { if (unsub) unsub() })

// Texte défilant : on combine titre + message de l'actualité si elle est active
// et que le défilement n'a pas été désactivé dans l'admin.
const message = computed(() => {
  if (!actu.value.visible || actu.value.defilant === false) return ''
  return [actu.value.titre, actu.value.message].filter(Boolean).join(' — ').trim()
})
</script>

<style scoped>
.marquee {
  overflow: hidden;
  white-space: nowrap;
  background: linear-gradient(90deg, var(--primary-coral, #e8744f) 0%, #d65f3f 100%);
  color: #fff;
  font-size: 0.86em;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.marquee-track {
  display: inline-flex;
  align-items: center;
  padding: 7px 0;
  animation: marqueeScroll 26s linear infinite;
  will-change: transform;
}
.marquee:hover .marquee-track { animation-play-state: paused; }
.marquee-item { display: inline-flex; align-items: center; }
.marquee-sep { margin: 0 22px; opacity: 0.65; }

@keyframes marqueeScroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

@media (prefers-reduced-motion: reduce) {
  .marquee-track { animation: none; padding-left: 12px; }
}
</style>
