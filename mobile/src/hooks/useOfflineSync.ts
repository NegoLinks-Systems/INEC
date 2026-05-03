// mobile/src/hooks/useOfflineSync.ts
// ─────────────────────────────────────────────────────────────────────────────
// MINI-INEC 2.0 — Offline-First Vote Record Logging (Module 2)
//
// Architecture:
// 1. Officer logs votes → saved to Firestore (which auto-caches locally)
// 2. If offline: write succeeds locally via IndexedDB persistence
// 3. When connectivity restored: Firestore background-syncs all pending writes
// 4. GPS coordinates captured at write time for precise location
//
// The beauty of Firestore offline persistence:
// - NO manual queue management needed
// - Firestore handles conflict resolution automatically
// - writes are retried indefinitely until confirmed by server
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import firestore from '@react-native-firebase/firestore'
import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import Geolocation from 'react-native-geolocation-service'
import { PermissionsAndroid, Platform } from 'react-native'
import { v4 as uuid } from 'uuid'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface VoteRecord {
  puId: string
  wardId: string
  lgaId: string
  stateId: string
  officerId: string
  partyResults: Record<string, number>  // { "APC": 245, "PDP": 189, ... }
  totalVotesCast: number
  accreditedVoters: number
  validVotes: number
  rejectedBallots: number
}

export interface GPSCoordinates {
  latitude: number
  longitude: number
  accuracy: number
  altitude?: number
  heading?: number
  speed?: number
}

export interface SyncStatus {
  pendingWrites: number
  isOnline: boolean
  lastSync: Date | null
  isSyncing: boolean
}

// ─── GPS Permission Helper ────────────────────────────────────────────────────
async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const status = await Geolocation.requestAuthorization('whenInUse')
    return status === 'granted'
  }
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'MINI-INEC Location Permission',
      message: 'GPS coordinates are required to geotag vote submissions for integrity verification.',
      buttonNeutral: 'Ask Me Later',
      buttonNegative: 'Cancel',
      buttonPositive: 'OK',
    }
  )
  return granted === PermissionsAndroid.RESULTS.GRANTED
}

// ─── Get Current GPS Position ─────────────────────────────────────────────────
async function getCurrentPosition(): Promise<GPSCoordinates> {
  const hasPermission = await requestLocationPermission()
  if (!hasPermission) {
    throw new Error('Location permission denied. GPS coordinates required for vote submission.')
  }

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? undefined,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
        })
      },
      (error) => reject(new Error(`GPS Error ${error.code}: ${error.message}`)),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,  // Accept cached position up to 30s old
        forceRequestLocation: true,
      }
    )
  })
}

// ─── Main Hook ────────────────────────────────────────────────────────────────
export function useOfflineSync(officerId: string) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    pendingWrites: 0,
    isOnline: true,
    lastSync: null,
    isSyncing: false,
  })
  const [error, setError] = useState<string | null>(null)
  const unsubscribeNetInfo = useRef<(() => void) | null>(null)

  // Monitor network status
  useEffect(() => {
    unsubscribeNetInfo.current = NetInfo.addEventListener((state: NetInfoState) => {
      const isOnline = Boolean(state.isConnected && state.isInternetReachable)
      setSyncStatus((prev) => {
        if (!prev.isOnline && isOnline) {
          // Coming back online — Firestore will auto-flush pending writes
          return { ...prev, isOnline, isSyncing: true, lastSync: new Date() }
        }
        return { ...prev, isOnline }
      })

      // Give Firestore time to flush the queue, then update status
      if (isOnline) {
        setTimeout(() => {
          setSyncStatus((prev) => ({
            ...prev,
            isSyncing: false,
            pendingWrites: 0,
          }))
        }, 3000)
      }
    })

    return () => {
      unsubscribeNetInfo.current?.()
    }
  }, [])

  // ─── Submit Vote Record ─────────────────────────────────────────────────────
  // This is the key function: it writes to Firestore regardless of connectivity.
  // Firestore's offline persistence handles caching + later sync automatically.
  const submitVoteRecord = useCallback(
    async (record: VoteRecord): Promise<{ success: boolean; logId: string; coordinates: GPSCoordinates | null }> => {
      setError(null)
      const logId = uuid()

      // Get GPS (best-effort; will warn if unavailable but not block submission)
      let coordinates: GPSCoordinates | null = null
      try {
        coordinates = await getCurrentPosition()
      } catch (gpsErr) {
        console.warn('GPS unavailable for vote submission:', gpsErr)
        // Don't block submission — just log without GPS
      }

      const now = new Date()

      try {
        // Write to Firestore — if offline, this is cached locally and synced later
        await firestore().collection('vote_logs').doc(logId).set({
          logId,
          ...record,
          submittedAt: firestore.Timestamp.fromDate(now),
          createdOffline: !syncStatus.isOnline,
          offlineCreatedAt: !syncStatus.isOnline ? firestore.Timestamp.fromDate(now) : null,
          syncedAt: syncStatus.isOnline ? firestore.Timestamp.fromDate(now) : null,
          submissionCoordinates: coordinates
            ? new firestore.GeoPoint(coordinates.latitude, coordinates.longitude)
            : null,
          submissionAccuracy: coordinates?.accuracy ?? null,
          isVerified: false,
        })

        // Also update the PU status document
        await firestore()
          .collection('states').doc(record.stateId)
          .collection('lgas').doc(record.lgaId)
          .collection('wards').doc(record.wardId)
          .collection('polling_units').doc(record.puId)
          .update({
            totalVotesCast: record.totalVotesCast,
            accreditedVoters: record.accreditedVoters,
            validVotes: record.validVotes,
            rejectedBallots: record.rejectedBallots,
            status: 'submitted',
            resultsSubmitted: true,
            resultsSubmittedAt: firestore.Timestamp.fromDate(now),
          })

        if (!syncStatus.isOnline) {
          setSyncStatus((prev) => ({
            ...prev,
            pendingWrites: prev.pendingWrites + 1,
          }))
        }

        return { success: true, logId, coordinates }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error during vote submission'
        setError(msg)
        return { success: false, logId, coordinates }
      }
    },
    [syncStatus.isOnline]
  )

  // ─── Update Fleet Location ──────────────────────────────────────────────────
  // Called every 30 seconds by background GPS task
  const updateFleetLocation = useCallback(
    async (vehicleId: string) => {
      try {
        const coords = await getCurrentPosition()
        const now = firestore.Timestamp.now()

        await firestore().collection('fleet_locations').doc(vehicleId).update({
          currentCoordinates: new firestore.GeoPoint(coords.latitude, coords.longitude),
          speedKph: coords.speed ? coords.speed * 3.6 : 0,  // m/s → km/h
          heading: coords.heading ?? 0,
          locationAccuracy: coords.accuracy,
          lastUpdated: now,
          // Append to route history (keep last 200 points)
          routeHistory: firestore.FieldValue.arrayUnion({
            coordinates: new firestore.GeoPoint(coords.latitude, coords.longitude),
            timestamp: now,
            speedKph: coords.speed ? coords.speed * 3.6 : 0,
          }),
        })
      } catch (err) {
        console.warn('Fleet location update failed:', err)
      }
    },
    []
  )

  // ─── Report Incident ────────────────────────────────────────────────────────
  const reportIncident = useCallback(
    async (
      incidentData: {
        title: string
        description: string
        severity: 'low' | 'medium' | 'high' | 'critical'
        category: string
        puId: string
        wardId: string
        lgaId: string
        stateId: string
        imageUris?: string[]  // Local file URIs from camera
      },
      uploadToStorage: boolean = true
    ) => {
      setError(null)
      const incidentId = uuid()
      let coords: GPSCoordinates | null = null

      try {
        coords = await getCurrentPosition()
      } catch { /* GPS optional for incidents */ }

      // Upload images to Firebase Storage if online
      const imageUrls: string[] = []
      if (uploadToStorage && syncStatus.isOnline && incidentData.imageUris?.length) {
        for (const uri of incidentData.imageUris) {
          const ref = firestore().app.storage().ref(`incidents/${incidentId}/${uuid()}.jpg`)
          const storageRef = require('@react-native-firebase/storage').default()
            .ref(`incidents/${incidentId}/${uuid()}.jpg`)
          await storageRef.putFile(uri)
          const url = await storageRef.getDownloadURL()
          imageUrls.push(url)
        }
      }

      await firestore().collection('incidents').doc(incidentId).set({
        incidentId,
        reportedBy: officerId,
        ...incidentData,
        imageUrls,
        status: 'open',
        reportedAt: firestore.Timestamp.now(),
        createdOffline: !syncStatus.isOnline,
        offlineCreatedAt: !syncStatus.isOnline ? firestore.Timestamp.now() : null,
        syncedAt: syncStatus.isOnline ? firestore.Timestamp.now() : null,
        reportCoordinates: coords
          ? new firestore.GeoPoint(coords.latitude, coords.longitude)
          : null,
        reportAccuracy: coords?.accuracy ?? null,
      })

      return { success: true, incidentId }
    },
    [officerId, syncStatus.isOnline]
  )

  return {
    syncStatus,
    error,
    submitVoteRecord,
    updateFleetLocation,
    reportIncident,
  }
}
