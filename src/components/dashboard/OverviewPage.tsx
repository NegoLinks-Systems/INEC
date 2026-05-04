// src/components/dashboard/OverviewPage.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { useFilters } from './DashboardLayout'
import { LucideProps } from 'lucide-react'
import {
  Activity, Wifi, WifiOff, CheckCircle, Clock,
  AlertTriangle, Truck, BarChart3, RefreshCw, Flag
} from 'lucide-react'
import { MOCK_STATES, NATIONAL_STATS, getAllMockPUs, MockPU } from '@/firebase/mockData'
import { PUStatus } from '@/firebase/schema'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color, sublabel,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  color: string
  sublabel?: string
}) {
  return (
    <div className="stat-card animate-in" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.6 }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
          <div className="stat-label">{label}</div>
          {sublabel && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>{sublabel}</div>}
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color={color} />
        </div>
      </div>
    </div>
  )
}

function PUStatusBadge({ status }: { status: PUStatus }) {
  return <span className={`status-badge status-${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ background: 'var(--bg-elevated)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
    </div>
  )
}

function StateSummaryRow({ state }: { state: typeof MOCK_STATES[0] }) {
  const totalPUs = state.stats.activePUs + state.stats.offlinePUs + state.stats.completedPUs
  const progressPct = totalPUs > 0 ? ((state.stats.completedPUs / totalPUs) * 100).toFixed(0) : '0'
  return (
    <tr>
      <td>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{state.name}</div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{state.code}</div>
      </td>
      <td><span style={{ color: 'var(--status-active)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{state.stats.activePUs.toLocaleString()}</span></td>
      <td><span style={{ color: 'var(--status-offline)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{state.stats.offlinePUs.toLocaleString()}</span></td>
      <td><span style={{ color: 'var(--status-completed)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{state.stats.completedPUs.toLocaleString()}</span></td>
      <td><span style={{ color: 'var(--status-flagged)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{state.stats.flaggedPUs}</span></td>
      <td>
        <div style={{ minWidth: 80 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{progressPct}%</span>
          </div>
          <ProgressBar value={state.stats.completedPUs} max={totalPUs} color="var(--status-completed)" />
        </div>
      </td>
      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{state.stats.totalVotesCast.toLocaleString()}</span></td>
    </tr>
  )
}

function PUTable({ pus }: { pus: MockPU[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PUStatus | 'all'>('all')
  const filtered = useMemo(() => {
    return pus.filter((pu) => {
      const matchSearch = !search || pu.puCode.toLowerCase().includes(search.toLowerCase()) || pu.name.toLowerCase().includes(search.toLowerCase()) || pu.assignedOfficerName.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || pu.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [pus, search, statusFilter])

  return (
    <div className="panel" style={{ marginTop: 20, overflow: 'hidden' }}>
      <div className="panel-title"><Activity size={12} />Polling Unit Status ({filtered.length} of {pus.length})</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input className="input" placeholder="Search PU code, name, officer..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as PUStatus | 'all')} style={{ width: 160 }}>
          <option value="all">All Statuses</option>
          {(['active','voting','collating','submitted','completed','pending','offline','flagged'] as PUStatus[]).map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>PU CODE</th><th>NAME</th><th>STATE</th><th>OFFICER</th><th>STATUS</th>
              <th>NETWORK</th><th>REGISTERED</th><th>ACCREDITED</th><th>VOTES CAST</th><th>FLAG</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((pu) => (
              <tr key={pu.puId}>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green-inec)' }}>{pu.puCode}</span></td>
                <td style={{ maxWidth: 180 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{pu.name}</div></td>
                <td><span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{pu.stateId.toUpperCase()}</span></td>
                <td style={{ fontSize: 12 }}>{pu.assignedOfficerName}</td>
                <td><PUStatusBadge status={pu.status} /></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {pu.hasGuaranteedNetwork ? <Wifi size={12} color="var(--status-active)" /> : <WifiOff size={12} color="var(--status-offline)" />}
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{pu.networkType.toUpperCase()}</span>
                  </div>
                </td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{pu.registeredVoters.toLocaleString()}</span></td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{pu.accreditedVoters.toLocaleString()}</span></td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green-inec)' }}>{pu.totalVotesCast.toLocaleString()}</span></td>
                <td>{pu.isFlagged && <Flag size={14} color="var(--severity-critical)" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StateVoteChart() {
  const data = MOCK_STATES.map((s) => ({ name: s.code, votes: Math.floor(s.stats.totalVotesCast / 1000) }))
  return (
    <div className="panel" style={{ height: 200 }}>
      <div className="panel-title"><BarChart3 size={12} />Votes Cast by State (Thousands)</div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8, fontSize: 12, fontFamily: 'Space Mono', color: 'var(--text-primary)' }} formatter={(value: number) => [`${value}k votes`, 'Total']} />
          <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? 'var(--green-inec)' : 'var(--green-dim)'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function OverviewPage() {
  const { filters, selectedState, selectedLGA } = useFilters()
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const allPUs = getAllMockPUs()

  const visiblePUs = useMemo(() => {
    return allPUs.filter((pu) => {
      if (filters.selectedPUId) return pu.puId === filters.selectedPUId
      if (filters.selectedWardId) return pu.wardId === filters.selectedWardId
      if (filters.selectedLgaId) return pu.lgaId === filters.selectedLgaId
      if (filters.selectedStateId) return pu.stateId === filters.selectedStateId
      return true
    })
  }, [allPUs, filters])

  const stats = selectedState ? selectedState.stats : NATIONAL_STATS
  const isNational = !selectedState

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* INEC Logo */}
          <div style={{
            width: 52,
            height: 52,
            background: '#000',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--green-dim)',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/inec-logo.png" alt="INEC Logo" style={{ width: 48, height: 48, objectFit: 'contain' }} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
              {selectedState ? selectedLGA ? `${selectedLGA.name} — ${selectedState.name}` : selectedState.name : 'National Overview'}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {filters.selectedStateId ? `Drilling into ${selectedState?.lgas.length} LGAs` : `Monitoring ${NATIONAL_STATS.totalPUs.toLocaleString()} Polling Units across ${NATIONAL_STATS.totalStates} States`}
            </p>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setLastRefresh(new Date())} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={12} />
          Refresh
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {lastRefresh.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="Active PUs" value={stats.activePUs} icon={Activity} color="var(--status-active)" sublabel="Currently operational" />
        <StatCard label="Offline PUs" value={stats.offlinePUs} icon={WifiOff} color="var(--status-offline)" sublabel="Sync pending" />
        <StatCard label="Completed PUs" value={stats.completedPUs} icon={CheckCircle} color="var(--status-completed)" sublabel="Results submitted" />
        {'flaggedPUs' in stats && (
          <StatCard label="Flagged PUs" value={(stats as typeof NATIONAL_STATS).flaggedPUs} icon={AlertTriangle} color="var(--severity-critical)" sublabel="Require attention" />
        )}
        <StatCard label="Votes Cast" value={stats.totalVotesCast} icon={BarChart3} color="var(--green-inec)" sublabel="Total national count" />
        {isNational && (
          <StatCard label="Vehicles In-Transit" value={NATIONAL_STATS.vehiclesInTransit} icon={Truck} color="var(--status-submitted)" sublabel={`of ${NATIONAL_STATS.totalVehicles.toLocaleString()} deployed`} />
        )}
      </div>

      {!filters.selectedStateId && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <StateVoteChart />
          <div className="panel" style={{ overflow: 'hidden' }}>
            <div className="panel-title"><Activity size={12} />State Breakdown</div>
            <div style={{ overflowX: 'auto', maxHeight: 140, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>STATE</th><th>ACTIVE</th><th>OFFLINE</th><th>DONE</th><th>FLAGGED</th><th>PROGRESS</th><th>VOTES</th></tr>
                </thead>
                <tbody>{MOCK_STATES.map((s) => <StateSummaryRow key={s.stateId} state={s} />)}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <PUTable pus={visiblePUs} />
    </div>
  )
}
