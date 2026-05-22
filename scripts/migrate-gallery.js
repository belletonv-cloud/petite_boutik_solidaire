// Usage: node scripts/migrate-gallery.js
// This script will find photos with gallery === 'collection' and set them to 'boutique'.
// It uses the same firebase config as the app. Run locally where you have network access.

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs, writeBatch } from 'firebase/firestore'
import { readFileSync } from 'fs'

// Reuse same firebase config as src/firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyDaNRFLH7axpTrv8Es16_3gJeWKmUMloIo",
  authDomain: "la-petite-boutik.firebaseapp.com",
  projectId: "la-petite-boutik",
  storageBucket: "la-petite-boutik.firebasestorage.app",
  messagingSenderId: "502164719625",
  appId: "1:502164719625:web:8a2daf9222a3a3970e90d8"
}

async function migrate() {
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)

  const photosRef = collection(db, 'photos')
  const q = query(photosRef, where('gallery', '==', 'collection'))
  const snap = await getDocs(q)
  console.log('Found', snap.size, 'documents with gallery=collection')
  if (snap.empty) return

  const batch = writeBatch(db)
  let i = 0
  snap.forEach(docSnap => {
    batch.update(docSnap.ref, { gallery: 'boutique' })
    i++
  })
  await batch.commit()
  console.log('Updated', i, 'documents to gallery=boutique')
}

migrate().catch(err => { console.error(err); process.exit(1) })
