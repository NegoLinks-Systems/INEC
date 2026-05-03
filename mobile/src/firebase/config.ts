// mobile/src/firebase/config.ts
// ─────────────────────────────────────────────────────────────────────────────
// MINI-INEC 2.0 Mobile — Firebase Configuration
// Enables offline persistence critical for field operations
// ─────────────────────────────────────────────────────────────────────────────

import firestore from '@react-native-firebase/firestore'
import storage from '@react-native-firebase/storage'
import auth from '@react-native-firebase/auth'

// ─── Enable Firestore Offline Persistence ─────────────────────────────────────
// This is the CORE of Module 2 — officers can log votes with zero connectivity
// React Native Firebase enables this by default; explicitly configure cache size
firestore().settings({
  persistence: true,                    // Enable offline disk cache
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED, // Unlimited local cache
})

// ─── Typed collection helpers ─────────────────────────────────────────────────
export const voteLogs = () => firestore().collection('vote_logs')
export const fleetLocations = () => firestore().collection('fleet_locations')
export const incidents = () => firestore().collection('incidents')
export const signaling = () => firestore().collection('signaling')
export const pollingUnitDoc = (stateId: string, lgaId: string, wardId: string, puId: string) =>
  firestore()
    .collection('states').doc(stateId)
    .collection('lgas').doc(lgaId)
    .collection('wards').doc(wardId)
    .collection('polling_units').doc(puId)

export { firestore, storage, auth }
