// src/hooks/firebase/useFirestore.ts
'use client'

import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, query,
  orderBy, limit, doc, updateDoc, Timestamp,
  collectionGroup, where,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { NATIONAL_STATS, MOCK_VEHICLES, MOCK_INCIDENTS, MOCK_ALERTS } from '@/firebase/mockData'

// ─── Types ────────────────────────────────────────────────────────────────────
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

export interface LiveState {
  stateId: string
  name: string
  code: string
  coordinates: { latitude: number; longitude: number }
  totalLGAs: number
  totalPUs: number
  stats: {
    activePUs: number
    offlinePUs: number
    completedPUs: number
    flaggedPUs: number
    totalVotesCast: number
  }
}

export interface LiveLGA {
  lgaId: string
  stateId: string
  name: string
  coordinates: { latitude: number; longitude: number }
  totalWards: number
  totalPUs: number
}

export interface LiveWard {
  wardId: string
  lgaId: string
  stateId: string
  name: string
  coordinates: { latitude: number; longitude: number }
  totalPUs: number
}

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

export interface LiveIncident {
  incidentId: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
  status: string
  officerName: string
  puId: string
  stateId: string
  lgaId: string
  coordinates: { latitude: number; longitude: number } | null
  reportedAt: Date
  imageUrls: string[]
}

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

// ─── National Stats ───────────────────────────────────────────────────────────
export function useLiveNationalStats(): LiveNationalStats {
  const [stats, setStats] = useState<LiveNationalStats>({
    ...NATIONAL_STATS,
    isLoading: true,
  })

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'system_config', 'national_stats'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data()
          setStats({
            totalPUs:          d.totalPUs          ?? NATIONAL_STATS.totalPUs,
            activePUs:         d.activePUs          ?? NATIONAL_STATS.activePUs,
            offlinePUs:        d.offlinePUs         ?? NATIONAL_STATS.offlinePUs,
            completedPUs:      d.completedPUs       ?? NATIONAL_STATS.completedPUs,
            flaggedPUs:        d.flaggedPUs         ?? NATIONAL_STATS.flaggedPUs,
            totalVotesCast:    d.totalVotesCast     ?? NATIONAL_STATS.totalVotesCast,
            totalVehicles:     d.totalVehicles      ?? NATIONAL_STATS.totalVehicles,
            vehiclesInTransit: d.vehiclesInTransit  ?? NATIONAL_STATS.vehiclesInTransit,
            vehiclesDelivered: d.vehiclesDelivered  ?? NATIONAL_STATS.vehiclesDelivered,
            isLoading: false,
          })
        } else {
          // Fall back to mock data if not seeded yet
          setStats({ ...NATIONAL_STATS, isLoading: false })
        }
      },
      () => setStats({ ...NATIONAL_STATS, isLoading: false })
    )
    return () => unsub()
  }, [])

  return stats
}

// ─── All States ───────────────────────────────────────────────────────────────
export function useLiveStates() {
  const [states, setStates] = useState<LiveState[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'states'),
      (snap) => {
        const data: LiveState[] = snap.docs.map(d => {
          const r = d.data()
          return {
            stateId:     d.id,
            name:        r.name        ?? d.id,
            code:        r.code        ?? '',
            coordinates: r.coordinates ?? { latitude: 9.08, longitude: 8.67 },
            totalLGAs:   r.totalLGAs   ?? 0,
            totalPUs:    r.totalPUs    ?? 0,
            stats: {
              activePUs:     r.stats?.activePUs     ?? 0,
              offlinePUs:    r.stats?.offlinePUs    ?? 0,
              completedPUs:  r.stats?.completedPUs  ?? 0,
              flaggedPUs:    r.stats?.flaggedPUs    ?? 0,
              totalVotesCast: r.stats?.totalVotesCast ?? 0,
            },
          }
        })
        // Sort alphabetically
        data.sort((a, b) => a.name.localeCompare(b.name))
        setStates(data)
        setIsLoading(false)
      },
      () => setIsLoading(false)
    )
    return () => unsub()
  }, [])

  return { states, isLoading }
}

// ─── LGAs for a state ─────────────────────────────────────────────────────────
export function useLiveLGAs(stateId: string | null) {
  const [lgas, setLGAs] = useState<LiveLGA[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!stateId) { setLGAs([]); return }
    setIsLoading(true)
    const unsub = onSnapshot(
      collection(db, 'states', stateId, 'lgas'),
      (snap) => {
        const data: LiveLGA[] = snap.docs.map(d => {
          const r = d.data()
          return {
            lgaId:       d.id,
            stateId,
            name:        r.name        ?? d.id,
            coordinates: r.coordinates ?? { latitude: 9.08, longitude: 8.67 },
            totalWards:  r.totalWards  ?? 0,
            totalPUs:    r.totalPUs    ?? 0,
          }
        })
        data.sort((a, b) => a.name.localeCompare(b.name))
        setLGAs(data)
        setIsLoading(false)
      },
      () => setIsLoading(false)
    )
    return () => unsub()
  }, [stateId])

  return { lgas, isLoading }
}

// ─── Wards for an LGA ─────────────────────────────────────────────────────────
export function useLiveWards(stateId: string | null, lgaId: string | null) {
  const [wards, setWards] = useState<LiveWard[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!stateId || !lgaId) { setWards([]); return }
    setIsLoading(true)
    const unsub = onSnapshot(
      collection(db, 'states', stateId, 'lgas', lgaId, 'wards'),
      (snap) => {
        const data: LiveWard[] = snap.docs.map(d => {
          const r = d.data()
          return {
            wardId:      d.id,
            lgaId,
            stateId,
            name:        r.name        ?? d.id,
            coordinates: r.coordinates ?? { latitude: 9.08, longitude: 8.67 },
            totalPUs:    r.totalPUs    ?? 0,
          }
        })
        data.sort((a, b) => a.name.localeCompare(b.name))
        setWards(data)
        setIsLoading(false)
      },
      () => setIsLoading(false)
    )
    return () => unsub()
  }, [stateId, lgaId])

  return { wards, isLoading }
}

// ─── PUs for a Ward ───────────────────────────────────────────────────────────
export function useLiveWardPUs(stateId: string | null, lgaId: string | null, wardId: string | null) {
  const [pus, setPUs] = useState<LivePU[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!stateId || !lgaId || !wardId) { setPUs([]); return }
    setIsLoading(true)
    const unsub = onSnapshot(
      collection(db, 'states', stateId, 'lgas', lgaId, 'wards', wardId, 'polling_units'),
      (snap) => {
        const data: LivePU[] = snap.docs.map(d => {
          const r = d.data()
          return {
            puId:                d.id,
            puCode:              r.puCode              ?? d.id,
            name:                r.name                ?? '',
            stateId:             r.stateId             ?? stateId,
            lgaId:               r.lgaId               ?? lgaId,
            wardId:              r.wardId              ?? wardId,
            status:              r.status              ?? 'pending',
            coordinates:         r.coordinates
              ? { latitude: r.coordinates.latitude, longitude: r.coordinates.longitude }
              : { latitude: 9.08, longitude: 8.67 },
            registeredVoters:    r.registeredVoters    ?? 0,
            accreditedVoters:    r.accreditedVoters    ?? 0,
            totalVotesCast:      r.totalVotesCast      ?? 0,
            assignedOfficerName: r.assignedOfficerName ?? 'Unassigned',
            isFlagged:           r.isFlagged           ?? false,
            hasGuaranteedNetwork: r.hasGuaranteedNetwork ?? false,
            networkType:         r.networkType         ?? 'lte',
            materialsDelivered:  r.materialsDelivered  ?? false,
          }
        })
        setPUs(data)
        setIsLoading(false)
      },
      () => setIsLoading(false)
    )
    return () => unsub()
  }, [stateId, lgaId, wardId])

  return { pus, isLoading }
}

// ─── Live Fleet ───────────────────────────────────────────────────────────────
export function useLiveFleet() {
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'fleet_locations'),
      (snap) => {
        if (snap.empty) {
          // Fall back to mock data
          setVehicles(MOCK_VEHICLES.map(v => ({
            vehicleId:          v.vehicleId,
            vehicleReg:         v.vehicleReg,
            driverName:         v.driverName,
            status:             v.status,
            currentCoordinates: v.currentCoordinates,
            speedKph:           v.speedKph,
            heading:            v.heading,
            lastUpdated:        v.lastUpdated,
            isFlagged:          v.isFlagged,
            stateId:            v.stateId,
            lgaId:              v.lgaId,
            assignedWards:      v.assignedWards,
          })))
          setIsLoading(false)
          return
        }
        const data: LiveVehicle[] = snap.docs.map(d => {
          const r = d.data()
          return {
            vehicleId:          d.id,
            vehicleReg:         r.vehicleReg         ?? '',
            driverName:         r.driverName         ?? '',
            status:             r.status             ?? 'idle',
            currentCoordinates: r.currentCoordinates
              ? { latitude: r.currentCoordinates.latitude, longitude: r.currentCoordinates.longitude }
              : { latitude: 9.08, longitude: 8.67 },
            speedKph:           r.speedKph           ?? 0,
            heading:            r.heading            ?? 0,
            lastUpdated:        r.lastUpdated?.toDate() ?? new Date(),
            isFlagged:          r.isFlagged          ?? false,
            stateId:            r.stateId            ?? '',
            lgaId:              r.lgaId              ?? '',
            assignedWards:      r.assignedWards      ?? [],
          }
        })
        setVehicles(data)
        setIsLoading(false)
      },
      () => {
        setVehicles(MOCK_VEHICLES as unknown as LiveVehicle[])
        setIsLoading(false)
      }
    )
    return () => unsub()
  }, [])

  return { vehicles, isLoading }
}

// ─── Live Incidents ───────────────────────────────────────────────────────────
export function useLiveIncidents(limitCount = 50) {
  const [incidents, setIncidents] = useState<LiveIncident[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'incidents'),
      orderBy('reportedAt', 'desc'),
      limit(limitCount)
    )
    const unsub = onSnapshot(q,
      (snap) => {
        if (snap.empty) {
          setIncidents(MOCK_INCIDENTS.map(i => ({
            ...i,
            coordinates: i.coordinates,
          })))
          setIsLoading(false)
          return
        }
        const data: LiveIncident[] = snap.docs.map(d => {
          const r = d.data()
          return {
            incidentId:   d.id,
            title:        r.title        ?? '',
            description:  r.description  ?? '',
            severity:     r.severity     ?? 'medium',
            category:     r.category     ?? 'other',
            status:       r.status       ?? 'open',
            officerName:  r.officerName  ?? '',
            puId:         r.puId         ?? '',
            stateId:      r.stateId      ?? '',
            lgaId:        r.lgaId        ?? '',
            coordinates:  r.reportCoordinates
              ? { latitude: r.reportCoordinates.latitude, longitude: r.reportCoordinates.longitude }
              : null,
            reportedAt:   r.reportedAt?.toDate() ?? new Date(),
            imageUrls:    r.imageUrls    ?? [],
          }
        })
        setIncidents(data)
        setIsLoading(false)
      },
      () => {
        setIncidents(MOCK_INCIDENTS as unknown as LiveIncident[])
        setIsLoading(false)
      }
    )
    return () => unsub()
  }, [limitCount])

  return { incidents, isLoading }
}

// ─── Live AI Alerts ───────────────────────────────────────────────────────────
export function useLiveAlerts() {
  const [alerts, setAlerts] = useState<LiveAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'ai_alerts'),
      orderBy('createdAt', 'desc'),
      limit(100)
    )
    const unsub = onSnapshot(q,
      (snap) => {
        if (snap.empty) {
          setAlerts(MOCK_ALERTS.map(a => ({
            alertId:   a.alertId,
            alertType: a.alertType,
            severity:  a.severity,
            title:     a.title,
            message:   a.message,
            isRead:    a.isRead,
            createdAt: a.createdAt,
            stateId:   a.stateId,
          })))
          setIsLoading(false)
          return
        }
        const data: LiveAlert[] = snap.docs.map(d => {
          const r = d.data()
          return {
            alertId:   d.id,
            alertType: r.alertType ?? '',
            severity:  r.severity  ?? 'medium',
            title:     r.title     ?? '',
            message:   r.message   ?? '',
            isRead:    r.isRead    ?? false,
            createdAt: r.createdAt?.toDate() ?? new Date(),
            stateId:   r.stateId,
          }
        })
        setAlerts(data)
        setIsLoading(false)
      },
      () => {
        setAlerts(MOCK_ALERTS as unknown as LiveAlert[])
        setIsLoading(false)
      }
    )
    return () => unsub()
  }, [])

  const markRead = async (alertId: string) => {
    try {
      await updateDoc(doc(db, 'ai_alerts', alertId), {
        isRead: true, readAt: Timestamp.now(),
      })
    } catch { /* ignore */ }
  }

  const dismiss = async (alertId: string) => {
    try {
      await updateDoc(doc(db, 'ai_alerts', alertId), {
        isDismissed: true, dismissedAt: Timestamp.now(),
      })
    } catch { /* ignore */ }
  }

  return { alerts, isLoading, markRead, dismiss }
}

// ─── Live PUs via collectionGroup (for map) ───────────────────────────────────
export function useLiveAllPUs(stateId: string | null) {
  const [pus, setPUs]         = useState<LivePU[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const q = stateId
      ? query(collectionGroup(db, 'polling_units'), where('stateId', '==', stateId), limit(500))
      : query(collectionGroup(db, 'polling_units'), limit(300))

    const unsub = onSnapshot(q, (snap) => {
      const data: LivePU[] = snap.docs.map(d => {
        const r = d.data()
        return {
          puId:                d.id,
          puCode:              r.puCode              ?? d.id,
          name:                r.name                ?? 'Polling Unit',
          stateId:             r.stateId             ?? '',
          lgaId:               r.lgaId               ?? '',
          wardId:              r.wardId              ?? '',
          status:              r.status              ?? 'pending',
          coordinates:         r.coordinates
            ? { latitude: r.coordinates.latitude, longitude: r.coordinates.longitude }
            : { latitude: 9.08 + (Math.random() - 0.5) * 8, longitude: 8.67 + (Math.random() - 0.5) * 8 },
          registeredVoters:    r.registeredVoters    ?? 0,
          accreditedVoters:    r.accreditedVoters    ?? 0,
          totalVotesCast:      r.totalVotesCast      ?? 0,
          assignedOfficerName: r.assignedOfficerName ?? 'Unassigned',
          isFlagged:           r.isFlagged           ?? false,
          hasGuaranteedNetwork: r.hasGuaranteedNetwork ?? false,
          networkType:         r.networkType         ?? 'lte',
          materialsDelivered:  r.materialsDelivered  ?? false,
        }
      })
      setPUs(data)
      setIsLoading(false)
    }, () => setIsLoading(false))

    return () => unsub()
  }, [stateId])

  return { pus, isLoading }
}
