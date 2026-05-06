// src/components/map/LiveMap.tsx
'use client'

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Truck, MapPin, AlertTriangle } from 'lucide-react'
import { getAllMockPUs, MOCK_VEHICLES } from '@/firebase/mockData'
import { useFilters } from '../dashboard/DashboardLayout'

const MapContainer  = dynamic(() => import('react-leaflet').then(m => m.MapContainer),  { ssr: false })
const TileLayer     = dynamic(() => import('react-leaflet').then(m => m.TileLayer),     { ssr: false })
const Marker        = dynamic(() => import('react-leaflet').then(m => m.Marker),        { ssr: false })
const Popup         = dynamic(() => import('react-leaflet').then(m => m.Popup),         { ssr: false })
const MarkerClusterGroup = dynamic(() => import('react-leaflet-cluster'), { ssr: false })

// ─── Nigeria bounding box center ─────────────────────────────────────────────
// Nigeria: 4°N–14°N, 3°E–15°E → geographic center ≈ 9°N, 8°E
const NIGERIA: [number, number] = [9.0, 8.0]
const ZOOM_NATIONAL = 6

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

function statusColor(status: string): string {
  return { active: '#00a651', voting: '#3b82f6', completed: '#10b981',
    pending: '#94a3b8', offline: '#f59e0b', flagged: '#ef4444' }[status] ?? '#94a3b8'
}

function vehicleColor(status: string): string {
  return { in_transit: '#3b82f6', delivered: '#10b981', flagged: '#ef4444',
    dispatched: '#8b5cf6', idle: '#94a3b8' }[status] ?? '#94a3b8'
}

function makeDot(color: string, size = 14) {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require('leaflet')
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -10],
  })
}

function makeVehicleIcon(color: string) {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require('leaflet')
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:5px;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:12px;">🚚</div>`,
    iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -14],
  })
}

// ─── Map flyTo when filters change ───────────────────────────────────────────
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const { useMap } = require('react-leaflet')
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 })
  }, [center[0], center[1], zoom])
  return null
}
const MapControllerDynamic = dynamic(() => Promise.resolve(MapController), { ssr: false })

export default function LiveMap() {
  const { filters } = useFilters()
  const allPUs = getAllMockPUs()
  const [showPUs, setShowPUs]         = useState(true)
  const [showVehicles, setShowVehicles] = useState(true)
  const [showIncidents, setShowIncidents] = useState(false)
  const mounted = useRef(false)
  useEffect(() => { mounted.current = true }, [])

  const visiblePUs = useMemo(() => allPUs.filter(pu => {
    if (filters.selectedStateId && pu.stateId !== filters.selectedStateId) return false
    if (filters.selectedLgaId  && pu.lgaId  !== filters.selectedLgaId)  return false
    if (filters.selectedWardId && pu.wardId !== filters.selectedWardId) return false
    return true
  }), [allPUs, filters])

  const visibleVehicles = useMemo(() => MOCK_VEHICLES.filter(v =>
    !filters.selectedStateId || v.stateId === filters.selectedStateId
  ), [filters])

  const center: [number, number] = filters.selectedStateId
    ? (STATE_CENTERS[filters.selectedStateId] ?? NIGERIA)
    : NIGERIA
  const zoom = filters.selectedWardId ? 11 : filters.selectedLgaId ? 10 : filters.selectedStateId ? 7 : ZOOM_NATIONAL

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid var(--bg-border)' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>Live Operations Map</h2>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
            {visiblePUs.length} Polling Units · {visibleVehicles.length} Vehicles · Nigeria
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: 'PUs', icon: <MapPin size={11}/>, active: showPUs, toggle: () => setShowPUs(v => !v) },
            { label: 'Vehicles', icon: <Truck size={11}/>, active: showVehicles, toggle: () => setShowVehicles(v => !v) },
            { label: 'Incidents', icon: <AlertTriangle size={11}/>, active: showIncidents, toggle: () => setShowIncidents(v => !v) },
          ].map(({ label, icon, active, toggle }) => (
            <button key={label} onClick={toggle}
              className={`btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Map container — takes all remaining height */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {/* Leaflet CSS fix */}
        <style>{`
          .leaflet-container { background: #b8d4b8 !important; }
          .leaflet-tile { filter: none !important; }
          .leaflet-popup-content-wrapper { background:#fff!important; border-radius:10px!important; color:#1a202c!important; box-shadow:0 4px 20px rgba(0,0,0,0.15)!important; }
          .leaflet-popup-tip { background:#fff!important; }
          .marker-cluster { background:rgba(0,166,81,0.2)!important; }
          .marker-cluster div { background:rgba(0,166,81,0.7)!important; color:#fff!important; font-weight:700; }
        `}</style>

        <MapContainer
          center={NIGERIA}
          zoom={ZOOM_NATIONAL}
          style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
            maxZoom={18}
          />

          {/* Fly to selected location */}
          <MapControllerDynamic center={center} zoom={zoom} />

          {/* PU Markers */}
          {showPUs && mounted.current && (
            <MarkerClusterGroup chunkedLoading maxClusterRadius={40} showCoverageOnHover={false}>
              {visiblePUs.map(pu => {
                const icon = makeDot(statusColor(pu.status))
                if (!icon) return null
                return (
                  <Marker key={pu.puId} position={[pu.coordinates.latitude, pu.coordinates.longitude]} icon={icon}>
                    <Popup>
                      <div style={{ fontFamily: 'system-ui', minWidth: 200 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{pu.name}</div>
                        <div style={{ fontSize: 11, color: '#00a651', marginBottom: 8 }}>{pu.puCode}</div>
                        <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                          <div>Officer: <b>{pu.assignedOfficerName}</b></div>
                          <div>Registered: <b>{pu.registeredVoters.toLocaleString()}</b></div>
                          <div>Votes Cast: <b style={{ color: '#00a651' }}>{pu.totalVotesCast.toLocaleString()}</b></div>
                          <div>Status: <b style={{ color: statusColor(pu.status) }}>{pu.status}</b></div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MarkerClusterGroup>
          )}

          {/* Vehicle Markers */}
          {showVehicles && mounted.current && visibleVehicles.map(v => {
            const icon = makeVehicleIcon(vehicleColor(v.status))
            if (!icon) return null
            return (
              <Marker key={v.vehicleId} position={[v.currentCoordinates.latitude, v.currentCoordinates.longitude]} icon={icon}>
                <Popup>
                  <div style={{ fontFamily: 'system-ui', minWidth: 180 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{v.vehicleReg}</div>
                    <div style={{ fontSize: 11, color: vehicleColor(v.status), fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>{v.status.replace('_', ' ')}</div>
                    <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                      <div>Driver: <b>{v.driverName}</b></div>
                      <div>Speed: <b>{v.speedKph} km/h</b></div>
                      {v.isFlagged && <div style={{ color: '#ef4444', fontWeight: 700 }}>⚠ FLAGGED</div>}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {/* Legend */}
        <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 1000, background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 11, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <div style={{ fontWeight: 700, fontSize: 9, letterSpacing: '0.1em', color: '#4a5568', marginBottom: 6, textTransform: 'uppercase' }}>PU Status</div>
          {[['active','Active'],['voting','Voting'],['offline','Offline'],['flagged','Flagged'],['completed','Completed'],['pending','Pending']].map(([s, l]) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor(s) }} />
              <span style={{ color: '#4a5568' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
