import { ref, onUnmounted } from 'vue'
import { onSnapshot, doc } from 'firebase/firestore'
import { db } from '../firebase.js'

// Singleton: un seul listener partagé entre tous les composants
let data = ref({})
let refCount = 0
let unsubscribe = null

function start() {
  if (unsubscribe) return
  unsubscribe = onSnapshot(doc(db, 'config', 'textes'), snap => {
    if (snap.exists()) data.value = snap.data()
  }, () => {})
}

function stop() {
  if (!unsubscribe) return
  unsubscribe()
  unsubscribe = null
  data.value = {}
}

export function useTextes() {
  if (refCount === 0) start()
  refCount++

  onUnmounted(() => {
    refCount--
    if (refCount === 0) stop()
  })

  return data
}
