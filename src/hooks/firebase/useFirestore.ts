// src/hooks/firebase/useFirestore.ts
// ─────────────────────────────────────────────────────────────────────────────
// Real-time Firestore hooks — replaces mock data across the dashboard
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, query, where,
  orderBy, limit, doc, updateDoc, Timestamp,
  getCountFromServer
} from 'firebase/firestore'
import { db } from '@/firebase/config'

// ─── National Stats ───────────────────────────────────────────────────────────
export interface LiveNationalStats {
  totalPUs: number
  activePUs: number
  offlinePUs: number
  completedPUs: number
  flaggedPUs: number
  totalVotesCast: number
  totalVehicles: number
  vehiclesInTransit: number
  vehiclesDelivered: number
  isLoading: boolean
}

export function useLiveNationalStats(): LiveNationalStats {
  const [stats, setStats] = useState<LiveNationalStats>({
    totalPUs: 176846,
    activePUs: 0,
    offlinePUs: 0,
    completedPUs: 0,
    flaggedPUs: 0,
    totalVotesCast: 0,
    totalVehicles: 0,
    vehiclesInTransit: 0,
    vehiclesDelivered: 0,
    isLoading: true,
  })

  useEffect(() => {
    // Listen to system_config for cached national stats
    const unsub = onSnapshot(doc(db, 'system_config', 'national_stats'), (snap) => {
      if (snap.exists()) {
        const d = snap.data()
        setStats({
          totalPUs: d.totalPUs ?? 176846,
          activePUs: d.activePUs ?? 0,
          offlinePUs: d.offlinePUs ?? 0,
          completedPUs: d.completedPUs ?? 0,
          flaggedPUs: d.flaggedPUs ?? 0,
          totalVotesCast: d.totalVotesCast ?? 0,
          totalVehicles: d.totalVehicles ?? 0,
          vehiclesInTransit: d.vehiclesInTransit ?? 0,
          vehiclesDelivered: d.vehiclesDelivered ?? 0,
          isLoading: false,
        })
      } else {
        setStats(prev => ({ ...prev, isLoading: false }))
      }
    })
    return () => unsub()
  }, [])

  return stats
}

// ─── Live Incidents ───────────────────────────────────────────────────────────
export interface LiveIncident {
  incidentId: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
  status: 'open' | 'acknowledged' | 'resolved'
  officerName: string
  puId: string
  stateId: string
  lgaId: string
  coordinates: { latitude: number; longitude: number } | null
  reportedAt: Date
  imageUrls: string[]
}

export function useLiveIncidents(limitCount = 50) {
  const [incidents, setIncidents] = useState<LiveIncident[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'incidents'),
      orderBy('reportedAt', 'desc'),
      limit(limitCount)
    )
    const unsub = onSnapshot(q, (snap) => {
      const data: LiveIncident[] = snap.docs.map(d => {
        const r = d.data()
        return {
          incidentId: d.id,
          title: r.title ?? '',
          description: r.description ?? '',
          severity: r.severity ?? 'medium',
          category: r.category ?? 'other',
          status: r.status ?? 'open',
          officerName: r.officerName ?? '',
          puId: r.puId ?? '',
          stateId: r.stateId ?? '',
          lgaId: r.lgaId ?? '',
          coordinates: r.reportCoordinates
            ? { latitude: r.reportCoordinates.latitude, longitude: r.reportCoordinates.longitude }
            : null,
          reportedAt: r.reportedAt?.toDate() ?? new Date(),
          imageUrls: r.imageUrls ?? [],
        }
      })
      setIncidents(data)
      setIsLoading(false)
    })
    return () => unsub()
  }, [limitCount])

  return { incidents, isLoading }
}

// ─── Live Fleet Locations ─────────────────────────────────────────────────────
export interface LiveVehicle {
  vehicleId: string
  vehicleReg: string
  driverName: string
  status: string
  currentCoordinates: { latitude: number; longitude: number }
  speedKph: number
  heading: number
  lastUpdated: Date
  isFlagged: boolean
  stateId: string
  lgaId: string
  assignedWards: string[]
}

export function useLiveFleet() {
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'fleet_locations'), (snap) => {
      const data: LiveVehicle[] = snap.docs.map(d => {
        const r = d.data()
        return {
          vehicleId: d.id,
          vehicleReg: r.vehicleReg ?? '',
          driverName: r.driverName ?? '',
          status: r.status ?? 'idle',
          currentCoordinates: r.currentCoordinates
            ? { latitude: r.currentCoordinates.latitude, longitude: r.currentCoordinates.longitude }
            : { latitude: 9.08, longitude: 8.67 },
          speedKph: r.speedKph ?? 0,
          heading: r.heading ?? 0,
          lastUpdated: r.lastUpdated?.toDate() ?? new Date(),
          isFlagged: r.isFlagged ?? false,
          stateId: r.stateId ?? '',
          lgaId: r.lgaId ?? '',
          assignedWards: r.assignedWards ?? [],
        }
      })
      setVehicles(data)
      setIsLoading(false)
    })
    return () => unsub()
  }, [])

  return { vehicles, isLoading }
}

// ─── Live AI Alerts ───────────────────────────────────────────────────────────
export interface LiveAlert {
  alertId: string
  alertType: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  isRead: boolean
  createdAt: Date
  stateId?: string
}

export function useLiveAlerts() {
  const [alerts, setAlerts] = useState<LiveAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'ai_alerts'),
      where('isDismissed', '==', false),
      orderBy('createdAt', 'desc'),
      limit(100)
    )
    const unsub = onSnapshot(q, (snap) => {
      const data: LiveAlert[] = snap.docs.map(d => {
        const r = d.data()
        return {
          alertId: d.id,
          alertType: r.alertType ?? '',
          severity: r.severity ?? 'medium',
          title: r.title ?? '',
          message: r.message ?? '',
          isRead: r.isRead ?? false,
          createdAt: r.createdAt?.toDate() ?? new Date(),
          stateId: r.stateId,
        }
      })
      setAlerts(data)
      setIsLoading(false)
    })
    return () => unsub()
  }, [])

  // Mark alert as read in Firestore
  const markRead = async (alertId: string) => {
    await updateDoc(doc(db, 'ai_alerts', alertId), {
      isRead: true,
      readAt: Timestamp.now(),
    })
  }

  const dismiss = async (alertId: string) => {
    await updateDoc(doc(db, 'ai_alerts', alertId), {
      isDismissed: true,
      dismissedAt: Timestamp.now(),
    })
  }

  return { alerts, isLoading, markRead, dismiss }
}

// ─── Live Polling Units by State/LGA ─────────────────────────────────────────
export interface LivePU {
  puId: string
  puCode: string
  name: string
  stateId: string
  lgaId: string
  wardId: string
  status: string
  coordinates: { latitude: number; longitude: number }
  registeredVoters: number
  accreditedVoters: number
  totalVotesCast: number
  assignedOfficerName: string
  isFlagged: boolean
  hasGuaranteedNetwork: boolean
  networkType: string
  materialsDelivered: boolean
}

export function useLivePUs(stateId?: string, lgaId?: string, wardId?: string) {
  const [pus, setPUs] = useState<LivePU[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!stateId) {
      setIsLoading(false)
      return
    }

    let colRef = collection(db, 'states', stateId, 'lgas', lgaId ?? '_', 'wards', wardId ?? '_', 'polling_units')

    // Build query dynamically based on what's selected
    const path = wardId && lgaId
      ? `states/${stateId}/lgas/${lgaId}/wards/${wardId}/polling_units`
      : lgaId
      ? `states/${stateId}/lgas/${lgaId}/wards` // would need collectionGroup in production
      : `states/${stateId}/lgas`

    const unsub = onSnapshot(colRef, (snap) => {
      const data: LivePU[] = snap.docs.map(d => {
        const r = d.data()
        return {
          puId: d.id,
          puCode: r.puCode ?? d.id,
          name: r.name ?? '',
          stateId: r.stateId ?? stateId,
          lgaId: r.lgaId ?? lgaId ?? '',
          wardId: r.wardId ?? wardId ?? '',
          status: r.status ?? 'pending',
          coordinates: r.coordinates
            ? { latitude: r.coordinates.latitude, longitude: r.coordinates.longitude }
            : { latitude: 9.08, longitude: 8.67 },
          registeredVoters: r.registeredVoters ?? 0,
          accreditedVoters: r.accreditedVoters ?? 0,
          totalVotesCast: r.totalVotesCast ?? 0,
          assignedOfficerName: r.assignedOfficerName ?? '',
          isFlagged: r.isFlagged ?? false,
          hasGuaranteedNetwork: r.hasGuaranteedNetwork ?? false,
          networkType: r.networkType ?? 'lte',
          materialsDelivered: r.materialsDelivered ?? false,
        }
      })
      setPUs(data)
      setIsLoading(false)
    })
    return () => unsub()
  }, [stateId, lgaId, wardId])

  return { pus, isLoading }
}
