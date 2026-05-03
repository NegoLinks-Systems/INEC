// src/components/warroom/WarRoom.tsx
// ─────────────────────────────────────────────────────────────────────────────
// MINI-INEC 2.0 — War Room Command Center (Module 8)
// Dedicated 1080p/4K large-screen display
// 4 quadrants: Data | Live Map | Media | AI Alerts
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  Shield, Activity, WifiOff, CheckCircle, Truck,
  Video, AlertTriangle, BrainCircuit, Users, ExternalLink
} from 'lucide-react'
import { NATIONAL_STATS, MOCK_INCIDENTS, MOCK_ALERTS, MOCK_VEHICLES, getAllMockPUs } from '@/firebase/mockData'
import { getSeverityColor, formatAlertTime } from '@/utils/anomalyDetector'
import Link from 'next/link'

// Dynamic map imports to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const MarkerClusterGroup = dynamic(() => import('react-leaflet-cluster'), { ssr: false })

// ─── Live Counters (Q1) ───────────────────────────────────────────────────────
function LiveCounter({
  label,
  value,
  color,
  icon: Icon,
  animate,
}: {
  label: string
  value: number
  color: string
  icon: React.FC<{ size?: number; color?: string }>
  animate?: boolean
}) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    // Count-up animation
    const duration = 1500
    const steps = 40
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + increment, value)
      setDisplayed(Math.round(current))
      if (current >= value) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  // Simulate live fluctuation
  const [live, setLive] = useState(value)
  useEffect(() => {
    if (!animate) return
    const interval = setInterval(() => {
      setLive((v) => v + Math.floor(Math.random() * 3))
    }, 4000)
    return () => clearInterval(interval)
  }, [animate])

  const displayValue = animate ? live : displayed

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px 8px',
      borderRight: '1px solid var(--bg-border)',
      gap: 8,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: `${color}08`,
        pointerEvents: 'none',
      }} />

      <Icon size={22} color={color} />
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 32,
        fontWeight: 700,
        color,
        lineHeight: 1,
        letterSpacing: '-0.03em',
      }}>
        {displayValue.toLocaleString()}
      </div>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}>
        {label}
      </div>
    </div>
  )
}

// ─── Q1: Data Quadrant ────────────────────────────────────────────────────────
function DataQuadrant() {
  const [tick, setTick] = useState(0)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t1 = setInterval(() => setTick((t) => t + 1), 3000)
    const t2 = setInterval(() => setNow(new Date()), 1000)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [])

  // Slightly increment votes on each tick to simulate real-time
  const totalVotes = NATIONAL_STATS.totalVotesCast + tick * 7

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-card)',
      border: '1px solid var(--bg-border)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Panel header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--bg-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-elevated)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={13} color="var(--green-inec)" />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            Live Data
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--green-inec)' }}>
          {now.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* Main counters */}
      <div style={{ display: 'flex', flex: 1 }}>
        <LiveCounter label="Votes Cast" value={totalVotes} color="var(--green-inec)" icon={CheckCircle} animate />
        <LiveCounter label="Active PUs" value={NATIONAL_STATS.activePUs} color="var(--status-voting)" icon={Activity} />
        <LiveCounter label="Offline PUs" value={NATIONAL_STATS.offlinePUs} color="var(--status-offline)" icon={WifiOff} />
      </div>

      {/* Secondary stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        borderTop: '1px solid var(--bg-border)',
        padding: '10px 0',
      }}>
        {[
          { label: 'PUs Done', value: NATIONAL_STATS.completedPUs.toLocaleString(), color: 'var(--status-completed)' },
          { label: 'Vehicles', value: `${NATIONAL_STATS.vehiclesInTransit.toLocaleString()} Moving`, color: 'var(--status-submitted)' },
          { label: 'Flagged', value: NATIONAL_STATS.flaggedPUs.toString(), color: 'var(--severity-critical)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center', padding: '4px 8px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* National stats footer */}
      <div style={{
        borderTop: '1px solid var(--bg-border)',
        padding: '8px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        background: 'var(--bg-elevated)',
        fontSize: 10,
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
      }}>
        <span>176,846 PUs NATIONWIDE</span>
        <span>774 LGAs · 36 STATES + FCT</span>
        <span>93.4M REGISTERED VOTERS</span>
      </div>
    </div>
  )
}

// ─── Q2: Live Map Quadrant ────────────────────────────────────────────────────
function MapQuadrant() {
  const allPUs = getAllMockPUs()
  const flaggedPUs = allPUs.filter((pu) => pu.isFlagged)

  function createIcon(color: string) {
    if (typeof window === 'undefined') return null
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet')
    return L.divIcon({
      className: '',
      html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid rgba(0,0,0,0.3);"></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    })
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-card)',
      border: '1px solid var(--bg-border)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--bg-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-elevated)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Truck size={13} color="var(--status-voting)" />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            Live Map · Fleet & Flagged PUs
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--status-voting)' }}>
            ● {MOCK_VEHICLES.filter(v => v.status === 'in_transit').length} vehicles moving
          </span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--severity-critical)' }}>
            ● {flaggedPUs.length} flagged PUs
          </span>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={[9.082, 8.6753]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Flagged PUs */}
          <MarkerClusterGroup chunkedLoading maxClusterRadius={40} showCoverageOnHover={false}>
            {flaggedPUs.map((pu) => {
              const icon = createIcon('#ef4444')
              if (!icon) return null
              return (
                <Marker
                  key={pu.puId}
                  position={[pu.coordinates.latitude, pu.coordinates.longitude]}
                  icon={icon}
                />
              )
            })}
          </MarkerClusterGroup>

          {/* Vehicles */}
          {MOCK_VEHICLES.map((v) => {
            const color = v.isFlagged ? '#ef4444' : v.status === 'in_transit' ? '#3b82f6' : '#10b981'
            const icon = createIcon(color)
            if (!icon) return null
            return (
              <Marker
                key={v.vehicleId}
                position={[v.currentCoordinates.latitude, v.currentCoordinates.longitude]}
                icon={icon}
              />
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}

// ─── Q3: Media Quadrant ───────────────────────────────────────────────────────
function MediaQuadrant() {
  const [activeIndex, setActiveIndex] = useState(0)
  const activePUs = getAllMockPUs().filter(p => p.status === 'active' || p.status === 'voting')

  // Auto-rotate through media feeds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % (activePUs.length + MOCK_INCIDENTS.length))
    }, 5000)
    return () => clearInterval(interval)
  }, [activePUs.length])

  const isIncident = activeIndex >= activePUs.length
  const currentIncident = isIncident ? MOCK_INCIDENTS[activeIndex - activePUs.length] : null
  const currentPU = !isIncident ? activePUs[activeIndex] : null

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-card)',
      border: '1px solid var(--bg-border)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--bg-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-elevated)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Video size={13} color="var(--severity-critical)" />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            Media Feeds & Incidents
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: Math.min(activePUs.length + MOCK_INCIDENTS.length, 6) }).map((_, i) => (
            <div
              key={i}
              onClick={() => setActiveIndex(i)}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: i === activeIndex ? 'var(--green-inec)' : 'var(--bg-border)',
                cursor: 'pointer',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Main media area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {currentPU && (
          <div style={{
            height: '100%',
            background: '#0a0e18',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: 20,
          }}>
            {/* Simulated video feed placeholder */}
            <div style={{
              width: '100%',
              maxWidth: 280,
              aspectRatio: '16/9',
              background: 'linear-gradient(135deg, #0f1520, #1a2235)',
              borderRadius: 8,
              border: '1px solid var(--bg-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Scanline effect */}
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,166,81,0.03) 2px, rgba(0,166,81,0.03) 4px)',
                pointerEvents: 'none',
              }} />
              <Users size={28} color="var(--text-muted)" strokeWidth={1} />
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                Agora Stream Active
              </div>
              {/* LIVE badge */}
              <div style={{
                position: 'absolute',
                top: 8,
                left: 8,
                background: 'rgba(239,68,68,0.9)',
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 3,
                letterSpacing: '0.1em',
              }}>
                ● LIVE
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{currentPU.assignedOfficerName}</div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--green-inec)', marginTop: 2 }}>{currentPU.puCode}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{currentPU.name}</div>
            </div>
          </div>
        )}

        {currentIncident && (
          <div style={{
            height: '100%',
            background: 'rgba(239,68,68,0.05)',
            display: 'flex',
            flexDirection: 'column',
            padding: 16,
            gap: 10,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: 'rgba(239,68,68,0.1)',
              borderRadius: 8,
              border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <AlertTriangle size={14} color={getSeverityColor(currentIncident.severity)} />
              <span style={{ fontWeight: 700, fontSize: 12, color: getSeverityColor(currentIncident.severity) }}>
                INCIDENT REPORT
              </span>
              <span className={`status-badge severity-${currentIncident.severity}`} style={{ marginLeft: 'auto', fontSize: 9 }}>
                {currentIncident.severity.toUpperCase()}
              </span>
            </div>

            <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{currentIncident.title}</div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>
              {currentIncident.description}
            </p>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', borderTop: '1px solid var(--bg-border)', paddingTop: 8 }}>
              {currentIncident.officerName} · {currentIncident.puId} · {formatAlertTime(currentIncident.reportedAt)}
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '8px 10px',
        borderTop: '1px solid var(--bg-border)',
        background: 'var(--bg-elevated)',
        overflowX: 'auto',
      }}>
        {activePUs.slice(0, 4).map((pu, i) => (
          <div
            key={pu.puId}
            onClick={() => setActiveIndex(i)}
            style={{
              flexShrink: 0,
              width: 52,
              height: 36,
              background: i === activeIndex ? 'var(--green-dim)' : 'var(--bg-card)',
              border: `1px solid ${i === activeIndex ? 'var(--green-inec)' : 'var(--bg-border)'}`,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 8,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
            }}
          >
            <Video size={10} />
          </div>
        ))}
        {MOCK_INCIDENTS.slice(0, 3).map((inc, i) => (
          <div
            key={inc.incidentId}
            onClick={() => setActiveIndex(activePUs.length + i)}
            style={{
              flexShrink: 0,
              width: 52,
              height: 36,
              background: activeIndex === activePUs.length + i ? 'rgba(239,68,68,0.15)' : 'var(--bg-card)',
              border: `1px solid ${activeIndex === activePUs.length + i ? '#ef4444' : 'var(--bg-border)'}`,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <AlertTriangle size={10} color={getSeverityColor(inc.severity)} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Q4: AI Alerts Ticker ─────────────────────────────────────────────────────
function AlertsTicker() {
  const combined = [...MOCK_ALERTS].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  // Duplicate for infinite scroll effect
  const doubled = [...combined, ...combined]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-card)',
      border: '1px solid var(--bg-border)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--bg-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-elevated)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BrainCircuit size={13} color="var(--green-inec)" />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            AI Alerts Feed
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="live-dot" />
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--green-inec)' }}>
            LIVE
          </span>
        </div>
      </div>

      {/* Scrolling ticker */}
      <div className="ticker-wrap" style={{ flex: 1, padding: '8px 0' }}>
        <div className="ticker-inner">
          {doubled.map((alert, i) => {
            const color = getSeverityColor(alert.severity)
            return (
              <div
                key={`${alert.alertId}-${i}`}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--bg-border)',
                  borderLeft: `3px solid ${color}`,
                  marginBottom: 2,
                  background: alert.isRead ? 'transparent' : `${color}08`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span className={`status-badge severity-${alert.severity}`} style={{ fontSize: 9 }}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {formatAlertTime(alert.createdAt)}
                  </span>
                  {!alert.isRead && (
                    <span style={{ marginLeft: 'auto', fontSize: 9, color, fontFamily: 'var(--font-mono)' }}>
                      ● NEW
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 3, color: 'var(--text-primary)' }}>
                  {alert.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {alert.message}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 14px',
        borderTop: '1px solid var(--bg-border)',
        background: 'var(--bg-elevated)',
        fontSize: 10,
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>{combined.filter((a) => !a.isRead).length} unread alerts</span>
        <span>Scan interval: 60s</span>
      </div>
    </div>
  )
}

// ─── War Room Page ────────────────────────────────────────────────────────────
export default function WarRoom() {
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: 'var(--bg-void)',
      padding: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      overflow: 'hidden',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: 'var(--bg-card)',
        border: '1px solid var(--bg-border)',
        borderRadius: 10,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30,
            height: 30,
            background: 'var(--green-inec)',
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--glow-green)',
          }}>
            <Shield size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em' }}>
              MINI-INEC 2.0 — WAR ROOM
            </div>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--green-inec)', letterSpacing: '0.1em' }}>
              NATIONAL COMMAND CENTER · REAL-TIME OPERATIONS
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Quick stats */}
          {[
            { label: 'STATES ACTIVE', value: '37', color: 'var(--green-inec)' },
            { label: 'LGAS COVERED', value: '774', color: 'var(--status-voting)' },
            { label: 'OFFICERS ONLINE', value: `${NATIONAL_STATS.activePUs.toLocaleString()}`, color: 'var(--status-submitted)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}

          <div style={{ height: 28, width: 1, background: 'var(--bg-border)' }} />

          <Link
            href="/inec"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              border: '1px solid var(--bg-border)',
              padding: '4px 10px',
              borderRadius: 6,
            }}
          >
            <ExternalLink size={11} />
            Dashboard
          </Link>
        </div>
      </div>

      {/* 4-Quadrant Grid */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 10,
        minHeight: 0,
      }}>
        <DataQuadrant />
        <MapQuadrant />
        <MediaQuadrant />
        <AlertsTicker />
      </div>
    </div>
  )
}
