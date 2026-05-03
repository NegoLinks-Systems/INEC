// src/utils/anomalyDetector.ts
// ─────────────────────────────────────────────────────────────────────────────
// INEC 2.0 — AI Anomaly Detection Engine (Module 7)
// Monitors fleet locations, PU submissions, and operational timelines
// Triggers alerts to the admin dashboard
// ─────────────────────────────────────────────────────────────────────────────

import { MockVehicle, MockPU, MOCK_VEHICLES, getAllMockPUs } from '@/firebase/mockData'
import { AlertType, IncidentSeverity } from '@/firebase/schema'
import { v4 as uuid } from 'uuid'

export interface DetectedAnomaly {
  alertId: string
  alertType: AlertType
  severity: IncidentSeverity
  title: string
  message: string
  relatedEntityId: string
  relatedEntityType: 'vehicle' | 'pu' | 'officer' | 'vote_log'
  coordinates?: { latitude: number; longitude: number }
  stateId?: string
  lgaId?: string
  createdAt: Date
  isRead: boolean
  contextData: Record<string, unknown>
}

// ─── Configuration Thresholds ─────────────────────────────────────────────────
const THRESHOLDS = {
  vehicleStationaryMinutes: 30,      // Alert if vehicle stationary > 30 min
  lateSubmissionHour: 15,            // Polls close at 15:00 (3 PM)
  lateSubmissionMinutes: 30,         // Grace period after close
  offlinePUPercentThreshold: 15,     // Alert if >15% PUs offline in an LGA
  voteCountAnomalyRatio: 0.98,       // Alert if votes > 98% of accredited voters
  geofenceRadiusKm: 2.0,             // Vehicles must stay within 2km of assigned route
  minimumSpeedWhenMovingKph: 5,      // Below this = considered stationary
}

// ─── Vehicle Stationary Check ─────────────────────────────────────────────────
export function checkVehicleStationary(vehicle: MockVehicle): DetectedAnomaly | null {
  if (vehicle.status === 'delivered' || vehicle.status === 'idle') return null

  const msSinceUpdate = Date.now() - vehicle.lastUpdated.getTime()
  const minutesSinceUpdate = msSinceUpdate / 1000 / 60

  const isStationary = vehicle.speedKph < THRESHOLDS.minimumSpeedWhenMovingKph
  const isTooLong = minutesSinceUpdate > THRESHOLDS.vehicleStationaryMinutes

  if (isStationary && isTooLong) {
    const overMinutes = Math.round(minutesSinceUpdate - THRESHOLDS.vehicleStationaryMinutes)
    return {
      alertId: uuid(),
      alertType: 'vehicle_stationary',
      severity: minutesSinceUpdate > 60 ? 'critical' : 'high',
      title: `Vehicle ${vehicle.vehicleReg} Stationary ${Math.round(minutesSinceUpdate)}min`,
      message: `Dispatch vehicle ${vehicle.vehicleReg} (${vehicle.driverName}) has been stationary for ${Math.round(minutesSinceUpdate)} minutes — ${overMinutes} minutes beyond the ${THRESHOLDS.vehicleStationaryMinutes}-minute threshold. Location: ${vehicle.currentCoordinates.latitude.toFixed(4)}, ${vehicle.currentCoordinates.longitude.toFixed(4)}.`,
      relatedEntityId: vehicle.vehicleId,
      relatedEntityType: 'vehicle',
      coordinates: vehicle.currentCoordinates,
      stateId: vehicle.stateId,
      lgaId: vehicle.lgaId,
      createdAt: new Date(),
      isRead: false,
      contextData: {
        vehicleReg: vehicle.vehicleReg,
        driverName: vehicle.driverName,
        minutesStationary: Math.round(minutesSinceUpdate),
        lastKnownSpeed: vehicle.speedKph,
        lastUpdated: vehicle.lastUpdated.toISOString(),
      },
    }
  }

  return null
}

// ─── Late Result Submission Check ─────────────────────────────────────────────
export function checkLateSubmission(pu: MockPU, submittedAt: Date): DetectedAnomaly | null {
  const closeTime = new Date()
  closeTime.setHours(THRESHOLDS.lateSubmissionHour, THRESHOLDS.lateSubmissionMinutes, 0, 0)

  if (submittedAt > closeTime) {
    const minutesLate = Math.round((submittedAt.getTime() - closeTime.getTime()) / 1000 / 60)
    return {
      alertId: uuid(),
      alertType: 'late_submission',
      severity: minutesLate > 120 ? 'critical' : minutesLate > 60 ? 'high' : 'medium',
      title: `Late Submission: ${pu.puCode}`,
      message: `Results from ${pu.name} (${pu.puCode}) were submitted ${minutesLate} minutes after the ${THRESHOLDS.lateSubmissionHour}:${THRESHOLDS.lateSubmissionMinutes.toString().padStart(2, '0')} grace period. Assigned officer: ${pu.assignedOfficerName}. This submission requires manual verification.`,
      relatedEntityId: pu.puId,
      relatedEntityType: 'vote_log',
      coordinates: pu.coordinates,
      stateId: pu.stateId,
      lgaId: pu.lgaId,
      createdAt: new Date(),
      isRead: false,
      contextData: {
        puCode: pu.puCode,
        puName: pu.name,
        officerName: pu.assignedOfficerName,
        submittedAt: submittedAt.toISOString(),
        minutesLate,
        closeTime: closeTime.toISOString(),
      },
    }
  }

  return null
}

// ─── Vote Count Anomaly Check ─────────────────────────────────────────────────
export function checkVoteCountAnomaly(pu: MockPU): DetectedAnomaly | null {
  if (pu.accreditedVoters === 0) return null

  const voteRatio = pu.totalVotesCast / pu.accreditedVoters

  // Flag if votes cast exceed accredited voters (impossible) or are suspiciously close
  if (pu.totalVotesCast > pu.accreditedVoters) {
    return {
      alertId: uuid(),
      alertType: 'result_anomaly',
      severity: 'critical',
      title: `CRITICAL: Votes Exceed Accredited at ${pu.puCode}`,
      message: `${pu.name} (${pu.puCode}) recorded ${pu.totalVotesCast} votes cast but only ${pu.accreditedVoters} voters were accredited. This is statistically impossible and requires immediate investigation. Officer: ${pu.assignedOfficerName}.`,
      relatedEntityId: pu.puId,
      relatedEntityType: 'vote_log',
      coordinates: pu.coordinates,
      stateId: pu.stateId,
      lgaId: pu.lgaId,
      createdAt: new Date(),
      isRead: false,
      contextData: {
        puCode: pu.puCode,
        totalVotesCast: pu.totalVotesCast,
        accreditedVoters: pu.accreditedVoters,
        overvoteCount: pu.totalVotesCast - pu.accreditedVoters,
        voteRatio,
      },
    }
  }

  if (voteRatio >= THRESHOLDS.voteCountAnomalyRatio) {
    return {
      alertId: uuid(),
      alertType: 'result_anomaly',
      severity: 'medium',
      title: `High Vote Ratio Alert: ${pu.puCode}`,
      message: `${pu.name} shows a ${(voteRatio * 100).toFixed(1)}% vote-to-accreditation ratio (${pu.totalVotesCast} votes / ${pu.accreditedVoters} accredited). This exceeds the ${(THRESHOLDS.voteCountAnomalyRatio * 100).toFixed(0)}% threshold for anomaly flagging. Marked for supervisor review.`,
      relatedEntityId: pu.puId,
      relatedEntityType: 'vote_log',
      coordinates: pu.coordinates,
      stateId: pu.stateId,
      lgaId: pu.lgaId,
      createdAt: new Date(),
      isRead: false,
      contextData: {
        puCode: pu.puCode,
        voteRatio,
        totalVotesCast: pu.totalVotesCast,
        accreditedVoters: pu.accreditedVoters,
      },
    }
  }

  return null
}

// ─── Offline PU Cluster Detection ─────────────────────────────────────────────
export function checkOfflinePUCluster(
  lgaId: string,
  lgaName: string,
  stateId: string,
  totalPUs: number,
  offlinePUs: number
): DetectedAnomaly | null {
  if (totalPUs === 0) return null

  const offlinePercent = (offlinePUs / totalPUs) * 100

  if (offlinePercent >= THRESHOLDS.offlinePUPercentThreshold) {
    return {
      alertId: uuid(),
      alertType: 'connectivity_loss',
      severity: offlinePercent >= 40 ? 'critical' : offlinePercent >= 25 ? 'high' : 'medium',
      title: `Connectivity Loss Cluster: ${lgaName}`,
      message: `${offlinePUs} of ${totalPUs} Polling Units (${offlinePercent.toFixed(1)}%) in ${lgaName} are currently offline. This exceeds the ${THRESHOLDS.offlinePUPercentThreshold}% cluster threshold, suggesting a possible network infrastructure failure in this area. Satellite backup deployment may be required.`,
      relatedEntityId: lgaId,
      relatedEntityType: 'pu',
      stateId,
      lgaId,
      createdAt: new Date(),
      isRead: false,
      contextData: {
        lgaId,
        lgaName,
        totalPUs,
        offlinePUs,
        offlinePercent,
      },
    }
  }

  return null
}

// ─── Run Full Detection Pass ──────────────────────────────────────────────────
export function runAnomalyDetection(): DetectedAnomaly[] {
  const alerts: DetectedAnomaly[] = []
  const allPUs = getAllMockPUs()

  // Check all vehicles
  MOCK_VEHICLES.forEach((vehicle) => {
    const alert = checkVehicleStationary(vehicle)
    if (alert) alerts.push(alert)
  })

  // Check all PUs for vote count anomalies
  allPUs.forEach((pu) => {
    if (pu.status === 'submitted' || pu.status === 'completed') {
      const alert = checkVoteCountAnomaly(pu)
      if (alert) alerts.push(alert)
    }
  })

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
}

// ─── Format Alert Time ────────────────────────────────────────────────────────
export function formatAlertTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString('en-NG')
}

// ─── Get Severity Color ───────────────────────────────────────────────────────
export function getSeverityColor(severity: IncidentSeverity): string {
  const colors: Record<IncidentSeverity, string> = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
  }
  return colors[severity]
}
