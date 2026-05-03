// src/components/fleet/FleetTracker.tsx
// ─────────────────────────────────────────────────────────────────────────────
// MINI-INEC 2.0 — Fleet Tracker (Module 3)
// Real-time GPS/RFID tracking of dispatch vehicles
// Simulates continuous Firestore fleet_locations updates
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Truck, MapPin, AlertTriangle, CheckCircle, Clock, Navigation, Package, Wifi } from 'lucide-react'
import { MOCK_VEHICLES, MockVehicle } from '@/firebase/mockData'

// ─── Simulate live vehicle movement ──────────────────────────────────────────
function useSimulatedFleet() {
  const [vehicles, setVehicles] = useState<MockVehicle[]>(MOCK_VEHICLES)

  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.status === 'in_transit' || v.status === 'dispatched') {
            // Randomly nudge coordinates to simulate movement
            const delta = 0.0008
            return {
              ...v,
              currentCoordinates: {
                latitude: v.currentCoordinates.latitude + (Math.random() - 0.5) * delta,
                longitude: v.currentCoordinates.longitude + (Math.random() - 0.5) * delta,
              },
              speedKph: 35 + Math.floor(Math.random() * 40),
              heading: (v.heading + Math.floor(Math.random() * 20) - 10 + 360) % 360,
              lastUpdated: new Date(),
            }
          }
          return v
        })
      )
    }, 3000) // Update every 3 seconds (Firestore would push in real deployment)

    return () => clearInterval(interval)
  }, [])

  return vehicles
}

// ─── Status Helpers ───────────────────────────────────────────────────────────
function getStatusIcon(status: string) {
  switch (status) {
    case 'in_transit': return <Navigation size={14} color="var(--status-voting)" />
    case 'delivered':  return <CheckCircle size={14} color="var(--status-completed)" />
    case 'flagged':    return <AlertTriangle size={14} color="var(--severity-critical)" />
    case 'dispatched': return <Truck size={14} color="var(--status-collating)" />
    case 'idle':       return <Clock size={14} color="var(--status-pending)" />
    default:           return <Clock size={14} color="var(--text-muted)" />
  }
}

function getStatusBg(status: string): string {
  switch (status) {
    case 'in_transit': return 'var(--status-voting)'
    case 'delivered':  return 'var(--status-completed)'
    case 'flagged':    return 'var(--severity-critical)'
    case 'dispatched': return 'var(--status-collating)'
    default:           return 'var(--text-muted)'
  }
}

// ─── Compass Rose ─────────────────────────────────────────────────────────────
function CompassRose({ heading }: { heading: number }) {
  return (
    <div style={{ position: 'relative', width: 40, height: 40 }}>
      <svg viewBox="0 0 40 40" width="40" height="40">
        <circle cx="20" cy="20" r="18" fill="var(--bg-elevated)" stroke="var(--bg-border)" strokeWidth="1" />
        {/* Heading arrow */}
        <g transform={`rotate(${heading}, 20, 20)`}>
          <polygon points="20,5 17,20 20,17 23,20" fill="var(--severity-critical)" />
          <polygon points="20,35 17,20 20,23 23,20" fill="var(--text-muted)" />
        </g>
        <circle cx="20" cy="20" r="2.5" fill="var(--bg-card)" />
      </svg>
    </div>
  )
}

// ─── Vehicle Card ─────────────────────────────────────────────────────────────
function VehicleCard({
  vehicle,
  isSelected,
  onClick,
}: {
  vehicle: MockVehicle
  isSelected: boolean
  onClick: () => void
}) {
  const statusColor = getStatusBg(vehicle.status)
  const minutesSinceUpdate = Math.round((Date.now() - vehicle.lastUpdated.getTime()) / 60000)

  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        border: `1px solid ${isSelected ? statusColor : 'var(--bg-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left color bar */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        background: statusColor,
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {getStatusIcon(vehicle.status)}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            {vehicle.vehicleReg}
          </span>
        </div>
        {vehicle.isFlagged && (
          <span style={{
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            background: 'rgba(239,68,68,0.15)',
            color: 'var(--severity-critical)',
            border: '1px solid rgba(239,68,68,0.3)',
            padding: '2px 6px',
            borderRadius: 4,
            letterSpacing: '0.05em',
          }}>FLAGGED</span>
        )}
      </div>

      {/* Driver */}
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
        Driver: <span style={{ color: 'var(--text-primary)' }}>{vehicle.driverName}</span>
      </div>

      {/* Live metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 6, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
            Speed
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: vehicle.speedKph > 0 ? 'var(--status-voting)' : 'var(--text-muted)' }}>
            {vehicle.speedKph}
            <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 2 }}>km/h</span>
          </div>
        </div>

        <div style={{ background: 'var(--bg-elevated)', borderRadius: 6, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CompassRose heading={vehicle.heading} />
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
              Heading
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)' }}>
              {vehicle.heading}°
            </div>
          </div>
        </div>
      </div>

      {/* GPS Coordinates */}
      <div style={{
        background: 'var(--bg-elevated)',
        borderRadius: 6,
        padding: '8px 10px',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <MapPin size={10} color="var(--green-inec)" />
        {vehicle.currentCoordinates.latitude.toFixed(4)}, {vehicle.currentCoordinates.longitude.toFixed(4)}
        <span style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          color: minutesSinceUpdate < 1 ? 'var(--green-inec)' : 'var(--status-offline)',
        }}>
          <Wifi size={10} />
          {minutesSinceUpdate < 1 ? 'live' : `${minutesSinceUpdate}m ago`}
        </span>
      </div>

      {/* Assigned wards */}
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
        <Package size={10} style={{ display: 'inline', marginRight: 4 }} />
        {vehicle.assignedWards.length} ward{vehicle.assignedWards.length !== 1 ? 's' : ''} assigned
        · {vehicle.stateId.charAt(0).toUpperCase() + vehicle.stateId.slice(1)}
      </div>
    </div>
  )
}

// ─── Fleet Summary ────────────────────────────────────────────────────────────
function FleetSummary({ vehicles }: { vehicles: MockVehicle[] }) {
  const counts = vehicles.reduce(
    (acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const items = [
    { label: 'In Transit', key: 'in_transit', color: 'var(--status-voting)', icon: Navigation },
    { label: 'Delivered', key: 'delivered', color: 'var(--status-completed)', icon: CheckCircle },
    { label: 'Dispatched', key: 'dispatched', color: 'var(--status-collating)', icon: Truck },
    { label: 'Flagged', key: 'flagged', color: 'var(--severity-critical)', icon: AlertTriangle },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
      {items.map(({ label, key, color, icon: Icon }) => (
        <div key={key} className="stat-card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <Icon size={20} color={color} />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color }}>
            {counts[key] || 0}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Fleet Tracker Page ───────────────────────────────────────────────────────
export default function FleetTracker() {
  const vehicles = useSimulatedFleet()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>
          Fleet Tracker
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
          Real-time GPS + RFID tracking · Updates every 30s via Firestore
        </p>
      </div>

      <FleetSummary vehicles={vehicles} />

      {/* Vehicle Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.vehicleId}
            vehicle={vehicle}
            isSelected={selectedId === vehicle.vehicleId}
            onClick={() => setSelectedId(vehicle.vehicleId === selectedId ? null : vehicle.vehicleId)}
          />
        ))}
      </div>

      {/* Live indicator */}
      <div style={{
        marginTop: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 11,
        color: 'var(--text-muted)',
      }}>
        <div className="live-dot" />
        <span>Positions updating every 3 seconds (30s in production via Firestore real-time listeners)</span>
      </div>
    </div>
  )
}
