// src/components/incidents/IncidentsPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// INEC 2.0 — Incident Reporting & Evidence Uploads (Module 5)
// Field officers report via mobile app → Firebase Storage + Firestore
// Admin sees real-time feed with severity alerts
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import React, { useState } from 'react'
import {
  AlertTriangle, CheckCircle, Eye, Clock, MapPin,
  Image, FileText, Filter, ChevronDown, MessageSquare
} from 'lucide-react'
import { MOCK_INCIDENTS, MockIncident } from '@/firebase/mockData'
import { IncidentSeverity } from '@/firebase/schema'
import { formatAlertTime } from '@/utils/anomalyDetector'

// ─── Incident Detail Modal ────────────────────────────────────────────────────
function IncidentModal({
  incident,
  onClose,
  onAcknowledge,
  onResolve,
}: {
  incident: MockIncident
  onClose: () => void
  onAcknowledge: (id: string) => void
  onResolve: (id: string) => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6,8,16,0.8)',
        backdropFilter: 'blur(4px)',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--bg-border)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: 560,
          overflow: 'hidden',
          animation: 'fadeInUp 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--bg-border)',
          background: incident.severity === 'critical'
            ? 'rgba(239,68,68,0.05)'
            : 'var(--bg-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} color={`var(--severity-${incident.severity})`} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
              {incident.title}
            </h3>
            <span className={`status-badge severity-${incident.severity}`} style={{ marginLeft: 'auto' }}>
              {incident.severity.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          {/* Description */}
          <div style={{
            background: 'var(--bg-elevated)',
            borderRadius: 8,
            padding: '12px 14px',
            fontSize: 13,
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
            marginBottom: 16,
          }}>
            {incident.description}
          </div>

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Officer', value: incident.officerName },
              { label: 'PU Code', value: incident.puId },
              { label: 'State', value: incident.stateId.toUpperCase() },
              { label: 'Category', value: incident.category.replace('_', ' ') },
              { label: 'Reported', value: formatAlertTime(incident.reportedAt) },
              { label: 'Status', value: incident.status },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 6, padding: '8px 12px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* GPS */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            background: 'var(--bg-elevated)',
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
          }}>
            <MapPin size={12} color="var(--green-inec)" />
            GPS: {incident.coordinates.latitude.toFixed(5)}, {incident.coordinates.longitude.toFixed(5)}
          </div>

          {/* Evidence placeholder */}
          {incident.imageUrls.length === 0 && (
            <div style={{
              border: '1px dashed var(--bg-border)',
              borderRadius: 8,
              padding: 20,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 12,
              marginBottom: 16,
            }}>
              <Image size={20} style={{ marginBottom: 6, opacity: 0.4 }} />
              <div>No evidence photos uploaded yet</div>
              <div style={{ fontSize: 10, marginTop: 2 }}>Field officer can attach via mobile app</div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            {incident.status === 'open' && (
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => { onAcknowledge(incident.incidentId); onClose() }}
              >
                <Eye size={14} />
                Acknowledge
              </button>
            )}
            {incident.status !== 'resolved' && (
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => { onResolve(incident.incidentId); onClose() }}
              >
                <CheckCircle size={14} />
                Mark Resolved
              </button>
            )}
            <button className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Incident Row ─────────────────────────────────────────────────────────────
function IncidentRow({
  incident,
  onClick,
}: {
  incident: MockIncident
  onClick: () => void
}) {
  return (
    <tr
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={14} color={`var(--severity-${incident.severity})`} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{incident.title}</div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 1 }}>
              {incident.puId}
            </div>
          </div>
        </div>
      </td>
      <td>
        <span className={`status-badge severity-${incident.severity}`}>
          {incident.severity.toUpperCase()}
        </span>
      </td>
      <td>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
          {incident.category.replace('_', ' ')}
        </span>
      </td>
      <td style={{ fontSize: 12 }}>{incident.officerName}</td>
      <td>
        <span style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
        }}>
          {incident.stateId.toUpperCase()}
        </span>
      </td>
      <td>
        <span className={`status-badge status-${incident.status}`}>
          {incident.status}
        </span>
      </td>
      <td>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {formatAlertTime(incident.reportedAt)}
        </span>
      </td>
      <td>
        {incident.imageUrls.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--green-inec)' }}>
            <Image size={12} />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{incident.imageUrls.length}</span>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
        )}
      </td>
    </tr>
  )
}

// ─── Incidents Page ───────────────────────────────────────────────────────────
export default function IncidentsPanel() {
  const [incidents, setIncidents] = useState<MockIncident[]>(MOCK_INCIDENTS)
  const [selectedIncident, setSelectedIncident] = useState<MockIncident | null>(null)
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'open' | 'acknowledged' | 'resolved' | 'all'>('all')

  const filtered = incidents.filter((i) => {
    const matchSev = severityFilter === 'all' || i.severity === severityFilter
    const matchStat = statusFilter === 'all' || i.status === statusFilter
    return matchSev && matchStat
  })

  const criticalCount = incidents.filter((i) => i.severity === 'critical' && i.status !== 'resolved').length
  const openCount = incidents.filter((i) => i.status === 'open').length

  const handleAcknowledge = (id: string) => {
    setIncidents((prev) =>
      prev.map((i) => (i.incidentId === id ? { ...i, status: 'acknowledged' } : i))
    )
  }

  const handleResolve = (id: string) => {
    setIncidents((prev) =>
      prev.map((i) => (i.incidentId === id ? { ...i, status: 'resolved' } : i))
    )
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20, boxSizing: 'border-box' as const }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>
            Incident Reports
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {openCount} open · {criticalCount} critical unresolved
          </p>
        </div>

        {criticalCount > 0 && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'pulse-dot 1.5s infinite',
          }}>
            <AlertTriangle size={16} color="var(--severity-critical)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--severity-critical)' }}>
              {criticalCount} Critical Alert{criticalCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Critical', count: incidents.filter((i) => i.severity === 'critical').length, color: 'var(--severity-critical)' },
          { label: 'High', count: incidents.filter((i) => i.severity === 'high').length, color: 'var(--severity-high)' },
          { label: 'Open', count: openCount, color: 'var(--status-flagged)' },
          { label: 'Resolved', count: incidents.filter((i) => i.status === 'resolved').length, color: 'var(--status-completed)' },
        ].map(({ label, count, color }) => (
          <div key={label} className="stat-card" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color }}>{count}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={12} color="var(--text-muted)" />
        </div>
        <select
          className="select"
          style={{ width: 140 }}
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as IncidentSeverity | 'all')}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          className="select"
          style={{ width: 140 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'open' | 'acknowledged' | 'resolved' | 'all')}
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Table */}
      <div className="panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>INCIDENT</th>
                <th>SEVERITY</th>
                <th>CATEGORY</th>
                <th>OFFICER</th>
                <th>STATE</th>
                <th>STATUS</th>
                <th>TIME</th>
                <th>EVIDENCE</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((incident) => (
                <IncidentRow
                  key={incident.incidentId}
                  incident={incident}
                  onClick={() => setSelectedIncident(incident)}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    No incidents match the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile note */}
      <div style={{
        marginTop: 16,
        padding: '12px 16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--bg-border)',
        borderRadius: 8,
        fontSize: 12,
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <FileText size={14} />
        Field officers submit incidents via the INEC mobile app. Photos upload to Firebase Cloud Storage.
        GPS coordinates, timestamps, and evidence URLs are automatically stored in Firestore and alert the admin dashboard in real-time.
      </div>

      {/* Modal */}
      {selectedIncident && (
        <IncidentModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onAcknowledge={handleAcknowledge}
          onResolve={handleResolve}
        />
      )}
    </div>
  )
}
