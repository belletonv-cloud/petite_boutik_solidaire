import { ref, onUnmounted } from 'vue'
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase.js'

// Singleton: un seul listener partagé pour toute la collection photos
let photos = ref([])
let refCount = 0
let unsubscribe = null

function start() {
  if (unsubscribe) return
  unsubscribe = onSnapshot(
    query(collection(db, 'photos'), orderBy('createdAt')),
    snap => { photos.value = snap.docs.map(d => ({ id: d.id, ...d.data() })) },
    err => { console.warn('[usePhotos]', err) }
  )
}

function stop() {
  if (!unsubscribe) return
  unsubscribe()
  unsubscribe = null
  photos.value = []
}

export function usePhotos() {
  if (refCount === 0) start()
  refCount++

  onUnmounted(() => {
    refCount--
    if (refCount === 0) stop()
  })

  return photos
}
