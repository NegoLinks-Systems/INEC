// src/components/dashboard/DashboardLayout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// MINI-INEC 2.0 — Main Admin Dashboard Layout
// Implements cascading State → LGA → Ward → PU filter hierarchy
// Uses Context API + useReducer for state management
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import React, { createContext, useContext, useReducer, useCallback, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Map, Truck, Video, AlertTriangle,
  Globe, BrainCircuit, Shield, ChevronDown, Bell,
  Settings, LogOut, Menu, X, Activity, Users
} from 'lucide-react'
import { MOCK_STATES, NATIONAL_STATS, MockState, MockLGA, MockWard } from '@/firebase/mockData'

// ─── Filter State & Reducer ───────────────────────────────────────────────────
export interface FilterState {
  selectedStateId: string | null
  selectedLgaId: string | null
  selectedWardId: string | null
  selectedPUId: string | null
  // Derived data (avoid recomputing)
  availableLGAs: MockLGA[]
  availableWards: MockWard[]
}

type FilterAction =
  | { type: 'SELECT_STATE'; stateId: string | null }
  | { type: 'SELECT_LGA'; lgaId: string | null }
  | { type: 'SELECT_WARD'; wardId: string | null }
  | { type: 'SELECT_PU'; puId: string | null }
  | { type: 'RESET' }

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SELECT_STATE': {
      if (!action.stateId) {
        return {
          selectedStateId: null,
          selectedLgaId: null,
          selectedWardId: null,
          selectedPUId: null,
          availableLGAs: [],
          availableWards: [],
        }
      }
      const selectedState = MOCK_STATES.find((s) => s.stateId === action.stateId)
      return {
        ...state,
        selectedStateId: action.stateId,
        selectedLgaId: null,
        selectedWardId: null,
        selectedPUId: null,
        availableLGAs: selectedState?.lgas ?? [],
        availableWards: [],
      }
    }
    case 'SELECT_LGA': {
      if (!action.lgaId) {
        return {
          ...state,
          selectedLgaId: null,
          selectedWardId: null,
          selectedPUId: null,
          availableWards: [],
        }
      }
      const selectedLga = state.availableLGAs.find((l) => l.lgaId === action.lgaId)
      return {
        ...state,
        selectedLgaId: action.lgaId,
        selectedWardId: null,
        selectedPUId: null,
        availableWards: selectedLga?.wards ?? [],
      }
    }
    case 'SELECT_WARD': {
      return {
        ...state,
        selectedWardId: action.wardId,
        selectedPUId: null,
      }
    }
    case 'SELECT_PU': {
      return { ...state, selectedPUId: action.puId }
    }
    case 'RESET': {
      return {
        selectedStateId: null,
        selectedLgaId: null,
        selectedWardId: null,
        selectedPUId: null,
        availableLGAs: [],
        availableWards: [],
      }
    }
    default:
      return state
  }
}

const initialFilterState: FilterState = {
  selectedStateId: null,
  selectedLgaId: null,
  selectedWardId: null,
  selectedPUId: null,
  availableLGAs: [],
  availableWards: [],
}

// ─── Filter Context ───────────────────────────────────────────────────────────
interface FilterContextValue {
  filters: FilterState
  dispatch: React.Dispatch<FilterAction>
  selectedState: MockState | null
  selectedLGA: MockLGA | null
  selectedWard: MockWard | null
}

export const FilterContext = createContext<FilterContextValue>({
  filters: initialFilterState,
  dispatch: () => {},
  selectedState: null,
  selectedLGA: null,
  selectedWard: null,
})

export function useFilters() {
  return useContext(FilterContext)
}

// ─── Navigation Items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: '/inec', label: 'Overview', icon: LayoutDashboard },
  { href: '/inec/map', label: 'Live Map', icon: Map },
  { href: '/inec/fleet', label: 'Fleet Tracker', icon: Truck },
  { href: '/inec/video', label: 'Live Video', icon: Video },
  { href: '/inec/incidents', label: 'Incidents', icon: AlertTriangle },
  { href: '/inec/legacy', label: 'Legacy Portals', icon: Globe },
  { href: '/inec/ai-alerts', label: 'AI Intelligence', icon: BrainCircuit },
  { href: '/inec/war-room', label: 'War Room', icon: Shield, special: true },
]

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname()

  return (
    <aside
      className="sidebar"
      style={{
        gridRow: '1 / -1',
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--bg-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform var(--transition-med)',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--bg-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'var(--green-inec)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--glow-green)',
          flexShrink: 0,
        }}>
          <Shield size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            MINI-INEC
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green-inec)', letterSpacing: '0.1em' }}>
            2.0 COMMAND
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 24px',
                margin: item.special ? '8px 12px 0' : '0',
                borderRadius: item.special ? 8 : 0,
                color: isActive ? 'var(--green-inec)' : item.special ? '#fff' : 'var(--text-secondary)',
                background: isActive
                  ? 'rgba(0,166,81,0.08)'
                  : item.special
                  ? 'var(--green-inec)'
                  : 'transparent',
                borderLeft: isActive && !item.special ? '2px solid var(--green-inec)' : '2px solid transparent',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                transition: 'all var(--transition-fast)',
              }}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 1.5} />
              <span>{item.label}</span>
              {item.special && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(255,255,255,0.2)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  letterSpacing: '0.05em',
                }}>LIVE</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom user info */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid var(--bg-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--green-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Users size={14} color="var(--green-inec)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', truncate: 'ellipsis' }}>
            Super Admin
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            INEC HQ • Abuja
          </div>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}

// ─── Cascading Filter Bar ─────────────────────────────────────────────────────
function FilterBar() {
  const { filters, dispatch } = useFilters()

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 20px',
      flex: 1,
    }}>
      {/* State */}
      <div style={{ position: 'relative' }}>
        <select
          className="select"
          style={{ width: 160, paddingRight: 28 }}
          value={filters.selectedStateId || ''}
          onChange={(e) => dispatch({ type: 'SELECT_STATE', stateId: e.target.value || null })}
        >
          <option value="">All States (36+FCT)</option>
          {MOCK_STATES.map((s) => (
            <option key={s.stateId} value={s.stateId}>{s.name}</option>
          ))}
        </select>
        <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
      </div>

      {/* Arrow */}
      {filters.selectedStateId && (
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>›</span>
      )}

      {/* LGA */}
      {filters.selectedStateId && (
        <div style={{ position: 'relative' }}>
          <select
            className="select"
            style={{ width: 180 }}
            value={filters.selectedLgaId || ''}
            onChange={(e) => dispatch({ type: 'SELECT_LGA', lgaId: e.target.value || null })}
          >
            <option value="">All LGAs</option>
            {filters.availableLGAs.map((l) => (
              <option key={l.lgaId} value={l.lgaId}>{l.name}</option>
            ))}
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>
      )}

      {/* Arrow */}
      {filters.selectedLgaId && (
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>›</span>
      )}

      {/* Ward */}
      {filters.selectedLgaId && (
        <div style={{ position: 'relative' }}>
          <select
            className="select"
            style={{ width: 160 }}
            value={filters.selectedWardId || ''}
            onChange={(e) => dispatch({ type: 'SELECT_WARD', wardId: e.target.value || null })}
          >
            <option value="">All Wards</option>
            {filters.availableWards.map((w) => (
              <option key={w.wardId} value={w.wardId}>{w.name}</option>
            ))}
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>
      )}

      {/* Arrow */}
      {filters.selectedWardId && (
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>›</span>
      )}

      {/* PU */}
      {filters.selectedWardId && (() => {
        const ward = filters.availableWards.find((w) => w.wardId === filters.selectedWardId)
        return (
          <div style={{ position: 'relative' }}>
            <select
              className="select"
              style={{ width: 200 }}
              value={filters.selectedPUId || ''}
              onChange={(e) => dispatch({ type: 'SELECT_PU', puId: e.target.value || null })}
            >
              <option value="">All Polling Units</option>
              {ward?.pollingUnits.map((pu) => (
                <option key={pu.puId} value={pu.puId}>{pu.puCode} — {pu.name}</option>
              ))}
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          </div>
        )
      })()}

      {/* Reset */}
      {filters.selectedStateId && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => dispatch({ type: 'RESET' })}
        >
          Reset
        </button>
      )}
    </div>
  )
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function TopBar({
  onMenuToggle,
  alertCount,
}: {
  onMenuToggle: () => void
  alertCount: number
}) {
  const [now, setNow] = React.useState(new Date())

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header style={{
      gridColumn: '2',
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--bg-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 12,
    }}>
      <button
        className="btn btn-ghost btn-sm"
        onClick={onMenuToggle}
        style={{ padding: '6px' }}
      >
        <Menu size={16} />
      </button>

      <FilterBar />

      {/* Live clock */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--text-secondary)',
        borderLeft: '1px solid var(--bg-border)',
        paddingLeft: 16,
        marginLeft: 8,
        whiteSpace: 'nowrap',
      }}>
        {now.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>

      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div className="live-dot" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green-inec)', letterSpacing: '0.1em' }}>
          LIVE
        </span>
      </div>

      {/* Alerts */}
      <div style={{ position: 'relative' }}>
        <button className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
          <Bell size={16} />
        </button>
        {alertCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'var(--severity-critical)',
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
          }}>
            {alertCount > 9 ? '9+' : alertCount}
          </span>
        )}
      </div>

      <button className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
        <Settings size={16} />
      </button>
    </header>
  )
}

// ─── Main Dashboard Layout ────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [filters, dispatch] = useReducer(filterReducer, initialFilterState)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const selectedState = MOCK_STATES.find((s) => s.stateId === filters.selectedStateId) ?? null
  const selectedLGA = filters.availableLGAs.find((l) => l.lgaId === filters.selectedLgaId) ?? null
  const selectedWard = filters.availableWards.find((w) => w.wardId === filters.selectedWardId) ?? null

  return (
    <FilterContext.Provider value={{ filters, dispatch, selectedState, selectedLGA, selectedWard }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: sidebarOpen ? '260px 1fr' : '0px 1fr',
          gridTemplateRows: '64px 1fr',
          height: '100vh',
          overflow: 'hidden',
          transition: 'grid-template-columns var(--transition-med)',
        }}
      >
        <Sidebar isOpen={sidebarOpen} />
        <TopBar
          onMenuToggle={() => setSidebarOpen((v) => !v)}
          alertCount={3}
        />
        <main style={{
          gridColumn: 2,
          overflow: 'hidden',
          background: 'var(--bg-base)',
        }}>
          {children}
        </main>
      </div>
    </FilterContext.Provider>
  )
}
