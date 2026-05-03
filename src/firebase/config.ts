// src/firebase/config.ts
// ─────────────────────────────────────────────────────────────────────────────
// Firebase Configuration for MINI-INEC 2.0
// Replace the firebaseConfig values with your actual Firebase project credentials
// from: https://console.firebase.google.com → Project Settings → Your Apps
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import {
  getFirestore,
  enableIndexedDbPersistence,
  Firestore,
} from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getAuth, Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID',
}

// Singleton pattern: prevent re-initialization on hot-reload
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

// Enable offline persistence for Firestore (critical for field officers)
// This MUST be called before any Firestore operations
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn(
        'Firestore persistence failed: Multiple tabs open. Offline sync disabled for this tab.'
      )
    } else if (err.code === 'unimplemented') {
      console.warn(
        'Firestore persistence not available in this browser.'
      )
    }
  })
}

export { app, db, storage, auth }
