// src/firebase/mockData.ts
// ─────────────────────────────────────────────────────────────────────────────
// Demo seed data for MINI-INEC 2.0 PoC
// Simulates a realistic subset of Nigeria's electoral geography
// ─────────────────────────────────────────────────────────────────────────────

import { PUStatus, VehicleStatus, IncidentSeverity } from './schema'

export interface MockState {
  stateId: string
  name: string
  code: string
  coordinates: { latitude: number; longitude: number }
  lgas: MockLGA[]
  stats: { activePUs: number; offlinePUs: number; completedPUs: number; flaggedPUs: number; totalVotesCast: number }
}

export interface MockLGA {
  lgaId: string
  stateId: string
  name: string
  coordinates: { latitude: number; longitude: number }
  wards: MockWard[]
  stats: { activePUs: number; offlinePUs: number; completedPUs: number; totalVotesCast: number }
}

export interface MockWard {
  wardId: string
  lgaId: string
  stateId: string
  name: string
  coordinates: { latitude: number; longitude: number }
  pollingUnits: MockPU[]
}

export interface MockPU {
  puId: string
  puCode: string
  name: string
  wardId: string
  lgaId: string
  stateId: string
  coordinates: { latitude: number; longitude: number }
  status: PUStatus
  registeredVoters: number
  accreditedVoters: number
  totalVotesCast: number
  assignedOfficerName: string
  hasGuaranteedNetwork: boolean
  networkType: 'fibre' | 'lte' | 'satellite' | 'offline_sync'
  isFlagged: boolean
  materialsDelivered: boolean
}

export interface MockVehicle {
  vehicleId: string
  vehicleReg: string
  driverName: string
  currentCoordinates: { latitude: number; longitude: number }
  status: VehicleStatus
  assignedWards: string[]
  stateId: string
  lgaId: string
  speedKph: number
  heading: number
  lastUpdated: Date
  isFlagged: boolean
}

export interface MockIncident {
  incidentId: string
  title: string
  description: string
  severity: IncidentSeverity
  category: string
  status: string
  officerName: string
  puId: string
  stateId: string
  lgaId: string
  coordinates: { latitude: number; longitude: number }
  reportedAt: Date
  imageUrls: string[]
}

export interface MockAlert {
  alertId: string
  alertType: string
  severity: IncidentSeverity
  title: string
  message: string
  createdAt: Date
  isRead: boolean
  stateId: string
  relatedEntityType: string
}

// ─── NIGERIA STATES (abbreviated for PoC — 6 geopolitical zones) ─────────────
export const MOCK_STATES: MockState[] = [
  {
    stateId: 'lagos',
    name: 'Lagos State',
    code: 'LA',
    coordinates: { latitude: 6.5244, longitude: 3.3792 },
    stats: { activePUs: 1240, offlinePUs: 87, completedPUs: 432, flaggedPUs: 12, totalVotesCast: 892450 },
    lgas: [
      {
        lgaId: 'lagos-island',
        stateId: 'lagos',
        name: 'Lagos Island',
        coordinates: { latitude: 6.4541, longitude: 3.3947 },
        stats: { activePUs: 186, offlinePUs: 8, completedPUs: 64, totalVotesCast: 124300 },
        wards: [
          {
            wardId: 'lagos-island-ward1',
            lgaId: 'lagos-island',
            stateId: 'lagos',
            name: 'Ward 1 - Epetedo',
            coordinates: { latitude: 6.4490, longitude: 3.3932 },
            pollingUnits: [
              {
                puId: 'LA/001/001/001',
                puCode: 'LA/001/001/001',
                name: 'Epetedo Primary School',
                wardId: 'lagos-island-ward1',
                lgaId: 'lagos-island',
                stateId: 'lagos',
                coordinates: { latitude: 6.4488, longitude: 3.3930 },
                status: 'active',
                registeredVoters: 823,
                accreditedVoters: 612,
                totalVotesCast: 589,
                assignedOfficerName: 'Adebayo Okafor',
                hasGuaranteedNetwork: true,
                networkType: 'lte',
                isFlagged: false,
                materialsDelivered: true,
              },
              {
                puId: 'LA/001/001/002',
                puCode: 'LA/001/001/002',
                name: 'Ereko Market Square',
                wardId: 'lagos-island-ward1',
                lgaId: 'lagos-island',
                stateId: 'lagos',
                coordinates: { latitude: 6.4501, longitude: 3.3958 },
                status: 'flagged',
                registeredVoters: 634,
                accreditedVoters: 0,
                totalVotesCast: 0,
                assignedOfficerName: 'Chinwe Eze',
                hasGuaranteedNetwork: false,
                networkType: 'offline_sync',
                isFlagged: true,
                materialsDelivered: false,
              },
            ],
          },
          {
            wardId: 'lagos-island-ward2',
            lgaId: 'lagos-island',
            stateId: 'lagos',
            name: 'Ward 2 - Lafiaji',
            coordinates: { latitude: 6.4560, longitude: 3.3980 },
            pollingUnits: [
              {
                puId: 'LA/001/002/001',
                puCode: 'LA/001/002/001',
                name: 'Lafiaji Community Hall',
                wardId: 'lagos-island-ward2',
                lgaId: 'lagos-island',
                stateId: 'lagos',
                coordinates: { latitude: 6.4562, longitude: 3.3981 },
                status: 'completed',
                registeredVoters: 971,
                accreditedVoters: 840,
                totalVotesCast: 812,
                assignedOfficerName: 'Ibrahim Musa',
                hasGuaranteedNetwork: true,
                networkType: 'fibre',
                isFlagged: false,
                materialsDelivered: true,
              },
            ],
          },
        ],
      },
      {
        lgaId: 'ikeja',
        stateId: 'lagos',
        name: 'Ikeja',
        coordinates: { latitude: 6.5954, longitude: 3.3378 },
        stats: { activePUs: 298, offlinePUs: 21, completedPUs: 98, totalVotesCast: 234100 },
        wards: [
          {
            wardId: 'ikeja-ward1',
            lgaId: 'ikeja',
            stateId: 'lagos',
            name: 'Ward 1 - Airport',
            coordinates: { latitude: 6.5774, longitude: 3.3217 },
            pollingUnits: [
              {
                puId: 'LA/002/001/001',
                puCode: 'LA/002/001/001',
                name: 'Airport Road Primary School',
                wardId: 'ikeja-ward1',
                lgaId: 'ikeja',
                stateId: 'lagos',
                coordinates: { latitude: 6.5773, longitude: 3.3216 },
                status: 'voting',
                registeredVoters: 1243,
                accreditedVoters: 987,
                totalVotesCast: 756,
                assignedOfficerName: 'Fatimah Abdullahi',
                hasGuaranteedNetwork: true,
                networkType: 'lte',
                isFlagged: false,
                materialsDelivered: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    stateId: 'kano',
    name: 'Kano State',
    code: 'KN',
    coordinates: { latitude: 12.0022, longitude: 8.5920 },
    stats: { activePUs: 2180, offlinePUs: 342, completedPUs: 678, flaggedPUs: 23, totalVotesCast: 1243800 },
    lgas: [
      {
        lgaId: 'kano-municipal',
        stateId: 'kano',
        name: 'Kano Municipal',
        coordinates: { latitude: 12.0022, longitude: 8.5920 },
        stats: { activePUs: 412, offlinePUs: 45, completedPUs: 128, totalVotesCast: 289400 },
        wards: [
          {
            wardId: 'kano-municipal-ward1',
            lgaId: 'kano-municipal',
            stateId: 'kano',
            name: 'Ward 1 - Dala',
            coordinates: { latitude: 12.0100, longitude: 8.5800 },
            pollingUnits: [
              {
                puId: 'KN/001/001/001',
                puCode: 'KN/001/001/001',
                name: 'Dala Primary School Unit A',
                wardId: 'kano-municipal-ward1',
                lgaId: 'kano-municipal',
                stateId: 'kano',
                coordinates: { latitude: 12.0099, longitude: 8.5798 },
                status: 'active',
                registeredVoters: 1456,
                accreditedVoters: 1102,
                totalVotesCast: 934,
                assignedOfficerName: 'Usman Yusuf',
                hasGuaranteedNetwork: true,
                networkType: 'satellite',
                isFlagged: false,
                materialsDelivered: true,
              },
              {
                puId: 'KN/001/001/002',
                puCode: 'KN/001/001/002',
                name: 'Dala Town Hall',
                wardId: 'kano-municipal-ward1',
                lgaId: 'kano-municipal',
                stateId: 'kano',
                coordinates: { latitude: 12.0112, longitude: 8.5812 },
                status: 'offline',
                registeredVoters: 989,
                accreditedVoters: 0,
                totalVotesCast: 0,
                assignedOfficerName: 'Amina Garba',
                hasGuaranteedNetwork: false,
                networkType: 'offline_sync',
                isFlagged: true,
                materialsDelivered: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    stateId: 'rivers',
    name: 'Rivers State',
    code: 'RV',
    coordinates: { latitude: 4.8156, longitude: 7.0498 },
    stats: { activePUs: 987, offlinePUs: 234, completedPUs: 321, flaggedPUs: 34, totalVotesCast: 678900 },
    lgas: [
      {
        lgaId: 'port-harcourt',
        stateId: 'rivers',
        name: 'Port Harcourt',
        coordinates: { latitude: 4.8156, longitude: 7.0498 },
        stats: { activePUs: 298, offlinePUs: 56, completedPUs: 89, totalVotesCast: 198400 },
        wards: [
          {
            wardId: 'ph-ward1',
            lgaId: 'port-harcourt',
            stateId: 'rivers',
            name: 'Ward 1 - GRA Phase 1',
            coordinates: { latitude: 4.8200, longitude: 7.0100 },
            pollingUnits: [
              {
                puId: 'RV/001/001/001',
                puCode: 'RV/001/001/001',
                name: 'GRA Primary School',
                wardId: 'ph-ward1',
                lgaId: 'port-harcourt',
                stateId: 'rivers',
                coordinates: { latitude: 4.8201, longitude: 7.0102 },
                status: 'collating',
                registeredVoters: 2134,
                accreditedVoters: 1876,
                totalVotesCast: 1743,
                assignedOfficerName: 'Emeka Obi',
                hasGuaranteedNetwork: true,
                networkType: 'fibre',
                isFlagged: false,
                materialsDelivered: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    stateId: 'abuja',
    name: 'FCT Abuja',
    code: 'FC',
    coordinates: { latitude: 9.0579, longitude: 7.4951 },
    stats: { activePUs: 456, offlinePUs: 34, completedPUs: 178, flaggedPUs: 5, totalVotesCast: 312400 },
    lgas: [
      {
        lgaId: 'abuja-municipal',
        stateId: 'abuja',
        name: 'Abuja Municipal Area Council',
        coordinates: { latitude: 9.0579, longitude: 7.4951 },
        stats: { activePUs: 189, offlinePUs: 12, completedPUs: 67, totalVotesCast: 134500 },
        wards: [
          {
            wardId: 'amac-ward1',
            lgaId: 'abuja-municipal',
            stateId: 'abuja',
            name: 'Ward 1 - Garki',
            coordinates: { latitude: 9.0198, longitude: 7.4892 },
            pollingUnits: [
              {
                puId: 'FC/001/001/001',
                puCode: 'FC/001/001/001',
                name: 'Garki Model Primary School',
                wardId: 'amac-ward1',
                lgaId: 'abuja-municipal',
                stateId: 'abuja',
                coordinates: { latitude: 9.0197, longitude: 7.4891 },
                status: 'submitted',
                registeredVoters: 1876,
                accreditedVoters: 1654,
                totalVotesCast: 1598,
                assignedOfficerName: 'Blessing Nwosu',
                hasGuaranteedNetwork: true,
                networkType: 'fibre',
                isFlagged: false,
                materialsDelivered: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    stateId: 'kogi',
    name: 'Kogi State',
    code: 'KO',
    coordinates: { latitude: 7.7337, longitude: 6.6906 },
    stats: { activePUs: 756, offlinePUs: 189, completedPUs: 234, flaggedPUs: 18, totalVotesCast: 445600 },
    lgas: [
      {
        lgaId: 'lokoja',
        stateId: 'kogi',
        name: 'Lokoja',
        coordinates: { latitude: 7.8026, longitude: 6.7437 },
        stats: { activePUs: 156, offlinePUs: 45, completedPUs: 67, totalVotesCast: 98700 },
        wards: [
          {
            wardId: 'lokoja-ward1',
            lgaId: 'lokoja',
            stateId: 'kogi',
            name: 'Ward 1 - Ganaja',
            coordinates: { latitude: 7.8100, longitude: 6.7500 },
            pollingUnits: [
              {
                puId: 'KO/001/001/001',
                puCode: 'KO/001/001/001',
                name: 'Ganaja Village Primary School',
                wardId: 'lokoja-ward1',
                lgaId: 'lokoja',
                stateId: 'kogi',
                coordinates: { latitude: 7.8101, longitude: 6.7501 },
                status: 'pending',
                registeredVoters: 678,
                accreditedVoters: 0,
                totalVotesCast: 0,
                assignedOfficerName: 'Yahaya Adamu',
                hasGuaranteedNetwork: false,
                networkType: 'satellite',
                isFlagged: false,
                materialsDelivered: false,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    stateId: 'anambra',
    name: 'Anambra State',
    code: 'AN',
    coordinates: { latitude: 6.2104, longitude: 7.0678 },
    stats: { activePUs: 892, offlinePUs: 123, completedPUs: 312, flaggedPUs: 9, totalVotesCast: 567800 },
    lgas: [
      {
        lgaId: 'awka-south',
        stateId: 'anambra',
        name: 'Awka South',
        coordinates: { latitude: 6.2104, longitude: 7.0678 },
        stats: { activePUs: 187, offlinePUs: 23, completedPUs: 67, totalVotesCast: 112400 },
        wards: [
          {
            wardId: 'awka-ward1',
            lgaId: 'awka-south',
            stateId: 'anambra',
            name: 'Ward 1 - Awka Central',
            coordinates: { latitude: 6.2140, longitude: 7.0700 },
            pollingUnits: [
              {
                puId: 'AN/001/001/001',
                puCode: 'AN/001/001/001',
                name: 'Awka Township Primary School',
                wardId: 'awka-ward1',
                lgaId: 'awka-south',
                stateId: 'anambra',
                coordinates: { latitude: 6.2141, longitude: 7.0701 },
                status: 'active',
                registeredVoters: 1234,
                accreditedVoters: 989,
                totalVotesCast: 834,
                assignedOfficerName: 'Ngozi Okonkwo',
                hasGuaranteedNetwork: true,
                networkType: 'lte',
                isFlagged: false,
                materialsDelivered: true,
              },
            ],
          },
        ],
      },
    ],
  },
]

// ─── MOCK FLEET VEHICLES ──────────────────────────────────────────────────────
export const MOCK_VEHICLES: MockVehicle[] = [
  {
    vehicleId: 'v001',
    vehicleReg: 'LAG-234-KA',
    driverName: 'Tunde Bakare',
    currentCoordinates: { latitude: 6.5244, longitude: 3.3792 },
    status: 'in_transit',
    assignedWards: ['lagos-island-ward1', 'lagos-island-ward2'],
    stateId: 'lagos',
    lgaId: 'lagos-island',
    speedKph: 42,
    heading: 135,
    lastUpdated: new Date(),
    isFlagged: false,
  },
  {
    vehicleId: 'v002',
    vehicleReg: 'KNO-087-BN',
    driverName: 'Musa Aliyu',
    currentCoordinates: { latitude: 12.0150, longitude: 8.6020 },
    status: 'delivered',
    assignedWards: ['kano-municipal-ward1'],
    stateId: 'kano',
    lgaId: 'kano-municipal',
    speedKph: 0,
    heading: 0,
    lastUpdated: new Date(),
    isFlagged: false,
  },
  {
    vehicleId: 'v003',
    vehicleReg: 'RVS-456-CM',
    driverName: 'Chukwudi Nwachukwu',
    currentCoordinates: { latitude: 4.8300, longitude: 7.0600 },
    status: 'flagged',
    assignedWards: ['ph-ward1'],
    stateId: 'rivers',
    lgaId: 'port-harcourt',
    speedKph: 0,
    heading: 270,
    lastUpdated: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
    isFlagged: true,
  },
  {
    vehicleId: 'v004',
    vehicleReg: 'FCT-112-AD',
    driverName: 'James Okeke',
    currentCoordinates: { latitude: 9.0400, longitude: 7.4700 },
    status: 'dispatched',
    assignedWards: ['amac-ward1'],
    stateId: 'abuja',
    lgaId: 'abuja-municipal',
    speedKph: 67,
    heading: 45,
    lastUpdated: new Date(),
    isFlagged: false,
  },
  {
    vehicleId: 'v005',
    vehicleReg: 'KOG-789-LJ',
    driverName: 'Sule Ibrahim',
    currentCoordinates: { latitude: 7.7900, longitude: 6.7200 },
    status: 'in_transit',
    assignedWards: ['lokoja-ward1'],
    stateId: 'kogi',
    lgaId: 'lokoja',
    speedKph: 55,
    heading: 200,
    lastUpdated: new Date(),
    isFlagged: false,
  },
]

// ─── MOCK INCIDENTS ───────────────────────────────────────────────────────────
export const MOCK_INCIDENTS: MockIncident[] = [
  {
    incidentId: 'inc001',
    title: 'Unauthorized persons near PU',
    description: 'Three unidentified individuals loitering near the entrance of polling unit for over 30 minutes. Voters expressing concern.',
    severity: 'high',
    category: 'violence',
    status: 'open',
    officerName: 'Chinwe Eze',
    puId: 'LA/001/001/002',
    stateId: 'lagos',
    lgaId: 'lagos-island',
    coordinates: { latitude: 6.4501, longitude: 3.3958 },
    reportedAt: new Date(Date.now() - 23 * 60 * 1000),
    imageUrls: [],
  },
  {
    incidentId: 'inc002',
    title: 'BVAS Device Malfunction',
    description: 'Biometric verification device showing "Device Error 0x04". Unable to accredit voters. Manual override requested.',
    severity: 'critical',
    category: 'equipment_failure',
    status: 'acknowledged',
    officerName: 'Amina Garba',
    puId: 'KN/001/001/002',
    stateId: 'kano',
    lgaId: 'kano-municipal',
    coordinates: { latitude: 12.0112, longitude: 8.5812 },
    reportedAt: new Date(Date.now() - 67 * 60 * 1000),
    imageUrls: [],
  },
  {
    incidentId: 'inc003',
    title: 'Insufficient Ballot Papers',
    description: 'Ward 1 polling unit exhausted all 823 allocated ballot papers with 112 accredited voters still waiting.',
    severity: 'high',
    category: 'material_shortage',
    status: 'open',
    officerName: 'Fatimah Abdullahi',
    puId: 'LA/002/001/001',
    stateId: 'lagos',
    lgaId: 'ikeja',
    coordinates: { latitude: 6.5773, longitude: 3.3216 },
    reportedAt: new Date(Date.now() - 12 * 60 * 1000),
    imageUrls: [],
  },
]

// ─── MOCK AI ALERTS ───────────────────────────────────────────────────────────
export const MOCK_ALERTS: MockAlert[] = [
  {
    alertId: 'al001',
    alertType: 'vehicle_stationary',
    severity: 'high',
    title: 'Vehicle RVS-456-CM Stationary 47min',
    message: 'Dispatch vehicle RVS-456-CM has been stationary for 47 minutes at Port Harcourt. Expected delivery to Ward 1 is 23 minutes overdue.',
    createdAt: new Date(Date.now() - 2 * 60 * 1000),
    isRead: false,
    stateId: 'rivers',
    relatedEntityType: 'vehicle',
  },
  {
    alertId: 'al002',
    alertType: 'offline_pu',
    severity: 'medium',
    title: '234 Polling Units Currently Offline',
    message: 'Rivers State showing elevated offline PU count (234). Predominantly in Degema and Bonny LGAs — likely network blackspot zones.',
    createdAt: new Date(Date.now() - 8 * 60 * 1000),
    isRead: false,
    stateId: 'rivers',
    relatedEntityType: 'pu',
  },
  {
    alertId: 'al003',
    alertType: 'late_submission',
    severity: 'medium',
    title: 'Late Result Submission Detected',
    message: 'PU KO/001/001/001 (Ganaja) submitted results 2 hours 14 minutes after official close of polls. Flagged for review.',
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    isRead: true,
    stateId: 'kogi',
    relatedEntityType: 'vote_log',
  },
  {
    alertId: 'al004',
    alertType: 'result_anomaly',
    severity: 'critical',
    title: 'Result Anomaly: Votes Exceed Accredited',
    message: 'LA/001/002/001 submitted 812 total votes but only 840 accredited voters recorded — ratio acceptable but near threshold.',
    createdAt: new Date(Date.now() - 31 * 60 * 1000),
    isRead: false,
    stateId: 'lagos',
    relatedEntityType: 'vote_log',
  },
  {
    alertId: 'al005',
    alertType: 'incident_report',
    severity: 'critical',
    title: 'New Critical Incident: Equipment Failure',
    message: 'BVAS device failure reported at KN/001/001/002. Officer Amina Garba awaiting technical support response.',
    createdAt: new Date(Date.now() - 67 * 60 * 1000),
    isRead: true,
    stateId: 'kano',
    relatedEntityType: 'pu',
  },
]

// ─── NATIONAL STATS ───────────────────────────────────────────────────────────
export const NATIONAL_STATS = {
  totalPUs: 176846,
  totalLGAs: 774,
  totalStates: 37, // 36 + FCT
  totalRegisteredVoters: 93469008,
  // Live counters
  activePUs: 6511,
  offlinePUs: 1009,
  completedPUs: 2155,
  pendingPUs: 167171,
  flaggedPUs: 101,
  totalVotesCast: 4140950,
  // Vehicles
  totalVehicles: 3420,
  vehiclesInTransit: 1234,
  vehiclesDelivered: 1987,
  vehiclesFlagged: 12,
}

// ─── HELPER: flatten all PUs from mock states ─────────────────────────────────
export function getAllMockPUs(): MockPU[] {
  return MOCK_STATES.flatMap((s) =>
    s.lgas.flatMap((l) =>
      l.wards.flatMap((w) => w.pollingUnits)
    )
  )
}

export function getAllMockWards() {
  return MOCK_STATES.flatMap((s) =>
    s.lgas.flatMap((l) => l.wards)
  )
}
