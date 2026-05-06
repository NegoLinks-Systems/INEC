// src/components/map/LiveMap.tsx
'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Truck, MapPin, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { getAllMockPUs, MOCK_VEHICLES, MockPU, MockVehicle } from '@/firebase/mockData'
import { useFilters } from '../dashboard/DashboardLayout'

// Dynamic imports — avoid SSR issues with Leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })
const MarkerClusterGroup = dynamic(() => import('react-leaflet-cluster'), { ssr: false })

const LAYERS = ['PUs', 'Vehicles', 'Incidents'] as const
type LayerType = (typeof LAYERS)[number]

// ─── Colors ───────────────────────────────────────────────────────────────────
function getPUColor(status: string): string {
  const map: Record<string, string> = {
    active: '#00a651', voting: '#3b82f6', completed: '#10b981',
    pending: '#94a3b8', offline: '#f59e0b', flagged: '#ef4444',
    collating: '#8b5cf6', submitted: '#06b6d4',
  }
  return map[status] || '#94a3b8'
}

function getVehicleColor(status: string): string {
  const map: Record<string, string> = {
    in_transit: '#3b82f6', delivered: '#10b981', flagged: '#ef4444',
    dispatched: '#8b5cf6', idle: '#94a3b8', delayed: '#f59e0b',
  }
  return map[status] || '#94a3b8'
}

// ─── Custom icons ─────────────────────────────────────────────────────────────
function createPUIcon(color: string, isFlagged: boolean) {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require('leaflet')
  return L.divIcon({
    className: '',
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:${color};
      border:2px solid ${isFlagged ? '#ef4444' : 'rgba(255,255,255,0.8)'};
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  })
}

function createVehicleIcon(color: string, isFlagged: boolean) {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require('leaflet')
  return L.divIcon({
    className: '',
    html: `<div style="
      width:20px;height:20px;border-radius:4px;
      background:${color};
      border:2px solid ${isFlagged ? '#ef4444' : 'rgba(255,255,255,0.8)'};
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
      display:flex;align-items:center;justify-content:center;
      font-size:10px;
    ">🚚</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  })
}

// ─── PU Popup ─────────────────────────────────────────────────────────────────
function PUPopup({ pu, onStream }: { pu: MockPU; onStream: (pu: MockPU) => void }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minWidth: 210, fontSize: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: '#1a202c' }}>{pu.name}</div>
      <div style={{ color: '#00a651', fontFamily: 'monospace', marginBottom: 6, fontSize: 11 }}>{pu.puCode}</div>
      <div style={{ color: '#4a5568', lineHeight: 1.8 }}>
        <div>Officer: <strong style={{ color: '#1a202c' }}>{pu.assignedOfficerName}</strong></div>
        <div>Registered: <strong style={{ color: '#1a202c' }}>{pu.registeredVoters.toLocaleString()}</strong></div>
        <div>Accredited: <strong style={{ color: '#1a202c' }}>{pu.accreditedVoters.toLocaleString()}</strong></div>
        <div>Votes Cast: <strong style={{ color: '#00a651' }}>{pu.totalVotesCast.toLocaleString()}</strong></div>
        <div>Status: <strong style={{ color: getPUColor(pu.status) }}>{pu.status}</strong></div>
      </div>
      <button
        onClick={() => onStream(pu)}
        style={{
          marginTop: 8, width: '100%', padding: '6px',
          background: '#00a651', color: '#fff', border: 'none',
          borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}
      >
        📹 Request Live Stream
      </button>
    </div>
  )
}

// ─── Vehicle Popup ────────────────────────────────────────────────────────────
function VehiclePopup({ vehicle }: { vehicle: MockVehicle }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minWidth: 190, fontSize: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: '#1a202c' }}>{vehicle.vehicleReg}</div>
      <div style={{ color: getVehicleColor(vehicle.status), fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', fontSize: 10 }}>
        {vehicle.status.replace('_', ' ')}
      </div>
      <div style={{ color: '#4a5568', lineHeight: 1.8 }}>
        <div>Driver: <strong style={{ color: '#1a202c' }}>{vehicle.driverName}</strong></div>
        <div>Speed: <strong style={{ color: '#1a202c' }}>{vehicle.speedKph} km/h</strong></div>
        <div>Heading: <strong style={{ color: '#1a202c' }}>{vehicle.heading}°</strong></div>
        <div>State: <strong style={{ color: '#1a202c' }}>{vehicle.stateId}</strong></div>
        {vehicle.isFlagged && <div style={{ color: '#ef4444', fontWeight: 700, marginTop: 4 }}>⚠ FLAGGED</div>}
      </div>
    </div>
  )
}

// ─── Fix Leaflet CSS (must run client-side) ───────────────────────────────────
function LeafletCSSFix() {
  useEffect(() => {
    // Remove the dark CSS filter from map tiles — makes map readable
    const style = document.createElement('style')
    style.innerHTML = `
      .leaflet-tile { filter: none !important; }
      .leaflet-tile-container { pointer-events: none; }
      .leaflet-container { background: #a8c8a8 !important; font-family: system-ui !important; }
      .leaflet-popup-content-wrapper {
        background: #fff !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 10px !important;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
        color: #1a202c !important;
      }
      .leaflet-popup-tip { background: #fff !important; }
      .leaflet-popup-close-button { color: #4a5568 !important; }
      .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large {
        background: rgba(0,166,81,0.2) !important;
      }
      .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div {
        background: rgba(0,166,81,0.7) !important;
        color: #fff !important;
        font-weight: 700;
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])
  return null
}

// ─── Main Map Component ───────────────────────────────────────────────────────
export default function LiveMap() {
  const { filters } = useFilters()
  const allPUs = getAllMockPUs()
  const [activeLayers, setActiveLayers] = useState<Set<LayerType>>(new Set<LayerType>(['PUs', 'Vehicles'] as LayerType[]))
  const [, setSelectedPU] = useState<MockPU | null>(null)

  const visiblePUs = useMemo(() => {
    return allPUs.filter(pu => {
      if (filters.selectedStateId && pu.stateId !== filters.selectedStateId) return false
      if (filters.selectedLgaId && pu.lgaId !== filters.selectedLgaId) return false
      if (filters.selectedWardId && pu.wardId !== filters.selectedWardId) return false
      return true
    })
  }, [allPUs, filters])

  const visibleVehicles = useMemo(() => {
    return MOCK_VEHICLES.filter(v => {
      if (filters.selectedStateId && v.stateId !== filters.selectedStateId) return false
      return true
    })
  }, [filters])

  const toggleLayer = useCallback((layer: LayerType) => {
    setActiveLayers(prev => {
      const next = new Set(prev)
      next.has(layer) ? next.delete(layer) : next.add(layer)
      return next
    })
  }, [])

  // Nigeria center
  const zoom = filters.selectedWardId ? 11 : filters.selectedLgaId ? 10 : filters.selectedStateId ? 7 : 6
  // Nigeria center - fixed coordinates showing full country
  const NIGERIA_CENTER: [number, number] = [8.0, 7.5]
  const STATE_CENTERS: Record<string, [number, number]> = {
    'abia': [5.45, 7.52], 'adamawa': [9.33, 12.40], 'akwa_ibom': [5.01, 7.85],
    'anambra': [6.21, 7.07], 'bauchi': [10.32, 9.84], 'bayelsa': [4.93, 6.27],
    'benue': [7.19, 8.13], 'borno': [11.83, 13.15], 'cross_river': [5.87, 8.60],
    'delta': [5.53, 5.90], 'ebonyi': [6.26, 8.01], 'edo': [6.34, 5.60],
    'ekiti': [7.72, 5.31], 'enugu': [6.46, 7.55], 'abuja': [9.06, 7.50],
    'gombe': [10.29, 11.17], 'imo': [5.49, 7.03], 'jigawa': [12.23, 9.56],
    'kaduna': [10.52, 7.44], 'kano': [12.00, 8.59], 'katsina': [12.98, 7.62],
    'kebbi': [12.45, 4.20], 'kogi': [7.73, 6.69], 'kwara': [8.97, 4.39],
    'lagos': [6.52, 3.38], 'nasarawa': [8.54, 8.32], 'niger': [9.93, 5.60],
    'ogun': [7.16, 3.35], 'ondo': [7.25, 5.20], 'osun': [7.78, 4.54],
    'oyo': [8.16, 3.61], 'plateau': [9.22, 9.52], 'rivers': [4.82, 7.05],
    'sokoto': [13.01, 5.25], 'taraba': [8.89, 11.36], 'yobe': [12.29, 11.44],
    'zamfara': [12.17, 6.66],
  }
  const mapCenter: [number, number] = filters.selectedStateId
    ? (STATE_CENTERS[filters.selectedStateId] ?? NIGERIA_CENTER)
    : NIGERIA_CENTER

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 16, gap: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>
            Live Operations Map
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {visiblePUs.length} Polling Units · {visibleVehicles.length} Vehicles · Nigeria
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {LAYERS.map(layer => (
            <button
              key={layer}
              className={`btn btn-sm ${activeLayers.has(layer) ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => toggleLayer(layer)}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {layer === 'PUs' && <MapPin size={11} />}
              {layer === 'Vehicles' && <Truck size={11} />}
              {layer === 'Incidents' && <AlertTriangle size={11} />}
              {activeLayers.has(layer) ? <Eye size={11} /> : <EyeOff size={11} />}
              {layer}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div style={{
        flex: 1, borderRadius: 12, overflow: 'hidden',
        border: '1px solid var(--bg-border)', position: 'relative',
        minHeight: 0,
      }}>
        <LeafletCSSFix />
        <MapContainer
          key={`map-${filters.selectedStateId ?? 'all'}-${filters.selectedLgaId ?? ''}-${filters.selectedWardId ?? ''}`}
          center={mapCenter}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          {/* Standard readable OSM tiles — no dark filter */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© OpenStreetMap contributors'
            maxZoom={19}
          />

          {/* PU Markers */}
          {activeLayers.has('PUs') && (
            <MarkerClusterGroup chunkedLoading maxClusterRadius={50} showCoverageOnHover={false}>
              {visiblePUs.map(pu => {
                const icon = createPUIcon(getPUColor(pu.status), pu.isFlagged)
                if (!icon) return null
                return (
                  <Marker
                    key={pu.puId}
                    position={[pu.coordinates.latitude, pu.coordinates.longitude]}
                    icon={icon}
                  >
                    <Popup>
                      <PUPopup pu={pu} onStream={p => setSelectedPU(p)} />
                    </Popup>
                  </Marker>
                )
              })}
            </MarkerClusterGroup>
          )}

          {/* Vehicle Markers */}
          {activeLayers.has('Vehicles') && visibleVehicles.map(vehicle => {
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

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 12, right: 12, zIndex: 1000,
          background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0',
          borderRadius: 8, padding: '10px 12px', fontSize: 11,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          <div style={{ fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', color: '#4a5568', marginBottom: 6, textTransform: 'uppercase' }}>
            PU Status
          </div>
          {[
            { status: 'active', label: 'Active' },
            { status: 'voting', label: 'Voting' },
            { status: 'offline', label: 'Offline' },
            { status: 'flagged', label: 'Flagged' },
            { status: 'completed', label: 'Completed' },
            { status: 'pending', label: 'Pending' },
          ].map(({ status, label }) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: getPUColor(status), border: '1px solid rgba(0,0,0,0.1)' }} />
              <span style={{ color: '#4a5568' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
