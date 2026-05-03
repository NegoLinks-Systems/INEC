// src/firebase/schema.ts
// ─────────────────────────────────────────────────────────────────────────────
// INEC 2.0 — Complete Firestore Database Schema
//
// COLLECTION HIERARCHY:
//
// /users/{userId}
// /states/{stateId}
//   /lgas/{lgaId}
//     /wards/{wardId}
//       /polling_units/{puId}
// /vote_logs/{logId}
// /fleet_locations/{vehicleId}
// /incidents/{incidentId}
// /signaling/{channelId}
// /ai_alerts/{alertId}
// /system_config/{configId}
// ─────────────────────────────────────────────────────────────────────────────

import {
  collection,
  doc,
  CollectionReference,
  DocumentReference,
  Timestamp,
} from 'firebase/firestore'
import { db } from './config'

// ─── TYPE DEFINITIONS ────────────────────────────────────────────────────────

export type UserRole =
  | 'superadmin'   // INEC HQ — full national visibility
  | 'state_admin'  // State Returning Officer
  | 'lga_admin'    // LGA Returning Officer
  | 'ward_officer' // Ward Collation Officer
  | 'pu_officer'   // Polling Unit Officer (field, mobile app)
  | 'logistics'    // Dispatch driver / logistics officer
  | 'observer'     // Read-only observer / accredited agent

export type PUStatus =
  | 'pending'      // Not yet activated
  | 'active'       // Officer checked in, operations ongoing
  | 'voting'       // Voting in progress
  | 'collating'    // Vote counting/collation
  | 'submitted'    // Results submitted
  | 'offline'      // Officer went offline
  | 'flagged'      // AI or Admin flagged anomaly
  | 'completed'    // All done

export type VehicleStatus =
  | 'idle'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'delayed'
  | 'flagged'

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IncidentStatus = 'open' | 'acknowledged' | 'resolved'

export type AlertType =
  | 'vehicle_stationary'
  | 'late_submission'
  | 'offline_pu'
  | 'result_anomaly'
  | 'incident_report'
  | 'connectivity_loss'
  | 'geofence_breach'

// ─── COLLECTION: /users/{userId} ─────────────────────────────────────────────
export interface UserDocument {
  userId: string
  fullName: string
  email: string
  phone: string
  role: UserRole
  // Geographic assignment (based on role)
  assignedState?: string    // stateId
  assignedLga?: string      // lgaId
  assignedWard?: string     // wardId
  assignedPU?: string       // puId
  assignedVehicle?: string  // vehicleId (for logistics officers)
  // Auth & status
  isActive: boolean
  lastLogin: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
  // Device info (for field officers)
  deviceId?: string
  fcmToken?: string         // Firebase Cloud Messaging token for push notifications
}

// ─── COLLECTION: /states/{stateId} ───────────────────────────────────────────
export interface StateDocument {
  stateId: string           // e.g., "lagos", "kano"
  name: string              // e.g., "Lagos State"
  code: string              // e.g., "LA"
  totalLGAs: number
  totalWards: number
  totalPUs: number
  coordinates: GeoPoint     // State capital coordinates
  // Live aggregate counters (updated via Cloud Functions or client-side)
  stats: {
    activePUs: number
    offlinePUs: number
    completedPUs: number
    flaggedPUs: number
    totalVotesCast: number
  }
}

// ─── SUB-COLLECTION: /states/{stateId}/lgas/{lgaId} ──────────────────────────
export interface LGADocument {
  lgaId: string
  stateId: string
  name: string
  totalWards: number
  totalPUs: number
  coordinates: GeoPoint
  stats: {
    activePUs: number
    offlinePUs: number
    completedPUs: number
    totalVotesCast: number
  }
}

// ─── SUB-COLLECTION: /states/{stateId}/lgas/{lgaId}/wards/{wardId} ───────────
export interface WardDocument {
  wardId: string
  lgaId: string
  stateId: string
  name: string
  totalPUs: number
  registeredVoters: number
  coordinates: GeoPoint
}

// ─── SUB-COLLECTION: .../wards/{wardId}/polling_units/{puId} ─────────────────
export interface PollingUnitDocument {
  puId: string              // e.g., "PU/LA/001/001/001"
  puCode: string            // Official INEC PU code
  name: string              // e.g., "Community Primary School"
  wardId: string
  lgaId: string
  stateId: string
  // Geography
  coordinates: GeoPoint
  address: string
  // Geocoding data
  geocodedAt?: Timestamp
  geocodedBy?: string
  // Assigned personnel
  assignedOfficerId: string // userId
  supervisorId?: string
  // Connectivity
  hasGuaranteedNetwork: boolean
  networkType: 'fibre' | 'lte' | 'satellite' | 'offline_sync'
  lastPing?: Timestamp
  // Status
  status: PUStatus
  checkinTime?: Timestamp
  checkoutTime?: Timestamp
  // Voting data
  registeredVoters: number
  accreditedVoters: number
  totalVotesCast: number
  validVotes: number
  rejectedBallots: number
  // Results submitted
  resultsSubmitted: boolean
  resultsSubmittedAt?: Timestamp
  resultsVerifiedBy?: string
  // Flags
  isFlagged: boolean
  flagReason?: string
  // Assigned dispatch vehicle
  assignedVehicleId?: string
  materialsDelivered: boolean
  materialsDeliveredAt?: Timestamp
}

export interface GeoPoint {
  latitude: number
  longitude: number
}

// ─── COLLECTION: /vote_logs/{logId} ──────────────────────────────────────────
// Individual vote record entry (NOT individual voter identity — aggregated tally)
export interface VoteLogDocument {
  logId: string
  puId: string
  wardId: string
  lgaId: string
  stateId: string
  officerId: string
  // Tally data
  partyResults: Record<string, number>  // { "APC": 245, "PDP": 189, ... }
  totalVotesCast: number
  accreditedVoters: number
  validVotes: number
  rejectedBallots: number
  // Metadata
  submittedAt: Timestamp
  // Offline-sync metadata
  createdOffline: boolean
  offlineCreatedAt?: Timestamp  // When created locally before sync
  syncedAt?: Timestamp          // When successfully pushed to Firestore
  // GPS at time of submission
  submissionCoordinates: GeoPoint
  submissionAccuracy?: number   // GPS accuracy in meters
  // Form image (BVAS result sheet photo)
  resultFormImageUrl?: string
  // Verification
  isVerified: boolean
  verifiedBy?: string
  verifiedAt?: Timestamp
}

// ─── COLLECTION: /fleet_locations/{vehicleId} ────────────────────────────────
// Updated continuously by logistics officers' mobile app (every 30s)
export interface FleetLocationDocument {
  vehicleId: string
  vehicleReg: string          // Plate number
  driverName: string
  driverId: string            // userId
  // Assignment
  dispatchedFrom: string      // State INEC office
  assignedWards: string[]     // wardIds being served
  assignedPUs: string[]       // puIds in this consignment
  // Live location
  currentCoordinates: GeoPoint
  heading?: number            // Degrees 0-360
  speedKph?: number
  altitude?: number
  locationAccuracy?: number
  lastUpdated: Timestamp
  // Journey status
  status: VehicleStatus
  departureTime?: Timestamp
  estimatedArrival?: Timestamp
  actualDeliveryTime?: Timestamp
  // Route waypoints (array of coordinates visited)
  routeHistory: RoutePoint[]
  // Cargo manifest
  cargoManifest: {
    sensitiveDocuments: boolean
    ballotPapers: boolean
    biometricDevices: boolean
    resultSheets: boolean
    otherMaterials: string[]
  }
  // AI monitoring
  stationaryAlertAt?: Timestamp   // When stationary alert was triggered
  isFlagged: boolean
  flagReason?: string
}

export interface RoutePoint {
  coordinates: GeoPoint
  timestamp: Timestamp
  speedKph?: number
}

// ─── COLLECTION: /incidents/{incidentId} ─────────────────────────────────────
export interface IncidentDocument {
  incidentId: string
  reportedBy: string          // userId
  officerName: string
  // Location context
  puId: string
  wardId: string
  lgaId: string
  stateId: string
  // Incident details
  title: string
  description: string
  severity: IncidentSeverity
  category: 'violence' | 'material_shortage' | 'equipment_failure' | 'irregularity' | 'other'
  status: IncidentStatus
  // Evidence
  imageUrls: string[]         // Firebase Storage URLs
  videoUrl?: string
  // Location at time of report
  reportCoordinates: GeoPoint
  reportAccuracy?: number
  // Timestamps
  reportedAt: Timestamp
  // Offline metadata
  createdOffline: boolean
  offlineCreatedAt?: Timestamp
  syncedAt?: Timestamp
  // Response
  acknowledgedBy?: string
  acknowledgedAt?: Timestamp
  resolvedBy?: string
  resolvedAt?: Timestamp
  resolutionNote?: string
}

// ─── COLLECTION: /signaling/{channelId} ──────────────────────────────────────
// Firebase Firestore used as a WebRTC/Agora signaling layer
export interface SignalingDocument {
  channelId: string           // Agora channel name (unique per session)
  // Who initiated (Admin)
  requestedBy: string         // Admin userId
  requestedAt: Timestamp
  // Target field officer
  targetOfficerId: string
  targetPUId: string
  // Agora token (generated server-side or via Agora token builder)
  agoraToken?: string         // UID-specific token
  agoraUid?: number           // Unique integer for Agora session
  // Session state
  status: 'pending' | 'accepted' | 'active' | 'declined' | 'ended' | 'timeout'
  officerPromptedAt?: Timestamp
  officerAcceptedAt?: Timestamp
  sessionStartedAt?: Timestamp
  sessionEndedAt?: Timestamp
  declineReason?: string
  // Participants
  adminJoined: boolean
  officerJoined: boolean
  // Quality metrics
  networkQuality?: number     // 1-6 Agora quality rating
}

// ─── COLLECTION: /ai_alerts/{alertId} ────────────────────────────────────────
export interface AIAlertDocument {
  alertId: string
  alertType: AlertType
  severity: IncidentSeverity
  // What triggered it
  triggeredBy: 'system' | 'anomaly_detector'
  relatedEntityId: string     // vehicleId, puId, userId, etc.
  relatedEntityType: 'vehicle' | 'pu' | 'officer' | 'vote_log'
  // Context
  title: string
  message: string
  contextData: Record<string, unknown>  // Raw data that triggered the alert
  // Location
  coordinates?: GeoPoint
  stateId?: string
  lgaId?: string
  // Status
  isRead: boolean
  isDismissed: boolean
  readBy?: string
  readAt?: Timestamp
  dismissedBy?: string
  dismissedAt?: Timestamp
  createdAt: Timestamp
}

// ─── COLLECTION: /system_config/{configId} ───────────────────────────────────
export interface SystemConfigDocument {
  configId: string
  // Election parameters
  electionName: string         // e.g., "2027 Presidential Election"
  electionDate: Timestamp
  accreditationStartTime: string  // "08:30"
  accreditationEndTime: string    // "13:30"
  votingStartTime: string         // "08:30"
  votingEndTime: string           // "14:30"
  // AI Thresholds
  vehicleStationaryThresholdMinutes: number  // Default: 30
  lateSubmissionWindowMinutes: number         // Minutes after votingEndTime
  // Registered parties
  registeredParties: string[]    // ["APC", "PDP", "LP", ...]
  // National stats (cached aggregate)
  totalRegisteredVoters: number
  totalPUs: number
  totalLGAs: number
  totalStates: number
  // Feature flags
  liveVideoEnabled: boolean
  aiAlertsEnabled: boolean
  offlineSyncEnabled: boolean
  // Legacy portal URLs
  legacyPortals: LegacyPortal[]
}

export interface LegacyPortal {
  id: string
  name: string               // e.g., "IREV Portal"
  url: string                // e.g., "https://irev.inec.gov.ng"
  useIframe: boolean         // true = iframe embed, false = API wrapper
  apiEndpoint?: string       // If useIframe = false
  iconUrl?: string
  description: string
}

// ─── FIRESTORE COLLECTION REFERENCES ─────────────────────────────────────────
// Typed helpers for accessing collections

export const usersCollection = () =>
  collection(db, 'users') as CollectionReference<UserDocument>

export const statesCollection = () =>
  collection(db, 'states') as CollectionReference<StateDocument>

export const lgasCollection = (stateId: string) =>
  collection(db, 'states', stateId, 'lgas') as CollectionReference<LGADocument>

export const wardsCollection = (stateId: string, lgaId: string) =>
  collection(db, 'states', stateId, 'lgas', lgaId, 'wards') as CollectionReference<WardDocument>

export const pollingUnitsCollection = (stateId: string, lgaId: string, wardId: string) =>
  collection(
    db,
    'states', stateId,
    'lgas', lgaId,
    'wards', wardId,
    'polling_units'
  ) as CollectionReference<PollingUnitDocument>

export const voteLogsCollection = () =>
  collection(db, 'vote_logs') as CollectionReference<VoteLogDocument>

export const fleetLocationsCollection = () =>
  collection(db, 'fleet_locations') as CollectionReference<FleetLocationDocument>

export const incidentsCollection = () =>
  collection(db, 'incidents') as CollectionReference<IncidentDocument>

export const signalingCollection = () =>
  collection(db, 'signaling') as CollectionReference<SignalingDocument>

export const aiAlertsCollection = () =>
  collection(db, 'ai_alerts') as CollectionReference<AIAlertDocument>

export const systemConfigDoc = () =>
  doc(db, 'system_config', 'main') as DocumentReference<SystemConfigDocument>

// ─── FIRESTORE SECURITY RULES (place in firestore.rules) ─────────────────────
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function hasRole(role) {
      return isAuthenticated() && getUserData().role == role;
    }

    function isSuperAdmin() {
      return hasRole('superadmin');
    }

    function isAdmin() {
      return isAuthenticated() &&
        getUserData().role in ['superadmin', 'state_admin', 'lga_admin'];
    }

    function isFieldOfficer() {
      return isAuthenticated() &&
        getUserData().role in ['pu_officer', 'logistics', 'ward_officer'];
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow write: if isSuperAdmin();
      allow update: if request.auth.uid == userId &&
        request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['lastLogin', 'fcmToken', 'deviceId']);
    }

    // States hierarchy - Admins read all, field officers read their assigned state
    match /states/{stateId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();

      match /lgas/{lgaId} {
        allow read: if isAuthenticated();
        allow write: if isSuperAdmin();

        match /wards/{wardId} {
          allow read: if isAuthenticated();
          allow write: if isSuperAdmin();

          match /polling_units/{puId} {
            allow read: if isAuthenticated();
            allow update: if isAuthenticated() &&
              (getUserData().assignedPU == puId || isAdmin());
            allow create: if isSuperAdmin();
          }
        }
      }
    }

    // Vote logs - officers write their own, admins read all
    match /vote_logs/{logId} {
      allow read: if isAdmin();
      allow create: if isFieldOfficer() &&
        getUserData().assignedPU == request.resource.data.puId;
      allow update: if false; // Immutable once submitted
    }

    // Fleet locations - logistics officers update their own vehicle
    match /fleet_locations/{vehicleId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() &&
        (getUserData().assignedVehicle == vehicleId || isAdmin());
    }

    // Incidents - any officer can create, admins can update
    match /incidents/{incidentId} {
      allow read: if isAuthenticated();
      allow create: if isFieldOfficer();
      allow update: if isAdmin();
    }

    // Signaling - admins create, target officer can update their own
    match /signaling/{channelId} {
      allow read: if isAuthenticated() &&
        (isAdmin() || getUserData().userId == resource.data.targetOfficerId);
      allow create: if isAdmin();
      allow update: if isAuthenticated() &&
        (isAdmin() || getUserData().userId == resource.data.targetOfficerId);
    }

    // AI alerts - system writes, admins read/update
    match /ai_alerts/{alertId} {
      allow read: if isAdmin();
      allow write: if isSuperAdmin();
      allow update: if isAdmin() &&
        request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['isRead', 'isDismissed', 'readBy', 'readAt', 'dismissedBy', 'dismissedAt']);
    }

    // System config - superadmin only
    match /system_config/{configId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();
    }
  }
}
*/
