// src/firebase/config.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getAuth, Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyC268-1qt_qaSISS8BphbvFYc3osyUPuxc',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'inec-9a779.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'inec-9a779',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'inec-9a779.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '770158005919',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:770158005919:web:94964e0942f4d7642a1caa',
  measurementId: 'G-CTZWMBHQVM',
}

let app: FirebaseApp
let db: Firestore
let storage: FirebaseStorage
let auth: Auth

if (!getApps().length) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

db = getFirestore(app)
storage = getStorage(app)
auth = getAuth(app)

export { app, db, storage, auth }
