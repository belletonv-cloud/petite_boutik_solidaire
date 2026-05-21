<template>
  <div class="actu-banner" v-if="actu.visible && actu.titre" :class="actu.type" role="alert">
    <span class="actu-icon">{{ icons[actu.type] }}</span>
    <div class="actu-content">
      <strong>{{ actu.titre }}</strong>
      <p v-if="actu.message">{{ actu.message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'

const actu = ref({ visible: false, titre: '', message: '', type: 'info' })
const icons = { info: 'ℹ️', warning: '⚠️', success: '✅' }

let unsubscribe = null
onMounted(() => {
  unsubscribe = onSnapshot(doc(db, 'config', 'actualite'), snap => {
    if (snap.exists()) Object.assign(actu.value, snap.data())
  }, () => {})
})
onUnmounted(() => { if (unsubscribe) unsubscribe() })
</script>

<style scoped>
.actu-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 10px;
  margin-bottom: 16px;
  border: 2px solid;
}

.actu-banner.info {
  background: #e8f4fd;
  border-color: #1BA9A8;
}
.actu-banner.warning {
  background: #FFF3CD;
  border-color: #FFC107;
}
.actu-banner.success {
  background: #e8f5e9;
  border-color: #4CAF50;
}

.actu-icon { font-size: 1.3em; flex-shrink: 0; }

.actu-content strong {
  display: block;
  font-size: 0.95em;
  margin-bottom: 3px;
  color: #333;
}
.actu-content p {
  font-size: 0.88em;
  color: #555;
  margin: 0;
}
</style>
