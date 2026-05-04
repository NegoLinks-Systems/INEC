// mobile/src/firebase/config.ts
import firestore from '@react-native-firebase/firestore'
import storage from '@react-native-firebase/storage'
import auth from '@react-native-firebase/auth'

// Enable offline persistence - critical for field officers with no internet
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
})

export const db = firestore()
export const store = storage()
export const fbAuth = auth()

export const incidentsCol = () => db.collection('incidents')
export const fleetCol     = () => db.collection('fleet_locations')
export const signalingCol = () => db.collection('signaling')
export const voteLogsCol  = () => db.collection('vote_logs')

export const puDoc = (stateId: string, lgaId: string, wardId: string, puId: string) =>
  db.collection('states').doc(stateId)
    .collection('lgas').doc(lgaId)
    .collection('wards').doc(wardId)
    .collection('polling_units').doc(puId)

export const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyC268-1qt_qaSISS8BphbvFYc3osyUPuxc',
  authDomain:        'inec-9a779.firebaseapp.com',
  projectId:         'inec-9a779',
  storageBucket:     'inec-9a779.firebasestorage.app',
  messagingSenderId: '770158005919',
  appId:             '1:770158005919:web:94964e0942f4d7642a1caa',
}
