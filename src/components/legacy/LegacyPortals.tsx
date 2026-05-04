// src/components/legacy/LegacyPortals.tsx
'use client'

import React, { useState } from 'react'
import { Globe, ExternalLink, RefreshCw, Lock, AlertCircle, Chrome } from 'lucide-react'

interface PortalConfig {
  id: string
  name: string
  description: string
  url: string
  icon: string
  category: 'results' | 'registration' | 'logistics' | 'official'
  status: 'active' | 'maintenance' | 'iframe_blocked'
}

const LEGACY_PORTALS: PortalConfig[] = [
  {
    id: 'irev',
    name: 'IREV Portal',
    description: 'INEC Result Viewing Portal — official election results viewer',
    url: 'https://irev.inec.gov.ng',
    icon: '🗳️',
    category: 'results',
    status: 'iframe_blocked',
  },
  {
    id: 'inec-main',
    name: 'INEC Official Website',
    description: 'Main INEC institutional website, press releases and announcements',
    url: 'https://www.inecnigeria.org',
    icon: '🏛️',
    category: 'official',
    status: 'iframe_blocked',
  },
  {
    id: 'voter-enrollment',
    name: 'Voter Enrolment Portal',
    description: 'Online voter registration and enrolment system',
    url: 'https://revamp.inecnigeria.org',
    icon: '👤',
    category: 'registration',
    status: 'iframe_blocked',
  },
  {
    id: 'pu-finder',
    name: 'Polling Unit Finder',
    description: 'Locate any polling unit across Nigeria using voter details',
    url: 'https://puff.inec.gov.ng',
    icon: '📍',
    category: 'registration',
    status: 'iframe_blocked',
  },
  {
    id: 'bvas-portal',
    name: 'BVAS Management Portal',
    description: 'Internal BVAS device management and diagnostic dashboard',
    url: 'https://bvas.inec.gov.ng',
    icon: '📱',
    category: 'logistics',
    status: 'maintenance',
  },
  {
    id: 'electoral-calendar',
    name: 'Electoral Calendar',
    description: 'Official timetable and schedule of electoral activities',
    url: 'https://www.inecnigeria.org/electoral-timetable-and-schedule-of-activities',
    icon: '📅',
    category: 'official',
    status: 'iframe_blocked',
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  results:      'var(--green-inec)',
  registration: 'var(--status-voting)',
  logistics:    'var(--status-submitted)',
  official:     'var(--status-collating)',
}

function PortalCard({ portal, isActive, onClick }: {
  portal: PortalConfig
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', width: '100%', textAlign: 'left',
        background: isActive ? 'var(--bg-elevated)' : 'transparent',
        border: `1px solid ${isActive ? 'var(--green-dim)' : 'transparent'}`,
        borderRadius: 8, cursor: 'pointer',
        transition: 'all var(--transition-fast)',
      }}
    >
      <span style={{ fontSize: 20 }}>{portal.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {portal.name}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {portal.description}
        </div>
      </div>
      {portal.status === 'maintenance' && (
        <span style={{ fontSize: 9, background: 'rgba(245,158,11,0.15)', color: 'var(--status-offline)', padding: '2px 6px', borderRadius: 3, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
          DOWN
        </span>
      )}
    </button>
  )
}

function PortalViewer({ portal }: { portal: PortalConfig }) {
  const [showEmbed, setShowEmbed] = useState(false)
  const [embedKey, setEmbedKey] = useState(0)

  if (portal.status === 'maintenance') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 }}>
        <AlertCircle size={48} strokeWidth={1} color="var(--status-offline)" />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--status-offline)' }}>
          Portal Under Maintenance
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 360, lineHeight: 1.7 }}>
          {portal.name} is currently unavailable. Please try again later.
        </div>
        <a href={portal.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ExternalLink size={12} /> Try Direct Link
        </a>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* URL bar */}
      <div style={{ padding: '8px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--bg-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Lock size={11} color="var(--status-active)" />
        <span style={{ flex: 1, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {portal.url}
        </span>
        <button onClick={() => { setShowEmbed(false); setEmbedKey(k => k + 1) }} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <RefreshCw size={11} /> Retry
        </button>
        <a href={portal.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ExternalLink size={11} /> Open
        </a>
      </div>

      {/* Embed attempt / fallback */}
      <div style={{ flex: 1, position: 'relative', background: 'var(--bg-base)' }}>
        {!showEmbed ? (
          // Always show the informational panel first
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40, textAlign: 'center' }}>
            <span style={{ fontSize: 48 }}>{portal.icon}</span>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
                {portal.name}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400, lineHeight: 1.7, marginBottom: 20 }}>
                {portal.description}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 440, lineHeight: 1.7, marginBottom: 24 }}>
                Most Nigerian government websites block embedding for security reasons (X-Frame-Options).
                Use the <strong style={{ color: 'var(--text-secondary)' }}>Open</strong> button to access in a new tab, or try embedding below.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowEmbed(true)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Chrome size={14} /> Try Embed
              </button>
              <a href={portal.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ExternalLink size={14} /> Open in New Tab
              </a>
            </div>
          </div>
        ) : (
          <>
            <iframe
              key={embedKey}
              src={portal.url}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={portal.name}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
              onError={() => setShowEmbed(false)}
            />
            {/* Overlay with open button in case iframe blocked */}
            <div style={{ position: 'absolute', bottom: 16, right: 16 }}>
              <a href={portal.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, opacity: 0.9 }}>
                <ExternalLink size={12} /> Open Full Screen
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function LegacyPortals() {
  const [activePortalId, setActivePortalId] = useState(LEGACY_PORTALS[0].id)
  const activePortal = LEGACY_PORTALS.find(p => p.id === activePortalId)!

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Globe size={18} color="var(--green-inec)" />
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>Legacy Portals</h2>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
            Unified access to all INEC platforms · {LEGACY_PORTALS.length} portals integrated
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
          <AlertCircle size={12} />
          Government sites may require opening in new tab
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 260, borderRight: '1px solid var(--bg-border)', padding: '12px 8px', overflowY: 'auto', flexShrink: 0 }}>
          {(['results', 'registration', 'logistics', 'official'] as const).map(cat => {
            const portals = LEGACY_PORTALS.filter(p => p.category === cat)
            if (!portals.length) return null
            return (
              <div key={cat} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: CATEGORY_COLORS[cat], padding: '4px 8px', marginBottom: 4 }}>
                  {cat}
                </div>
                {portals.map(portal => (
                  <PortalCard key={portal.id} portal={portal} isActive={portal.id === activePortalId} onClick={() => setActivePortalId(portal.id)} />
                ))}
              </div>
            )
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <PortalViewer portal={activePortal} />
        </div>
      </div>
    </div>
  )
}
