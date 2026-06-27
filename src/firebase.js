import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyDaNRFLH7axpTrv8Es16_3gJeWKmUMloIo",
  authDomain: "la-petite-boutik.firebaseapp.com",
  projectId: "la-petite-boutik",
  storageBucket: "la-petite-boutik.appspot.com",
  messagingSenderId: "502164719625",
  appId: "1:502164719625:web:8a2daf9222a3a3970e90d8"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
export const db = getFirestore(app)
export const storage = getStorage(app)
