// src/firebase/mockData.ts
// ─────────────────────────────────────────────────────────────────────────────
// INEC 2.0 — Complete Nigeria Electoral Data (All 37 States)
// This is the demo/fallback data used before Firebase seeder is run
// ─────────────────────────────────────────────────────────────────────────────

export interface MockPU {
  puId: string
  puCode: string
  name: string
  wardId: string
  lgaId: string
  stateId: string
  coordinates: { latitude: number; longitude: number }
  status: 'pending' | 'active' | 'voting' | 'collating' | 'submitted' | 'completed' | 'offline' | 'flagged'
  registeredVoters: number
  accreditedVoters: number
  totalVotesCast: number
  assignedOfficerName: string
  hasGuaranteedNetwork: boolean
  networkType: 'fibre' | 'lte' | 'satellite' | 'offline_sync'
  isFlagged: boolean
  materialsDelivered: boolean
}

export interface MockWard {
  wardId: string
  lgaId: string
  stateId: string
  name: string
  coordinates: { latitude: number; longitude: number }
  pollingUnits: MockPU[]
}

export interface MockLGA {
  lgaId: string
  stateId: string
  name: string
  coordinates: { latitude: number; longitude: number }
  wards: MockWard[]
  stats: { activePUs: number; offlinePUs: number; completedPUs: number; totalVotesCast: number }
}

export interface MockState {
  stateId: string
  name: string
  code: string
  coordinates: { latitude: number; longitude: number }
  lgas: MockLGA[]
  stats: { activePUs: number; offlinePUs: number; completedPUs: number; flaggedPUs: number; totalVotesCast: number }
}

// ─── All 37 States with coordinates ──────────────────────────────────────────
export const MOCK_STATES: MockState[] = [
  { stateId: 'abia',        name: 'Abia State',        code: 'AB', coordinates: { latitude: 5.4527,  longitude: 7.5248  }, lgas: [], stats: { activePUs: 312,  offlinePUs: 45,  completedPUs: 120, flaggedPUs: 3,  totalVotesCast: 198400  } },
  { stateId: 'adamawa',     name: 'Adamawa State',     code: 'AD', coordinates: { latitude: 9.3265,  longitude: 12.3984 }, lgas: [], stats: { activePUs: 289,  offlinePUs: 78,  completedPUs: 98,  flaggedPUs: 5,  totalVotesCast: 167300  } },
  { stateId: 'akwa_ibom',   name: 'Akwa Ibom State',   code: 'AK', coordinates: { latitude: 5.0077,  longitude: 7.8537  }, lgas: [], stats: { activePUs: 421,  offlinePUs: 56,  completedPUs: 189, flaggedPUs: 4,  totalVotesCast: 289600  } },
  { stateId: 'anambra',     name: 'Anambra State',     code: 'AN', coordinates: { latitude: 6.2104,  longitude: 7.0678  }, lgas: [], stats: { activePUs: 398,  offlinePUs: 67,  completedPUs: 201, flaggedPUs: 6,  totalVotesCast: 312400  } },
  { stateId: 'bauchi',      name: 'Bauchi State',      code: 'BA', coordinates: { latitude: 10.3158, longitude: 9.8442  }, lgas: [], stats: { activePUs: 445,  offlinePUs: 123, completedPUs: 167, flaggedPUs: 8,  totalVotesCast: 287600  } },
  { stateId: 'bayelsa',     name: 'Bayelsa State',     code: 'BY', coordinates: { latitude: 4.9267,  longitude: 6.2676  }, lgas: [], stats: { activePUs: 178,  offlinePUs: 89,  completedPUs: 67,  flaggedPUs: 7,  totalVotesCast: 112300  } },
  { stateId: 'benue',       name: 'Benue State',       code: 'BE', coordinates: { latitude: 7.1907,  longitude: 8.1299  }, lgas: [], stats: { activePUs: 423,  offlinePUs: 98,  completedPUs: 189, flaggedPUs: 5,  totalVotesCast: 267800  } },
  { stateId: 'borno',       name: 'Borno State',       code: 'BO', coordinates: { latitude: 11.8333, longitude: 13.1500 }, lgas: [], stats: { activePUs: 367,  offlinePUs: 234, completedPUs: 112, flaggedPUs: 12, totalVotesCast: 198700  } },
  { stateId: 'cross_river', name: 'Cross River State', code: 'CR', coordinates: { latitude: 5.8702,  longitude: 8.5988  }, lgas: [], stats: { activePUs: 278,  offlinePUs: 67,  completedPUs: 134, flaggedPUs: 4,  totalVotesCast: 187600  } },
  { stateId: 'delta',       name: 'Delta State',       code: 'DE', coordinates: { latitude: 5.5320,  longitude: 5.8987  }, lgas: [], stats: { activePUs: 489,  offlinePUs: 78,  completedPUs: 234, flaggedPUs: 6,  totalVotesCast: 334500  } },
  { stateId: 'ebonyi',      name: 'Ebonyi State',      code: 'EB', coordinates: { latitude: 6.2649,  longitude: 8.0137  }, lgas: [], stats: { activePUs: 223,  offlinePUs: 45,  completedPUs: 98,  flaggedPUs: 3,  totalVotesCast: 145600  } },
  { stateId: 'edo',         name: 'Edo State',         code: 'ED', coordinates: { latitude: 6.3350,  longitude: 5.6037  }, lgas: [], stats: { activePUs: 378,  offlinePUs: 56,  completedPUs: 178, flaggedPUs: 5,  totalVotesCast: 256700  } },
  { stateId: 'ekiti',       name: 'Ekiti State',       code: 'EK', coordinates: { latitude: 7.7190,  longitude: 5.3110  }, lgas: [], stats: { activePUs: 198,  offlinePUs: 34,  completedPUs: 89,  flaggedPUs: 2,  totalVotesCast: 128900  } },
  { stateId: 'enugu',       name: 'Enugu State',       code: 'EN', coordinates: { latitude: 6.4584,  longitude: 7.5464  }, lgas: [], stats: { activePUs: 334,  offlinePUs: 56,  completedPUs: 156, flaggedPUs: 4,  totalVotesCast: 223400  } },
  { stateId: 'abuja',       name: 'FCT Abuja',         code: 'FC', coordinates: { latitude: 9.0579,  longitude: 7.4951  }, lgas: [], stats: { activePUs: 456,  offlinePUs: 34,  completedPUs: 178, flaggedPUs: 5,  totalVotesCast: 312400  } },
  { stateId: 'gombe',       name: 'Gombe State',       code: 'GO', coordinates: { latitude: 10.2904, longitude: 11.1673 }, lgas: [], stats: { activePUs: 234,  offlinePUs: 67,  completedPUs: 89,  flaggedPUs: 3,  totalVotesCast: 156700  } },
  { stateId: 'imo',         name: 'Imo State',         code: 'IM', coordinates: { latitude: 5.4921,  longitude: 7.0263  }, lgas: [], stats: { activePUs: 389,  offlinePUs: 78,  completedPUs: 167, flaggedPUs: 6,  totalVotesCast: 267800  } },
  { stateId: 'jigawa',      name: 'Jigawa State',      code: 'JI', coordinates: { latitude: 12.2280, longitude: 9.5616  }, lgas: [], stats: { activePUs: 367,  offlinePUs: 89,  completedPUs: 134, flaggedPUs: 4,  totalVotesCast: 212300  } },
  { stateId: 'kaduna',      name: 'Kaduna State',      code: 'KD', coordinates: { latitude: 10.5222, longitude: 7.4383  }, lgas: [], stats: { activePUs: 678,  offlinePUs: 145, completedPUs: 289, flaggedPUs: 9,  totalVotesCast: 478900  } },
  { stateId: 'kano',        name: 'Kano State',        code: 'KN', coordinates: { latitude: 12.0022, longitude: 8.5920  }, lgas: [], stats: { activePUs: 987,  offlinePUs: 234, completedPUs: 445, flaggedPUs: 15, totalVotesCast: 789600  } },
  { stateId: 'katsina',     name: 'Katsina State',     code: 'KT', coordinates: { latitude: 12.9816, longitude: 7.6178  }, lgas: [], stats: { activePUs: 534,  offlinePUs: 123, completedPUs: 223, flaggedPUs: 7,  totalVotesCast: 356700  } },
  { stateId: 'kebbi',       name: 'Kebbi State',       code: 'KB', coordinates: { latitude: 12.4539, longitude: 4.1975  }, lgas: [], stats: { activePUs: 312,  offlinePUs: 89,  completedPUs: 134, flaggedPUs: 4,  totalVotesCast: 198700  } },
  { stateId: 'kogi',        name: 'Kogi State',        code: 'KO', coordinates: { latitude: 7.7337,  longitude: 6.6906  }, lgas: [], stats: { activePUs: 289,  offlinePUs: 78,  completedPUs: 112, flaggedPUs: 5,  totalVotesCast: 187600  } },
  { stateId: 'kwara',       name: 'Kwara State',       code: 'KW', coordinates: { latitude: 8.9669,  longitude: 4.3874  }, lgas: [], stats: { activePUs: 234,  offlinePUs: 56,  completedPUs: 98,  flaggedPUs: 3,  totalVotesCast: 156700  } },
  { stateId: 'lagos',       name: 'Lagos State',       code: 'LA', coordinates: { latitude: 6.5244,  longitude: 3.3792  }, lgas: [], stats: { activePUs: 1240, offlinePUs: 87,  completedPUs: 432, flaggedPUs: 12, totalVotesCast: 892450  } },
  { stateId: 'nasarawa',    name: 'Nasarawa State',    code: 'NA', coordinates: { latitude: 8.5378,  longitude: 8.3235  }, lgas: [], stats: { activePUs: 256,  offlinePUs: 67,  completedPUs: 98,  flaggedPUs: 4,  totalVotesCast: 167800  } },
  { stateId: 'niger',       name: 'Niger State',       code: 'NI', coordinates: { latitude: 9.9309,  longitude: 5.5983  }, lgas: [], stats: { activePUs: 412,  offlinePUs: 98,  completedPUs: 167, flaggedPUs: 5,  totalVotesCast: 267900  } },
  { stateId: 'ogun',        name: 'Ogun State',        code: 'OG', coordinates: { latitude: 7.1600,  longitude: 3.3500  }, lgas: [], stats: { activePUs: 423,  offlinePUs: 67,  completedPUs: 189, flaggedPUs: 4,  totalVotesCast: 289600  } },
  { stateId: 'ondo',        name: 'Ondo State',        code: 'ON', coordinates: { latitude: 7.2500,  longitude: 5.1950  }, lgas: [], stats: { activePUs: 323,  offlinePUs: 78,  completedPUs: 145, flaggedPUs: 5,  totalVotesCast: 212300  } },
  { stateId: 'osun',        name: 'Osun State',        code: 'OS', coordinates: { latitude: 7.7827,  longitude: 4.5418  }, lgas: [], stats: { activePUs: 312,  offlinePUs: 56,  completedPUs: 134, flaggedPUs: 3,  totalVotesCast: 198700  } },
  { stateId: 'oyo',         name: 'Oyo State',         code: 'OY', coordinates: { latitude: 8.1574,  longitude: 3.6147  }, lgas: [], stats: { activePUs: 534,  offlinePUs: 89,  completedPUs: 223, flaggedPUs: 6,  totalVotesCast: 356700  } },
  { stateId: 'plateau',     name: 'Plateau State',     code: 'PL', coordinates: { latitude: 9.2182,  longitude: 9.5178  }, lgas: [], stats: { activePUs: 412,  offlinePUs: 112, completedPUs: 178, flaggedPUs: 7,  totalVotesCast: 267800  } },
  { stateId: 'rivers',      name: 'Rivers State',      code: 'RV', coordinates: { latitude: 4.8156,  longitude: 7.0498  }, lgas: [], stats: { activePUs: 567,  offlinePUs: 178, completedPUs: 234, flaggedPUs: 11, totalVotesCast: 412300  } },
  { stateId: 'sokoto',      name: 'Sokoto State',      code: 'SO', coordinates: { latitude: 13.0059, longitude: 5.2476  }, lgas: [], stats: { activePUs: 323,  offlinePUs: 89,  completedPUs: 134, flaggedPUs: 4,  totalVotesCast: 198700  } },
  { stateId: 'taraba',      name: 'Taraba State',      code: 'TA', coordinates: { latitude: 8.8938,  longitude: 11.3594 }, lgas: [], stats: { activePUs: 289,  offlinePUs: 98,  completedPUs: 112, flaggedPUs: 5,  totalVotesCast: 178900  } },
  { stateId: 'yobe',        name: 'Yobe State',        code: 'YO', coordinates: { latitude: 12.2939, longitude: 11.4390 }, lgas: [], stats: { activePUs: 223,  offlinePUs: 89,  completedPUs: 89,  flaggedPUs: 4,  totalVotesCast: 145600  } },
  { stateId: 'zamfara',     name: 'Zamfara State',     code: 'ZA', coordinates: { latitude: 12.1700, longitude: 6.6600  }, lgas: [], stats: { activePUs: 278,  offlinePUs: 89,  completedPUs: 112, flaggedPUs: 5,  totalVotesCast: 178900  } },
]

export interface MockVehicle {
  vehicleId: string
  vehicleReg: string
  driverName: string
  currentCoordinates: { latitude: number; longitude: number }
  status: 'idle' | 'dispatched' | 'in_transit' | 'delivered' | 'delayed' | 'flagged'
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
  severity: 'low' | 'medium' | 'high' | 'critical'
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
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  createdAt: Date
  isRead: boolean
  stateId: string
  relatedEntityType: string
}

export const MOCK_VEHICLES: MockVehicle[] = [
  { vehicleId: 'v001', vehicleReg: 'LAG-234-KA', driverName: 'Tunde Bakare',       currentCoordinates: { latitude: 6.5244,  longitude: 3.3792  }, status: 'in_transit', assignedWards: ['lagos-island-ward1'], stateId: 'lagos',   lgaId: 'lagos-island',    speedKph: 42, heading: 135, lastUpdated: new Date(), isFlagged: false },
  { vehicleId: 'v002', vehicleReg: 'KNO-087-BN', driverName: 'Musa Aliyu',         currentCoordinates: { latitude: 12.0150, longitude: 8.6020  }, status: 'delivered',  assignedWards: ['kano-ward1'],         stateId: 'kano',    lgaId: 'kano-municipal',  speedKph: 0,  heading: 0,   lastUpdated: new Date(), isFlagged: false },
  { vehicleId: 'v003', vehicleReg: 'RVS-456-CM', driverName: 'Chukwudi Nwachukwu', currentCoordinates: { latitude: 4.8300,  longitude: 7.0600  }, status: 'flagged',    assignedWards: ['ph-ward1'],           stateId: 'rivers',  lgaId: 'port-harcourt',   speedKph: 0,  heading: 270, lastUpdated: new Date(Date.now() - 45 * 60 * 1000), isFlagged: true },
  { vehicleId: 'v004', vehicleReg: 'FCT-112-AD', driverName: 'James Okeke',        currentCoordinates: { latitude: 9.0400,  longitude: 7.4700  }, status: 'dispatched', assignedWards: ['amac-ward1'],         stateId: 'abuja',   lgaId: 'abuja-municipal', speedKph: 67, heading: 45,  lastUpdated: new Date(), isFlagged: false },
  { vehicleId: 'v005', vehicleReg: 'KOG-789-LJ', driverName: 'Sule Ibrahim',       currentCoordinates: { latitude: 7.7900,  longitude: 6.7200  }, status: 'in_transit', assignedWards: ['lokoja-ward1'],       stateId: 'kogi',    lgaId: 'lokoja',          speedKph: 55, heading: 200, lastUpdated: new Date(), isFlagged: false },
  { vehicleId: 'v006', vehicleReg: 'LAG-567-XY', driverName: 'Adaeze Okonkwo',    currentCoordinates: { latitude: 6.4500,  longitude: 3.4000  }, status: 'in_transit', assignedWards: ['lagos-island-ward2'], stateId: 'lagos',   lgaId: 'ikeja',           speedKph: 38, heading: 90,  lastUpdated: new Date(), isFlagged: false },
  { vehicleId: 'v007', vehicleReg: 'KAD-321-MN', driverName: 'Ibrahim Sani',       currentCoordinates: { latitude: 10.5000, longitude: 7.4200  }, status: 'dispatched', assignedWards: ['kaduna-ward1'],       stateId: 'kaduna',  lgaId: 'kaduna-north',    speedKph: 72, heading: 180, lastUpdated: new Date(), isFlagged: false },
  { vehicleId: 'v008', vehicleReg: 'OYO-456-AB', driverName: 'Taiwo Adeleke',      currentCoordinates: { latitude: 8.1500,  longitude: 3.6000  }, status: 'in_transit', assignedWards: ['oyo-ward1'],          stateId: 'oyo',     lgaId: 'ibadan-north',    speedKph: 45, heading: 270, lastUpdated: new Date(), isFlagged: false },
]

export const MOCK_INCIDENTS: MockIncident[] = [
  {
    incidentId: 'inc001',
    title: 'Unauthorized persons near PU',
    description: 'Three unidentified individuals loitering near the entrance of polling unit for over 30 minutes. Voters expressing concern.',
    severity: 'high', category: 'violence', status: 'open',
    officerName: 'Chinwe Eze', puId: 'LA/001/001/002', stateId: 'lagos', lgaId: 'lagos-island',
    coordinates: { latitude: 6.4501, longitude: 3.3958 },
    reportedAt: new Date(Date.now() - 23 * 60 * 1000), imageUrls: [],
  },
  {
    incidentId: 'inc002',
    title: 'BVAS Device Malfunction',
    description: 'Biometric verification device showing "Device Error 0x04". Unable to accredit voters. Manual override requested.',
    severity: 'critical', category: 'equipment_failure', status: 'acknowledged',
    officerName: 'Amina Garba', puId: 'KN/001/001/002', stateId: 'kano', lgaId: 'kano-municipal',
    coordinates: { latitude: 12.0112, longitude: 8.5812 },
    reportedAt: new Date(Date.now() - 67 * 60 * 1000), imageUrls: [],
  },
  {
    incidentId: 'inc003',
    title: 'Insufficient Ballot Papers',
    description: 'Ward 1 polling unit exhausted all 823 allocated ballot papers with 112 accredited voters still waiting.',
    severity: 'high', category: 'material_shortage', status: 'open',
    officerName: 'Fatimah Abdullahi', puId: 'LA/002/001/001', stateId: 'lagos', lgaId: 'ikeja',
    coordinates: { latitude: 6.5773, longitude: 3.3216 },
    reportedAt: new Date(Date.now() - 12 * 60 * 1000), imageUrls: [],
  },
]

export const MOCK_ALERTS: MockAlert[] = [
  { alertId: 'al001', alertType: 'vehicle_stationary', severity: 'high',     title: 'Vehicle RVS-456-CM Stationary 47min',        message: 'Dispatch vehicle RVS-456-CM has been stationary for 47 minutes at Port Harcourt. Expected delivery to Ward 1 is 23 minutes overdue.', createdAt: new Date(Date.now() - 2 * 60 * 1000),  isRead: false, stateId: 'rivers', relatedEntityType: 'vehicle'  },
  { alertId: 'al002', alertType: 'offline_pu',          severity: 'medium',   title: '234 Polling Units Currently Offline',        message: 'Rivers State showing elevated offline PU count (234). Predominantly in Degema and Bonny LGAs — likely network blackspot zones.',        createdAt: new Date(Date.now() - 8 * 60 * 1000),  isRead: false, stateId: 'rivers', relatedEntityType: 'pu'       },
  { alertId: 'al003', alertType: 'late_submission',     severity: 'medium',   title: 'Late Result Submission Detected',            message: 'PU KO/001/001/001 (Ganaja) submitted results 2 hours 14 minutes after official close of polls. Flagged for review.',                   createdAt: new Date(Date.now() - 15 * 60 * 1000), isRead: true,  stateId: 'kogi',   relatedEntityType: 'vote_log' },
  { alertId: 'al004', alertType: 'result_anomaly',      severity: 'critical', title: 'Result Anomaly: Votes Exceed Accredited',    message: 'LA/001/002/001 submitted 812 total votes but only 840 accredited voters recorded — ratio near threshold. Flagged for verification.',       createdAt: new Date(Date.now() - 31 * 60 * 1000), isRead: false, stateId: 'lagos',  relatedEntityType: 'vote_log' },
  { alertId: 'al005', alertType: 'incident_report',     severity: 'critical', title: 'New Critical Incident: Equipment Failure',   message: 'BVAS device failure reported at KN/001/001/002. Officer Amina Garba awaiting technical support response.',                                createdAt: new Date(Date.now() - 67 * 60 * 1000), isRead: true,  stateId: 'kano',   relatedEntityType: 'pu'       },
]

export const NATIONAL_STATS = {
  totalPUs: 176846,
  totalLGAs: 774,
  totalWards: 8793,
  totalStates: 37,
  totalRegisteredVoters: 93469008,
  activePUs: 16511,
  offlinePUs: 3009,
  completedPUs: 5155,
  pendingPUs: 152171,
  flaggedPUs: 201,
  totalVotesCast: 11140950,
  totalVehicles: 3420,
  vehiclesInTransit: 1234,
  vehiclesDelivered: 1987,
  vehiclesFlagged: 12,
}

export function getAllMockPUs(): MockPU[] {
  // Generate representative PUs for all 37 states
  return MOCK_STATES.flatMap(state => [
    {
      puId: `${state.stateId}-001`,
      puCode: `${state.code}/001/001/001`,
      name: `${state.name.split(' ')[0]} Central Primary School`,
      wardId: `${state.stateId}-ward-1`,
      lgaId: `${state.stateId}-lga-1`,
      stateId: state.stateId,
      coordinates: {
        latitude: state.coordinates.latitude + (Math.random() - 0.5) * 0.1,
        longitude: state.coordinates.longitude + (Math.random() - 0.5) * 0.1,
      },
      status: ['active', 'voting', 'completed', 'offline', 'pending'][Math.floor(Math.random() * 5)] as MockPU['status'],
      registeredVoters: Math.floor(Math.random() * 1500) + 500,
      accreditedVoters: Math.floor(Math.random() * 1000) + 200,
      totalVotesCast: Math.floor(Math.random() * 800) + 100,
      assignedOfficerName: 'Field Officer',
      hasGuaranteedNetwork: Math.random() > 0.3,
      networkType: 'lte' as const,
      isFlagged: Math.random() > 0.95,
      materialsDelivered: Math.random() > 0.2,
    }
  ])
}

export function getAllMockWards() {
  return MOCK_STATES.flatMap(state => ({
    wardId: `${state.stateId}-ward-1`,
    lgaId: `${state.stateId}-lga-1`,
    stateId: state.stateId,
    name: `Ward 1 - ${state.name.split(' ')[0]} Central`,
    coordinates: state.coordinates,
    pollingUnits: [],
  }))
}
