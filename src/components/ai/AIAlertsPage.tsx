// src/components/ai/AIAlertsPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// MINI-INEC 2.0 — AI Intelligence & Automation Layer (Module 7)
// Real-time anomaly detection feed with severity classification
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import React, { useState, useEffect } from 'react'
import {
  BrainCircuit, AlertTriangle, Truck, Clock, WifiOff,
  BarChart2, RefreshCw, CheckCircle, X, Eye
} from 'lucide-react'
import { MOCK_ALERTS, MockAlert } from '@/firebase/mockData'
import { runAnomalyDetection, formatAlertTime, getSeverityColor, DetectedAnomaly } from '@/utils/anomalyDetector'
import { IncidentSeverity } from '@/firebase/schema'

// ─── Alert type icon map ──────────────────────────────────────────────────────
function AlertTypeIcon({ type, color }: { type: string; color: string }) {
  const props = { size: 16, color }
  switch (type) {
    case 'vehicle_stationary': return <Truck {...props} />
    case 'late_submission':    return <Clock {...props} />
    case 'offline_pu':         return <WifiOff {...props} />
    case 'result_anomaly':     return <BarChart2 {...props} />
    case 'connectivity_loss':  return <WifiOff {...props} />
    case 'incident_report':    return <AlertTriangle {...props} />
    default:                   return <AlertTriangle {...props} />
  }
}

// ─── Single Alert Card ────────────────────────────────────────────────────────
function AlertCard({
  alert,
  onDismiss,
  onRead,
}: {
  alert: any
  onDismiss: (id: string) => void
  onRead: (id: string) => void
}) {
  const id = (alert as any).alertId || (alert as any).id || "fallback-id";
  const title = alert.title
  const message = alert.message
  const severity: IncidentSeverity = alert.severity
  const type = alert.alertType
  const isRead = alert.isRead
  const createdAt = 'createdAt' in alert ? alert.createdAt : new Date()
  const color = getSeverityColor(severity)

  return (
    <div
      style={{
        background: isRead ? 'var(--bg-card)' : 'var(--bg-card-hover)',
        border: `1px solid ${isRead ? 'var(--bg-border)' : color + '30'}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 'var(--radius-lg)',
        padding: '14px 16px',
        display: 'flex',
        gap: 14,
        transition: 'all var(--transition-fast)',
        opacity: isRead ? 0.75 : 1,
      }}
    >
      {/* Icon */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: `${color}15`,
        border: `1px solid ${color}25`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 2,
      }}>
        <AlertTypeIcon type={type} color={color} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span className={`status-badge severity-${severity}`}>
              {severity.toUpperCase()}
            </span>
            {!isRead && (
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
            )}
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '4px 0 10px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {formatAlertTime(createdAt)}
            </span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {type.replace(/_/g, ' ')}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {!isRead && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onRead(id)}
                style={{ padding: '3px 8px', fontSize: 11 }}
              >
                <Eye size={11} />
                Mark Read
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onDismiss(id)}
              style={{ padding: '3px 8px', fontSize: 11 }}
            >
              <X size={11} />
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Stats Row ────────────────────────────────────────────────────────────────
function AIStats({ alerts }: { alerts: (MockAlert | DetectedAnomaly)[] }) {
  const counts = {
    critical: alerts.filter((a) => a.severity === 'critical').length,
    high: alerts.filter((a) => a.severity === 'high').length,
    unread: alerts.filter((a) => !a.isRead).length,
    total: alerts.length,
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
      {[
        { label: 'Critical', count: counts.critical, color: 'var(--severity-critical)' },
        { label: 'High', count: counts.high, color: 'var(--severity-high)' },
        { label: 'Unread', count: counts.unread, color: 'var(--status-voting)' },
        { label: 'Total Active', count: counts.total, color: 'var(--green-inec)' },
      ].map(({ label, count, color }) => (
        <div key={label} className="stat-card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color }}>{count}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── AI Alerts Page ───────────────────────────────────────────────────────────
export default function AIAlertsPage() {
  const [alerts, setAlerts] = useState<(MockAlert | DetectedAnomaly)[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isRunning, setIsRunning] = useState(false)
  const [lastRun, setLastRun] = useState<Date | null>(null)

  const runDetection = () => {
    setIsRunning(true)
    setTimeout(() => {
      const detected = runAnomalyDetection()
      const combined = [
        ...MOCK_ALERTS.map((a) => ({ ...a, alertType: a.alertType, createdAt: a.createdAt })),
        ...detected,
      ]
      setAlerts(combined)
      setLastRun(new Date())
      setIsRunning(false)
    }, 800) // simulate processing
  }

  useEffect(() => {
    runDetection()
    // Re-run every 60 seconds
    const interval = setInterval(runDetection, 60000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDismiss = (id: string) =>
    setDismissed((prev) => new Set([...prev, id]))

  const handleRead = (id: string) =>
    setAlerts((prev) =>
      prev.map((a) => (a.alertId === id ? { ...a, isRead: true } : a))
    )

  const handleMarkAllRead = () =>
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })))

  const visible = alerts.filter(
    (a) =>
      !dismissed.has(a.alertId) &&
      (severityFilter === 'all' || a.severity === severityFilter) &&
      (typeFilter === 'all' || a.alertType === typeFilter)
  )

  const alertTypes = Array.from(new Set(alerts.map((a) => a.alertType)))

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'rgba(0,166,81,0.1)',
            border: '1px solid rgba(0,166,81,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <BrainCircuit size={20} color="var(--green-inec)" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>
              AI Intelligence Layer
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Automated anomaly detection · Electoral operations monitoring
              {lastRun && (
                <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  · Last scan: {formatAlertTime(lastRun)}
                </span>
              )}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>
            <CheckCircle size={12} />
            Mark All Read
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={runDetection}
            disabled={isRunning}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={12} style={{ animation: isRunning ? 'spin 0.8s linear infinite' : 'none' }} />
            {isRunning ? 'Scanning...' : 'Run Scan'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <AIStats alerts={visible} />

      {/* Scanning indicator */}
      {isRunning && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(0,166,81,0.08)',
          border: '1px solid rgba(0,166,81,0.2)',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 12,
          color: 'var(--green-inec)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            width: 10,
            height: 10,
            border: '2px solid var(--green-inec)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          Running anomaly detection across {176846..toLocaleString()} polling units and 3,420 vehicles...
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          className="select"
          style={{ width: 150 }}
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
          style={{ width: 200 }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Alert Types</option>
          {alertTypes.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>

        {(severityFilter !== 'all' || typeFilter !== 'all') && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setSeverityFilter('all'); setTypeFilter('all') }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Alert feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 48,
            color: 'var(--text-muted)',
            border: '1px dashed var(--bg-border)',
            borderRadius: 12,
          }}>
            <BrainCircuit size={32} strokeWidth={1} style={{ marginBottom: 8, opacity: 0.4 }} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>
              No Active Alerts
            </div>
            <div style={{ fontSize: 12 }}>All systems operating within normal parameters</div>
          </div>
        ) : (
          visible.map((alert) => (
            <AlertCard
              key={alert.alertId}
              alert={alert}
              onDismiss={handleDismiss}
              onRead={handleRead}
            />
          ))
        )}
      </div>

      {/* Detection thresholds info */}
      <div style={{
        marginTop: 24,
        padding: 16,
        background: 'var(--bg-card)',
        border: '1px solid var(--bg-border)',
        borderRadius: 10,
        fontSize: 12,
        color: 'var(--text-secondary)',
      }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <BrainCircuit size={13} color="var(--green-inec)" />
          Detection Rules Active
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            ['Vehicle Stationary', 'Alert if GPS speed < 5 km/h for > 30 minutes'],
            ['Late Submission', 'Alert if results submitted > 30min after 15:00'],
            ['Offline PU Cluster', 'Alert if > 15% of LGA PUs go offline simultaneously'],
            ['Vote Count Anomaly', 'Alert if votes cast ≥ 98% of accredited voters'],
          ].map(([rule, desc]) => (
            <div key={rule} style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-inec)', flexShrink: 0, marginTop: 5 }} />
              <div>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{rule}:</span>{' '}
                <span>{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
