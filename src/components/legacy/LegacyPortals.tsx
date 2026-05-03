// src/components/legacy/LegacyPortals.tsx
// ─────────────────────────────────────────────────────────────────────────────
// INEC 2.0 — Legacy System Harmonization (Module 6)
// Embeds existing INEC platforms via iframe or API wrapper
// Creates a unified workspace from multiple legacy portals
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import React, { useState } from 'react'
import { Globe, ExternalLink, RefreshCw, Maximize2, Lock, AlertCircle } from 'lucide-react'

// ─── Legacy Portal Definitions ────────────────────────────────────────────────
interface PortalConfig {
  id: string
  name: string
  description: string
  url: string
  icon: string
  category: 'results' | 'registration' | 'logistics' | 'official'
  requiresVPN: boolean
  status: 'active' | 'maintenance' | 'demo'
}

const LEGACY_PORTALS: PortalConfig[] = [
  {
    id: 'irev',
    name: 'IREV Portal',
    description: "INEC Result Viewing Portal — official election results viewer",
    url: 'https://irev.inec.gov.ng',
    icon: '🗳️',
    category: 'results',
    requiresVPN: false,
    status: 'active',
  },
  {
    id: 'ivs',
    name: 'IVS — Voter Verification',
    description: "Independent Voter Self-Service portal for voter status verification",
    url: 'https://voters.inec.gov.ng',
    icon: '👤',
    category: 'registration',
    requiresVPN: false,
    status: 'active',
  },
  {
    id: 'inec-main',
    name: 'INEC Official Website',
    description: 'Main INEC institutional website and press releases',
    url: 'https://www.inecnigeria.org',
    icon: '🏛️',
    category: 'official',
    requiresVPN: false,
    status: 'active',
  },
  {
    id: 'transferability',
    name: 'Polling Unit Finder',
    description: 'PU locator and voter transfer management tool',
    url: 'https://puff.inec.gov.ng',
    icon: '📍',
    category: 'registration',
    requiresVPN: false,
    status: 'active',
  },
  {
    id: 'bvas-portal',
    name: 'BVAS Management Portal',
    description: 'Internal BVAS device management and diagnostic dashboard',
    url: 'https://bvas.inec.gov.ng',
    icon: '📱',
    category: 'logistics',
    requiresVPN: true,
    status: 'maintenance',
  },
  {
    id: 'electoral-calendar',
    name: 'Electoral Calendar',
    description: 'Official timetable and schedule of electoral activities',
    url: 'https://inecnigeria.org/electoral-timetable',
    icon: '📅',
    category: 'official',
    requiresVPN: false,
    status: 'active',
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  results: 'var(--green-inec)',
  registration: 'var(--status-voting)',
  logistics: 'var(--status-submitted)',
  official: 'var(--status-collating)',
}

// ─── Portal Tab Button ────────────────────────────────────────────────────────
function PortalTab({
  portal,
  isActive,
  onClick,
}: {
  portal: PortalConfig
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        background: isActive ? 'var(--bg-elevated)' : 'transparent',
        border: `1px solid ${isActive ? 'var(--bg-border)' : 'transparent'}`,
        borderBottom: isActive ? '1px solid var(--bg-elevated)' : '1px solid var(--bg-border)',
        borderRadius: isActive ? '8px 8px 0 0' : 8,
        cursor: 'pointer',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontSize: 12,
        fontWeight: isActive ? 600 : 400,
        whiteSpace: 'nowrap',
        transition: 'all var(--transition-fast)',
      }}
    >
      <span>{portal.icon}</span>
      <span>{portal.name}</span>
      {portal.status === 'maintenance' && (
        <span style={{ fontSize: 9, background: 'rgba(245,158,11,0.15)', color: 'var(--status-offline)', padding: '1px 4px', borderRadius: 3, fontFamily: 'var(--font-mono)' }}>
          DOWN
        </span>
      )}
      {portal.requiresVPN && (
        <Lock size={10} color="var(--text-muted)" />
      )}
    </button>
  )
}

// ─── Iframe Viewer ────────────────────────────────────────────────────────────
function IframeViewer({ portal }: { portal: PortalConfig }) {
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [key, setKey] = useState(0)

  const refresh = () => {
    setLoading(true)
    setFailed(false)
    setKey((k) => k + 1)
  }

  if (portal.status === 'maintenance') {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        background: 'var(--bg-elevated)',
        color: 'var(--text-muted)',
      }}>
        <AlertCircle size={40} strokeWidth={1} color="var(--status-offline)" />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--status-offline)' }}>
          Portal Under Maintenance
        </div>
        <div style={{ fontSize: 12, maxWidth: 280, textAlign: 'center', lineHeight: 1.6 }}>
          {portal.name} is currently unavailable for scheduled maintenance. It will be back online shortly.
        </div>
        <a
          href={portal.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
        >
          <ExternalLink size={12} />
          Open in New Tab
        </a>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, position: 'relative', background: '#000' }}>
      {/* Loading overlay */}
      {loading && !failed && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--bg-elevated)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          zIndex: 5,
        }}>
          <div style={{
            width: 36,
            height: 36,
            border: '2px solid var(--bg-border)',
            borderTop: '2px solid var(--green-inec)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Loading {portal.name}...
          </div>
        </div>
      )}

      {/* X-Frame-Options note (most gov sites block iframes) */}
      {failed && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--bg-elevated)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: 20,
        }}>
          <Lock size={40} strokeWidth={1} color="var(--text-muted)" />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
            Embedded Access Restricted
          </div>
          <div style={{ fontSize: 12, maxWidth: 360, textAlign: 'center', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            <strong>{portal.url}</strong> has set{' '}
            <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-card)', padding: '1px 5px', borderRadius: 3 }}>
              X-Frame-Options: SAMEORIGIN
            </code>
            {' '}which prevents iframe embedding.
            <br /><br />
            In production, NegoLinks would resolve this via:
            <br />
            (1) An API wrapper proxy that calls the portal&apos;s backend directly,
            <br />
            (2) A reverse-proxy approach for same-origin compliance, or
            <br />
            (3) Direct INEC cooperation to whitelist the dashboard domain.
          </div>
          <a
            href={portal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          >
            <ExternalLink size={12} />
            Open {portal.name} Directly
          </a>
        </div>
      )}

      <iframe
        key={key}
        src={portal.url}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: failed ? 'none' : 'block',
        }}
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setFailed(true) }}
        title={portal.name}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  )
}

// ─── Legacy Portals Page ──────────────────────────────────────────────────────
export default function LegacyPortals() {
  const [activePortalId, setActivePortalId] = useState(LEGACY_PORTALS[0].id)
  const activePortal = LEGACY_PORTALS.find((p) => p.id === activePortalId)!

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--bg-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Globe size={18} color="var(--green-inec)" />
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>
              Legacy Portals
            </h2>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
              Unified access to all INEC platforms in one workspace
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={activePortal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ExternalLink size={12} />
            Open Full Screen
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '8px 20px 0',
        borderBottom: '1px solid var(--bg-border)',
        overflowX: 'auto',
      }}>
        {LEGACY_PORTALS.map((portal) => (
          <PortalTab
            key={portal.id}
            portal={portal}
            isActive={portal.id === activePortalId}
            onClick={() => setActivePortalId(portal.id)}
          />
        ))}
      </div>

      {/* Portal info bar */}
      <div style={{
        padding: '8px 20px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--bg-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <span style={{
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          color: CATEGORY_COLORS[activePortal.category],
          background: `${CATEGORY_COLORS[activePortal.category]}18`,
          border: `1px solid ${CATEGORY_COLORS[activePortal.category]}30`,
          padding: '2px 6px',
          borderRadius: 3,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {activePortal.category}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
          {activePortal.url}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-secondary)' }}>
          {activePortal.description}
        </span>
        {activePortal.requiresVPN && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
            color: 'var(--status-offline)',
            fontFamily: 'var(--font-mono)',
          }}>
            <Lock size={10} />
            VPN Required
          </span>
        )}
      </div>

      {/* iframe content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <IframeViewer key={activePortalId} portal={activePortal} />
      </div>
    </div>
  )
}
