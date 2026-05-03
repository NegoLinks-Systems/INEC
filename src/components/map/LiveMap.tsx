// src/components/map/LiveMap.tsx
// ─────────────────────────────────────────────────────────────────────────────
// MINI-INEC 2.0 — Interactive Live Map (Module 1 + Module 3)
// React Leaflet with marker clustering for 176k+ PUs + fleet vehicles
// Dynamically reveals individual markers as admin zooms in
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import React, { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Layers, Truck, MapPin, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { getAllMockPUs, MOCK_VEHICLES, MockPU, MockVehicle } from '@/firebase/mockData'
import { useFilters } from '../dashboard/DashboardLayout'

// ─── Dynamic imports to avoid SSR issues with Leaflet ────────────────────────
const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((m) => m.Popup),
  { ssr: false }
)
const MarkerClusterGroup = dynamic(
  () => import('react-leaflet-cluster'),
  { ssr: false }
)

// ─── Layer Controls ───────────────────────────────────────────────────────────
const LAYERS = ['PUs', 'Vehicles', 'Incidents'] as const
type LayerType = (typeof LAYERS)[number]

// ─── PU Status Colors ─────────────────────────────────────────────────────────
function getPUColor(status: string): string {
  const map: Record<string, string> = {
    active: '#00a651',
    voting: '#3b82f6',
    completed: '#10b981',
    pending: '#6b7280',
    offline: '#f59e0b',
    flagged: '#ef4444',
    collating: '#8b5cf6',
    submitted: '#06b6d4',
  }
  return map[status] || '#6b7280'
}

// ─── Vehicle Status Colors ────────────────────────────────────────────────────
function getVehicleColor(status: string): string {
  const map: Record<string, string> = {
    in_transit: '#3b82f6',
    delivered: '#10b981',
    flagged: '#ef4444',
    dispatched: '#8b5cf6',
    idle: '#6b7280',
    delayed: '#f59e0b',
  }
  return map[status] || '#6b7280'
}

// ─── Custom SVG Marker Creator ────────────────────────────────────────────────
function createPUIcon(color: string, isFlagged: boolean) {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require('leaflet')
  const svg = `
    <svg width="24" height="32" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z"
        fill="${color}" stroke="${isFlagged ? '#ef4444' : '#000'}" stroke-width="${isFlagged ? 2 : 1}" opacity="0.9"/>
      <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
      ${isFlagged ? '<text x="12" y="16" text-anchor="middle" font-size="8" fill="#ef4444" font-weight="bold">!</text>' : ''}
    </svg>
  `
  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32],
  })
}

function createVehicleIcon(color: string, isFlagged: boolean) {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require('leaflet')
  const svg = `
    <svg width="32" height="28" viewBox="0 0 32 28" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="8" width="28" height="16" rx="4" fill="${color}" stroke="${isFlagged ? '#ef4444' : '#000'}" stroke-width="${isFlagged ? 2 : 1}" opacity="0.9"/>
      <rect x="6" y="4" width="14" height="8" rx="2" fill="${color}" opacity="0.7"/>
      <circle cx="8" cy="24" r="4" fill="#1a2235" stroke="#fff" stroke-width="1.5"/>
      <circle cx="24" cy="24" r="4" fill="#1a2235" stroke="#fff" stroke-width="1.5"/>
      ${isFlagged ? '<circle cx="26" cy="4" r="5" fill="#ef4444"/><text x="26" y="8" text-anchor="middle" font-size="8" fill="white" font-weight="bold">!</text>' : ''}
    </svg>
  `
  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [32, 28],
    iconAnchor: [16, 28],
    popupAnchor: [0, -28],
  })
}

// ─── PU Popup ─────────────────────────────────────────────────────────────────
function PUPopup({ pu, onStream }: { pu: MockPU; onStream: (pu: MockPU) => void }) {
  const color = getPUColor(pu.status)
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 220 }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#e8edf5' }}>{pu.name}</div>
        <div style={{ fontSize: 10, fontFamily: 'Space Mono, monospace', color: '#00a651', marginTop: 2 }}>{pu.puCode}</div>
      </div>
      <div style={{ fontSize: 12, color: '#8b98b8', lineHeight: 1.8 }}>
        <div>Officer: <span style={{ color: '#e8edf5' }}>{pu.assignedOfficerName}</span></div>
        <div>Registered: <span style={{ color: '#e8edf5', fontFamily: 'Space Mono, monospace' }}>{pu.registeredVoters.toLocaleString()}</span></div>
        <div>Accredited: <span style={{ color: '#e8edf5', fontFamily: 'Space Mono, monospace' }}>{pu.accreditedVoters.toLocaleString()}</span></div>
        <div>Votes Cast: <span style={{ color: '#00a651', fontFamily: 'Space Mono, monospace' }}>{pu.totalVotesCast.toLocaleString()}</span></div>
        <div>Status: <span style={{ color }}>{pu.status}</span></div>
        <div>Network: <span style={{ color: pu.hasGuaranteedNetwork ? '#00a651' : '#f59e0b' }}>{pu.networkType.toUpperCase()}</span></div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
        <button
          style={{
            flex: 1,
            padding: '6px 8px',
            background: '#00a651',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onClick={() => onStream(pu)}
        >
          📹 Request Stream
        </button>
      </div>
    </div>
  )
}

// ─── Vehicle Popup ────────────────────────────────────────────────────────────
function VehiclePopup({ vehicle }: { vehicle: MockVehicle }) {
  const color = getVehicleColor(vehicle.status)
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 200 }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#e8edf5' }}>{vehicle.vehicleReg}</div>
        <div style={{ fontSize: 10, fontFamily: 'Space Mono, monospace', color, marginTop: 2 }}>{vehicle.status.replace('_', ' ').toUpperCase()}</div>
      </div>
      <div style={{ fontSize: 12, color: '#8b98b8', lineHeight: 1.8 }}>
        <div>Driver: <span style={{ color: '#e8edf5' }}>{vehicle.driverName}</span></div>
        <div>Speed: <span style={{ color: '#e8edf5', fontFamily: 'Space Mono, monospace' }}>{vehicle.speedKph} km/h</span></div>
        <div>Heading: <span style={{ color: '#e8edf5', fontFamily: 'Space Mono, monospace' }}>{vehicle.heading}°</span></div>
        <div>Wards: <span style={{ color: '#e8edf5' }}>{vehicle.assignedWards.length} assigned</span></div>
        {vehicle.isFlagged && (
          <div style={{ color: '#ef4444', fontWeight: 600, marginTop: 4 }}>⚠ FLAGGED — Stationary Alert</div>
        )}
      </div>
    </div>
  )
}

// ─── Main Map Component ───────────────────────────────────────────────────────
export default function LiveMap() {
  const { filters } = useFilters()
  const allPUs = getAllMockPUs()
  const [activeLayers, setActiveLayers] = useState<Set<LayerType>>(new Set(['PUs', 'Vehicles']))
  const [selectedPU, setSelectedPU] = useState<MockPU | null>(null)

  const visiblePUs = useMemo(() => {
    return allPUs.filter((pu) => {
      if (filters.selectedStateId && pu.stateId !== filters.selectedStateId) return false
      if (filters.selectedLgaId && pu.lgaId !== filters.selectedLgaId) return false
      if (filters.selectedWardId && pu.wardId !== filters.selectedWardId) return false
      return true
    })
  }, [allPUs, filters])

  const visibleVehicles = useMemo(() => {
    return MOCK_VEHICLES.filter((v) => {
      if (filters.selectedStateId && v.stateId !== filters.selectedStateId) return false
      if (filters.selectedLgaId && v.lgaId !== filters.selectedLgaId) return false
      return true
    })
  }, [filters])

  const toggleLayer = useCallback((layer: LayerType) => {
    setActiveLayers((prev) => {
      const next = new Set(prev)
      next.has(layer) ? next.delete(layer) : next.add(layer)
      return next
    })
  }, [])

  // Default center — Nigeria centroid
  const center: [number, number] = filters.selectedStateId
    ? [
        allPUs.find((p) => p.stateId === filters.selectedStateId)?.coordinates.latitude ?? 9.08,
        allPUs.find((p) => p.stateId === filters.selectedStateId)?.coordinates.longitude ?? 7.49,
      ]
    : [9.082, 8.6753]

  const zoom = filters.selectedWardId ? 14 : filters.selectedLgaId ? 11 : filters.selectedStateId ? 8 : 6

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 20, gap: 12 }}>
      {/* Map header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>
            Live Operations Map
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {visiblePUs.length} Polling Units · {visibleVehicles.length} Vehicles
          </p>
        </div>

        {/* Layer toggles */}
        <div style={{ display: 'flex', gap: 8 }}>
          {LAYERS.map((layer) => (
            <button
              key={layer}
              className={`btn btn-sm ${activeLayers.has(layer) ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => toggleLayer(layer)}
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {layer === 'PUs' && <MapPin size={12} />}
              {layer === 'Vehicles' && <Truck size={12} />}
              {layer === 'Incidents' && <AlertTriangle size={12} />}
              {activeLayers.has(layer) ? <Eye size={12} /> : <EyeOff size={12} />}
              {layer}
            </button>
          ))}
        </div>
      </div>

      {/* Map container */}
      <div style={{
        flex: 1,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--bg-border)',
        position: 'relative',
      }}>
        <MapContainer
          key={`${center[0]}-${center[1]}-${zoom}`}
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* PU Layer with Clustering */}
          {activeLayers.has('PUs') && (
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={60}
              showCoverageOnHover={false}
            >
              {visiblePUs.map((pu) => {
                const icon = createPUIcon(getPUColor(pu.status), pu.isFlagged)
                if (!icon) return null
                return (
                  <Marker
                    key={pu.puId}
                    position={[pu.coordinates.latitude, pu.coordinates.longitude]}
                    icon={icon}
                  >
                    <Popup>
                      <PUPopup pu={pu} onStream={(p) => setSelectedPU(p)} />
                    </Popup>
                  </Marker>
                )
              })}
            </MarkerClusterGroup>
          )}

          {/* Vehicle Layer */}
          {activeLayers.has('Vehicles') && visibleVehicles.map((vehicle) => {
            const icon = createVehicleIcon(getVehicleColor(vehicle.status), vehicle.isFlagged)
            if (!icon) return null
            return (
              <Marker
                key={vehicle.vehicleId}
                position={[vehicle.currentCoordinates.latitude, vehicle.currentCoordinates.longitude]}
                icon={icon}
              >
                <Popup>
                  <VehiclePopup vehicle={vehicle} />
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {/* Map Legend */}
        <div style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--bg-border)',
          borderRadius: 8,
          padding: '10px 14px',
          zIndex: 1000,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>
            PU STATUS
          </div>
          {[
            { status: 'active', label: 'Active' },
            { status: 'voting', label: 'Voting' },
            { status: 'offline', label: 'Offline' },
            { status: 'flagged', label: 'Flagged' },
            { status: 'completed', label: 'Completed' },
          ].map(({ status, label }) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: getPUColor(status) }} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
