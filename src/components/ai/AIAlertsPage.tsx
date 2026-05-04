// src/components/ai/AIAlertsPage.tsx
'use client'

import React, { useState, useEffect } from 'react'
import {
  BrainCircuit, AlertTriangle, Truck, Clock, WifiOff,
  BarChart2, RefreshCw, CheckCircle, X, Eye
} from 'lucide-react'
import { MOCK_ALERTS } from '@/firebase/mockData'
import { useLiveAlerts } from '@/hooks/firebase/useFirestore'
import { runAnomalyDetection, formatAlertTime, getSeverityColor } from '@/utils/anomalyDetector'
import { IncidentSeverity } from '@/firebase/schema'

// ─── Unified alert type for this page ────────────────────────────────────────
interface UnifiedAlert {
  alertId: string
  alertType: string
  severity: IncidentSeverity
  title: string
  message: string
  isRead: boolean
  stateId?: string
  createdAt: Date
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toUnified(raw: any): UnifiedAlert {
  return {
    alertId: String(raw.alertId ?? ''),
    alertType: String(raw.alertType ?? ''),
    severity: (raw.severity ?? 'medium') as IncidentSeverity,
    title: String(raw.title ?? ''),
    message: String(raw.message ?? ''),
    isRead: Boolean(raw.isRead),
    stateId: raw.stateId ? String(raw.stateId) : undefined,
    createdAt: raw.createdAt instanceof Date ? raw.createdAt : new Date(),
  }
}

function AlertTypeIcon({ type, color }: { type: string; color: string }) {
  const props = { size: 16, color }
  switch (type) {
    case 'vehicle_stationary': return <Truck {...props} />
    case 'late_submission':    return <Clock {...props} />
    case 'offline_pu':
    case 'connectivity_loss':  return <WifiOff {...props} />
    case 'result_anomaly':     return <BarChart2 {...props} />
    case 'incident_report':    return <AlertTriangle {...props} />
    default:                   return <AlertTriangle {...props} />
  }
}

function AlertCard({
  alert,
  onDismiss,
  onRead,
}: {
  alert: UnifiedAlert
  onDismiss: (id: string) => void
  onRead: (id: string) => void
}) {
  const color = getSeverityColor(alert.severity)
  return (
    <div style={{
      background: alert.isRead ? 'var(--bg-card)' : 'var(--bg-card-hover)',
      border: `1px solid ${alert.isRead ? 'var(--bg-border)' : color + '30'}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 'var(--radius-lg)',
      padding: '14px 16px',
      display: 'flex',
      gap: 14,
      transition: 'all var(--transition-fast)',
      opacity: alert.isRead ? 0.75 : 1,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: `${color}15`, border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2,
      }}>
        <AlertTypeIcon type={alert.alertType} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {alert.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span className={`status-badge severity-${alert.severity}`}>{alert.severity.toUpperCase()}</span>
            {!alert.isRead && <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />}
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '4px 0 10px' }}>
          {alert.message}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {formatAlertTime(alert.createdAt)}
            </span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {alert.alertType.replace(/_/g, ' ')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {!alert.isRead && (
              <button className="btn btn-ghost btn-sm" onClick={() => onRead(alert.alertId)} style={{ padding: '3px 8px', fontSize: 11 }}>
                <Eye size={11} /> Mark Read
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => onDismiss(alert.alertId)} style={{ padding: '3px 8px', fontSize: 11 }}>
              <X size={11} /> Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AIStats({ alerts }: { alerts: UnifiedAlert[] }) {
  const counts = {
    critical: alerts.filter((a) => a.severity === 'critical').length,
    high: alerts.filter((a) => a.severity === 'high').length,
    unread: alerts.filter((a) => !a.isRead).length,
    total: alerts.length,
  }
  const items = [
    { label: 'Critical', count: counts.critical, color: 'var(--severity-critical)' },
    { label: 'High', count: counts.high, color: 'var(--severity-high)' },
    { label: 'Unread', count: counts.unread, color: 'var(--status-voting)' },
    { label: 'Total Active', count: counts.total, color: 'var(--green-inec)' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
      {items.map(({ label, count, color }) => (
        <div key={label} className="stat-card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color }}>{count}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

export default function AIAlertsPage() {
  const [alerts, setAlerts] = useState<UnifiedAlert[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isRunning, setIsRunning] = useState(false)
  const [lastRun, setLastRun] = useState<Date | null>(null)

  const { alerts: firebaseAlerts, markRead: fbMarkRead, dismiss: fbDismiss } = useLiveAlerts()

  const runDetection = () => {
    setIsRunning(true)
    setTimeout(() => {
      const detected = runAnomalyDetection()
      // Merge Firebase alerts + local anomaly detection
      const fbUnified = firebaseAlerts.map(toUnified)
      const mockFallback = fbUnified.length === 0 ? MOCK_ALERTS.map(toUnified) : []
      const combined: UnifiedAlert[] = [
        ...fbUnified,
        ...mockFallback,
        ...detected.map(toUnified),
      ]
      // Deduplicate by alertId
      const seen = new Set<string>()
      const unique = combined.filter(a => {
        if (seen.has(a.alertId)) return false
        seen.add(a.alertId)
        return true
      })
      setAlerts(unique)
      setLastRun(new Date())
      setIsRunning(false)
    }, 800)
  }

  useEffect(() => {
    runDetection()
    const interval = setInterval(runDetection, 60000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDismiss = (id: string) => {
    setDismissed((prev) => [...prev, id])
    fbDismiss(id).catch(() => {})
  }
  const handleRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => a.alertId === id ? { ...a, isRead: true } : a))
    fbMarkRead(id).catch(() => {})
  }
  const handleMarkAllRead = () =>
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })))

  const visible = alerts.filter(
    (a) =>
      !dismissed.includes(a.alertId) &&
      (severityFilter === 'all' || a.severity === severityFilter) &&
      (typeFilter === 'all' || a.alertType === typeFilter)
  )

  const alertTypes = Array.from(new Set(alerts.map((a) => a.alertType)))

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 20, paddingBottom: 60 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0,166,81,0.1)', border: '1px solid rgba(0,166,81,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrainCircuit size={20} color="var(--green-inec)" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>AI Intelligence Layer</h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Automated anomaly detection · Electoral operations monitoring
              {lastRun && <span style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>· Last scan: {formatAlertTime(lastRun)}</span>}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>
            <CheckCircle size={12} /> Mark All Read
          </button>
          <button className="btn btn-secondary btn-sm" onClick={runDetection} disabled={isRunning} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={12} style={{ animation: isRunning ? 'spin 0.8s linear infinite' : 'none' }} />
            {isRunning ? 'Scanning...' : 'Run Scan'}
          </button>
        </div>
      </div>

      <AIStats alerts={visible} />

      {isRunning && (
        <div style={{ padding: '10px 14px', background: 'rgba(0,166,81,0.08)', border: '1px solid rgba(0,166,81,0.2)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--green-inec)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, border: '2px solid var(--green-inec)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Running anomaly detection across 176,846 polling units and 3,420 vehicles...
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select className="select" style={{ width: 150 }} value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as IncidentSeverity | 'all')}>
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="select" style={{ width: 200 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Alert Types</option>
          {alertTypes.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
        {(severityFilter !== 'all' || typeFilter !== 'all') && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSeverityFilter('all'); setTypeFilter('all') }}>Clear Filters</button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', border: '1px dashed var(--bg-border)', borderRadius: 12 }}>
            <BrainCircuit size={32} strokeWidth={1} style={{ marginBottom: 8, opacity: 0.4 }} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>No Active Alerts</div>
            <div style={{ fontSize: 12 }}>All systems operating within normal parameters</div>
          </div>
        ) : (
          visible.map((alert) => (
            <AlertCard key={alert.alertId} alert={alert} onDismiss={handleDismiss} onRead={handleRead} />
          ))
        )}
      </div>

      <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <BrainCircuit size={13} color="var(--green-inec)" /> Detection Rules Active
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            ['Vehicle Stationary', 'Alert if GPS speed < 5 km/h for > 30 minutes'],
            ['Late Submission', 'Alert if results submitted > 30min after 15:00'],
            ['Offline PU Cluster', 'Alert if > 15% of LGA PUs go offline simultaneously'],
            ['Vote Count Anomaly', 'Alert if votes cast >= 98% of accredited voters'],
          ].map(([rule, desc]) => (
            <div key={rule} style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-inec)', flexShrink: 0, marginTop: 5 }} />
              <div><span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{rule}:</span> <span>{desc}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
