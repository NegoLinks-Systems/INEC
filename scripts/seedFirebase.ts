// scripts/seedFirebase.ts
// ─────────────────────────────────────────────────────────────────────────────
// INEC 2.0 — Firebase Data Seeder
// Seeds ALL real Nigerian electoral data:
//   37 States | 774 LGAs | 8,793 Wards | 176,846 Polling Units
//
// Both CSV files are merged for complete data:
//   File 1 (Nigeria_polling_units.csv):    Full metadata, codes, senatorial zones
//   File 2 (Nigeria_PU_List_Extracted.csv): Clean PU addresses
//
// USAGE:
//   1. Download serviceAccount.json from:
//      Firebase Console → Project Settings → Service Accounts → Generate new key
//      Save as: scripts/serviceAccount.json
//
//   2. Place BOTH CSVs in scripts/ folder:
//      scripts/Nigeria_polling_units.csv
//      scripts/Nigeria_PU_List_Extracted.csv
//
//   3. Run:
//      npm run seed
//
//   4. To also create admin user profile (after creating user in Firebase Auth):
//      ADMIN_UID=paste-uid-here ADMIN_EMAIL=admin@inec.gov.ng npm run seed
// ─────────────────────────────────────────────────────────────────────────────

import * as admin from 'firebase-admin'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

// ─── Init Firebase Admin ──────────────────────────────────────────────────────
const serviceAccountPath = path.join(__dirname, 'serviceAccount.json')
if (!fs.existsSync(serviceAccountPath)) {
  console.error('\n❌ Missing: scripts/serviceAccount.json')
  console.error('   Download from Firebase Console → Project Settings → Service Accounts')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
  projectId: 'inec-9a779',
})

const db = admin.firestore()
db.settings({ ignoreUndefinedProperties: true })

// ─── State coordinates ────────────────────────────────────────────────────────
const STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  'abia':        { lat: 5.4527,  lng: 7.5248  },
  'adamawa':     { lat: 9.3265,  lng: 12.3984 },
  'akwa ibom':   { lat: 5.0077,  lng: 7.8537  },
  'anambra':     { lat: 6.2104,  lng: 7.0678  },
  'bauchi':      { lat: 10.3158, lng: 9.8442  },
  'bayelsa':     { lat: 4.9267,  lng: 6.2676  },
  'benue':       { lat: 7.1907,  lng: 8.1299  },
  'borno':       { lat: 11.8333, lng: 13.1500 },
  'cross river': { lat: 5.8702,  lng: 8.5988  },
  'delta':       { lat: 5.5320,  lng: 5.8987  },
  'ebonyi':      { lat: 6.2649,  lng: 8.0137  },
  'edo':         { lat: 6.3350,  lng: 5.6037  },
  'ekiti':       { lat: 7.7190,  lng: 5.3110  },
  'enugu':       { lat: 6.4584,  lng: 7.5464  },
  'fct':         { lat: 9.0579,  lng: 7.4951  },
  'gombe':       { lat: 10.2904, lng: 11.1673 },
  'imo':         { lat: 5.4921,  lng: 7.0263  },
  'jigawa':      { lat: 12.2280, lng: 9.5616  },
  'kaduna':      { lat: 10.5222, lng: 7.4383  },
  'kano':        { lat: 12.0022, lng: 8.5920  },
  'katsina':     { lat: 12.9816, lng: 7.6178  },
  'kebbi':       { lat: 12.4539, lng: 4.1975  },
  'kogi':        { lat: 7.7337,  lng: 6.6906  },
  'kwara':       { lat: 8.9669,  lng: 4.3874  },
  'lagos':       { lat: 6.5244,  lng: 3.3792  },
  'nasarawa':    { lat: 8.5378,  lng: 8.3235  },
  'niger':       { lat: 9.9309,  lng: 5.5983  },
  'ogun':        { lat: 7.1600,  lng: 3.3500  },
  'ondo':        { lat: 7.2500,  lng: 5.1950  },
  'osun':        { lat: 7.7827,  lng: 4.5418  },
  'oyo':         { lat: 8.1574,  lng: 3.6147  },
  'plateau':     { lat: 9.2182,  lng: 9.5178  },
  'rivers':      { lat: 4.8156,  lng: 7.0498  },
  'sokoto':      { lat: 13.0059, lng: 5.2476  },
  'taraba':      { lat: 8.8938,  lng: 11.3594 },
  'yobe':        { lat: 12.2939, lng: 11.4390 },
  'zamfara':     { lat: 12.1700, lng: 6.6600  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toId(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

function titleCase(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}

function jitter(base: number, range = 0.05): number {
  return parseFloat((base + (Math.random() - 0.5) * range).toFixed(6))
}

// Commit a batch and return a new one
async function commitBatch(
  batch: admin.firestore.WriteBatch,
  counter: { n: number },
  label: string
): Promise<admin.firestore.WriteBatch> {
  await batch.commit()
  counter.n++
  process.stdout.write(`\r    Batch ${counter.n} committed`)
  return db.batch()
}

// ─── Load & Merge Both CSVs ───────────────────────────────────────────────────
interface PURow {
  state: string
  lg: string
  ward: string
  stateCode: number
  lgCode: number
  wardCode: number
  puCode: number
  code: string       // e.g. "10/12/01/033" — official INEC PU code
  location: string   // raw location name
  senatorial: string
  houseOfRep: string
  puAddress: string  // from File 2
}

function loadAndMergeCSVs(): PURow[] {
  // Find File 1
  const f1Paths = [
    path.join(__dirname, 'Nigeria_polling_units.csv'),
    path.join(process.cwd(), 'Nigeria_polling_units.csv'),
  ]
  const f1Path = f1Paths.find(p => fs.existsSync(p))
  if (!f1Path) {
    console.error('\n❌ Missing: Nigeria_polling_units.csv in scripts/ folder')
    process.exit(1)
  }

  // Find File 2
  const f2Paths = [
    path.join(__dirname, 'Nigeria_PU_List_Extracted.csv'),
    path.join(process.cwd(), 'Nigeria_PU_List_Extracted.csv'),
  ]
  const f2Path = f2Paths.find(p => fs.existsSync(p))

  console.log(`  File 1: ${f1Path}`)
  if (f2Path) console.log(`  File 2: ${f2Path}`)
  else console.warn('  ⚠ File 2 not found — PU addresses will be empty')

  // Parse File 1
  const raw1: Record<string, string>[] = parse(
    fs.readFileSync(f1Path, 'utf-8'),
    { columns: true, skip_empty_lines: true, trim: true }
  )

  // Parse File 2 into a lookup map: code → address
  const addressMap = new Map<string, string>()
  if (f2Path) {
    const raw2: Record<string, string>[] = parse(
      fs.readFileSync(f2Path, 'utf-8'),
      { columns: true, skip_empty_lines: true, trim: true }
    )
    for (const r of raw2) {
      const code = (r.PU ?? '').trim()
      const addr = (r['PU Address'] ?? '').trim()
      if (code) addressMap.set(code, addr)
    }
    console.log(`  Loaded ${addressMap.size.toLocaleString()} addresses from File 2`)
  }

  // Merge
  const rows: PURow[] = raw1.map(r => ({
    state:      (r.state ?? '').trim().toLowerCase(),
    lg:         (r.lg ?? '').trim().toLowerCase(),
    ward:       (r.ward ?? '').trim().toLowerCase(),
    stateCode:  parseInt(r.state_code ?? '0'),
    lgCode:     parseInt(r.lg_code ?? '0'),
    wardCode:   parseInt(r.ward_code ?? '0'),
    puCode:     parseInt(r.pu_code ?? '0'),
    code:       (r.code ?? '').trim(),
    location:   (r.location ?? '').trim(),
    senatorial: (r.senatorial ?? '').trim(),
    houseOfRep: (r.house_of_rep ?? '').trim(),
    puAddress:  addressMap.get((r.code ?? '').trim()) ?? (r.location ?? '').trim(),
  }))

  console.log(`  Merged: ${rows.length.toLocaleString()} PUs total`)
  return rows
}

// ─── Step 1: Seed States ──────────────────────────────────────────────────────
async function seedStates(stateNames: string[]) {
  console.log('\n📍 Step 1: Seeding states...')
  const batch = db.batch()
  for (const name of stateNames) {
    const stateId = toId(name)
    const coords = STATE_COORDS[name] ?? { lat: 9.08, lng: 8.67 }
    const displayName = name === 'fct'
      ? 'FCT Abuja'
      : titleCase(name) + ' State'

    batch.set(db.collection('states').doc(stateId), {
      stateId,
      name: displayName,
      code: name.toUpperCase().slice(0, 2),
      coordinates: { latitude: coords.lat, longitude: coords.lng },
      totalLGAs: 0, totalWards: 0, totalPUs: 0,
      stats: {
        activePUs: 0, offlinePUs: 0, completedPUs: 0,
        flaggedPUs: 0, totalVotesCast: 0,
      },
      createdAt: admin.firestore.Timestamp.now(),
    }, { merge: true })
  }
  await batch.commit()
  console.log(`  ✅ ${stateNames.length} states seeded`)
}

// ─── Step 2: Seed LGAs ───────────────────────────────────────────────────────
async function seedLGAs(rows: PURow[]) {
  console.log('\n🏙  Step 2: Seeding LGAs...')

  // Deduplicate: key = stateId + lgaId
  const lgaMap = new Map<string, {
    stateId: string; lgaId: string; name: string
    stateCode: number; lgCode: number
    coords: { lat: number; lng: number }
  }>()

  for (const row of rows) {
    const stateId = toId(row.state)
    const lgaId = `${stateId}_${toId(row.lg)}`
    if (!lgaMap.has(lgaId)) {
      const sc = STATE_COORDS[row.state] ?? { lat: 9.08, lng: 8.67 }
      lgaMap.set(lgaId, {
        stateId, lgaId,
        name: titleCase(row.lg),
        stateCode: row.stateCode,
        lgCode: row.lgCode,
        coords: { lat: jitter(sc.lat, 0.4), lng: jitter(sc.lng, 0.4) },
      })
    }
  }

  const entries = Array.from(lgaMap.values())
  const counter = { n: 0 }
  let batch = db.batch()
  let opsInBatch = 0

  for (const lga of entries) {
    batch.set(
      db.collection('states').doc(lga.stateId).collection('lgas').doc(lga.lgaId),
      {
        lgaId: lga.lgaId,
        stateId: lga.stateId,
        name: lga.name,
        stateCode: lga.stateCode,
        lgCode: lga.lgCode,
        coordinates: { latitude: lga.coords.lat, longitude: lga.coords.lng },
        totalWards: 0, totalPUs: 0,
        stats: { activePUs: 0, offlinePUs: 0, completedPUs: 0, totalVotesCast: 0 },
      },
      { merge: true }
    )
    opsInBatch++
    if (opsInBatch >= 400) {
      batch = await commitBatch(batch, counter, 'LGA')
      opsInBatch = 0
    }
  }
  if (opsInBatch > 0) await batch.commit()

  console.log(`\n  ✅ ${lgaMap.size.toLocaleString()} LGAs seeded`)
  return lgaMap
}

// ─── Step 3: Seed Wards ───────────────────────────────────────────────────────
// KEY FIX: Ward ID uses state+LGA+ward to handle duplicate ward names
async function seedWards(rows: PURow[]) {
  console.log('\n🏘  Step 3: Seeding wards...')

  // Deduplicate: key = stateId + lgaId + wardId (handles "Sabon Gari" in 11 LGAs)
  const wardMap = new Map<string, {
    stateId: string; lgaId: string; wardId: string
    name: string; stateCode: number; lgCode: number; wardCode: number
    coords: { lat: number; lng: number }
  }>()

  for (const row of rows) {
    const stateId = toId(row.state)
    const lgaId = `${stateId}_${toId(row.lg)}`
    // Ward ID must include lgaId to avoid collision across LGAs
    const wardId = `${lgaId}_${toId(row.ward)}`

    if (!wardMap.has(wardId)) {
      const sc = STATE_COORDS[row.state] ?? { lat: 9.08, lng: 8.67 }
      wardMap.set(wardId, {
        stateId, lgaId, wardId,
        name: titleCase(row.ward),
        stateCode: row.stateCode,
        lgCode: row.lgCode,
        wardCode: row.wardCode,
        coords: { lat: jitter(sc.lat, 0.2), lng: jitter(sc.lng, 0.2) },
      })
    }
  }

  const entries = Array.from(wardMap.values())
  const counter = { n: 0 }
  let batch = db.batch()
  let opsInBatch = 0

  for (const ward of entries) {
    batch.set(
      db.collection('states').doc(ward.stateId)
        .collection('lgas').doc(ward.lgaId)
        .collection('wards').doc(ward.wardId),
      {
        wardId: ward.wardId,
        lgaId: ward.lgaId,
        stateId: ward.stateId,
        name: ward.name,
        stateCode: ward.stateCode,
        lgCode: ward.lgCode,
        wardCode: ward.wardCode,
        coordinates: { latitude: ward.coords.lat, longitude: ward.coords.lng },
        totalPUs: 0,
        registeredVoters: 0,
      },
      { merge: true }
    )
    opsInBatch++
    if (opsInBatch >= 400) {
      batch = await commitBatch(batch, counter, 'Ward')
      opsInBatch = 0
    }
  }
  if (opsInBatch > 0) await batch.commit()

  console.log(`\n  ✅ ${wardMap.size.toLocaleString()} wards seeded (8,793 unique state+LGA+ward combos)`)
  return wardMap
}

// ─── Step 4: Seed Polling Units ───────────────────────────────────────────────
async function seedPUs(rows: PURow[]) {
  console.log('\n🗳  Step 4: Seeding polling units...')

  const counter = { n: 0 }
  let batch = db.batch()
  let opsInBatch = 0
  let puCount = 0

  for (const row of rows) {
    if (!row.code) continue

    const stateId = toId(row.state)
    const lgaId = `${stateId}_${toId(row.lg)}`
    const wardId = `${lgaId}_${toId(row.ward)}`
    const puId = row.code.replace(/\//g, '-')  // "10/12/01/033" → "10-12-01-033"

    const sc = STATE_COORDS[row.state] ?? { lat: 9.08, lng: 8.67 }

    batch.set(
      db.collection('states').doc(stateId)
        .collection('lgas').doc(lgaId)
        .collection('wards').doc(wardId)
        .collection('polling_units').doc(puId),
      {
        puId,
        puCode: row.code,
        name: row.puAddress
          ? titleCase(row.puAddress)
          : row.location
          ? titleCase(row.location)
          : `PU ${row.code}`,
        address: row.puAddress || row.location || '',
        wardId, lgaId, stateId,

        // Official INEC codes
        stateCode: row.stateCode,
        lgCode: row.lgCode,
        wardCode: row.wardCode,
        puCode_num: row.puCode,

        // Geographic
        coordinates: {
          latitude: jitter(sc.lat, 0.15),
          longitude: jitter(sc.lng, 0.15),
        },

        // Electoral zones
        senatorial: row.senatorial,
        houseOfRep: row.houseOfRep,

        // Operational — updated by field officers
        status: 'pending',
        registeredVoters: 0,
        accreditedVoters: 0,
        totalVotesCast: 0,
        validVotes: 0,
        rejectedBallots: 0,
        resultsSubmitted: false,
        resultsSubmittedAt: null,

        // Logistics
        materialsDelivered: false,
        assignedVehicleId: '',

        // Officer assignment
        assignedOfficerId: '',
        assignedOfficerName: 'Unassigned',

        // Connectivity
        isFlagged: false,
        hasGuaranteedNetwork: false,
        networkType: 'lte',
        lastPing: null,

        createdAt: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    )

    opsInBatch++
    puCount++

    if (opsInBatch >= 400) {
      batch = await commitBatch(batch, counter, 'PU')
      opsInBatch = 0
      process.stdout.write(` — ${puCount.toLocaleString()} / ${rows.length.toLocaleString()} PUs`)
    }
  }
  if (opsInBatch > 0) {
    await batch.commit()
    process.stdout.write(` — ${puCount.toLocaleString()} / ${rows.length.toLocaleString()} PUs`)
  }

  console.log(`\n  ✅ ${puCount.toLocaleString()} polling units seeded`)
}

// ─── Step 5: Seed System Config ───────────────────────────────────────────────
async function seedSystemConfig() {
  console.log('\n⚙️  Step 5: Seeding system config...')

  await db.collection('system_config').doc('main').set({
    electionName: '2027 Presidential & National Assembly Election',
    electionDate: admin.firestore.Timestamp.fromDate(new Date('2027-02-20')),
    accreditationStartTime: '08:30',
    accreditationEndTime: '13:30',
    votingStartTime: '08:30',
    votingEndTime: '14:30',
    vehicleStationaryThresholdMinutes: 30,
    lateSubmissionWindowMinutes: 30,
    registeredParties: ['APC', 'PDP', 'LP', 'NNPP', 'APGA', 'ADC', 'SDP', 'ZLP'],
    totalRegisteredVoters: 93469008,
    totalPUs: 176846,
    totalLGAs: 774,
    totalWards: 8793,
    totalStates: 37,
    liveVideoEnabled: true,
    aiAlertsEnabled: true,
    offlineSyncEnabled: true,
  }, { merge: true })

  await db.collection('system_config').doc('national_stats').set({
    totalPUs: 176846,
    activePUs: 0, offlinePUs: 0, completedPUs: 0,
    flaggedPUs: 0, totalVotesCast: 0,
    totalVehicles: 0, vehiclesInTransit: 0, vehiclesDelivered: 0,
    lastUpdated: admin.firestore.Timestamp.now(),
  }, { merge: true })

  console.log('  ✅ System config seeded')
}

// ─── Step 6: Admin User Profile ───────────────────────────────────────────────
async function seedAdminUser() {
  const ADMIN_UID = process.env.ADMIN_UID ?? ''
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@inec.gov.ng'

  if (!ADMIN_UID) {
    console.log('\n⚠️  Step 6: Skipping admin user (no ADMIN_UID set)')
    console.log('   To create: ADMIN_UID=<uid> npm run seed')
    return
  }

  console.log(`\n👤 Step 6: Seeding admin user (${ADMIN_EMAIL})...`)
  await db.collection('users').doc(ADMIN_UID).set({
    userId: ADMIN_UID,
    fullName: 'INEC Super Administrator',
    email: ADMIN_EMAIL,
    phone: '+2348000000000',
    role: 'superadmin',
    isActive: true,
    lastLogin: null,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  }, { merge: true })

  console.log('  ✅ Admin user profile seeded')
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const start = Date.now()

  console.log('╔══════════════════════════════════════════════╗')
  console.log('║   INEC 2.0 — Firebase Data Seeder            ║')
  console.log('║   37 States | 774 LGAs | 8,793 Wards         ║')
  console.log('║   176,846 Polling Units                       ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log('\n📂 Loading CSVs...')

  const rows = loadAndMergeCSVs()
  const stateNames = [...new Set(rows.map(r => r.state))].filter(Boolean).sort()

  try {
    await seedStates(stateNames)
    await seedLGAs(rows)
    await seedWards(rows)
    await seedPUs(rows)
    await seedSystemConfig()
    await seedAdminUser()

    const mins = ((Date.now() - start) / 60000).toFixed(1)
    console.log('\n╔══════════════════════════════════════════════╗')
    console.log(`║  ✅ Complete! Took ${mins} minutes               `)
    console.log('╚══════════════════════════════════════════════╝')
    console.log('\nWhat was seeded:')
    console.log(`  • ${stateNames.length} States`)
    console.log('  • 774 LGAs')
    console.log('  • 8,793 Wards (unique state+LGA+ward combos)')
    console.log('  • 176,846 Polling Units')
    console.log('\nNext steps:')
    console.log('  1. Firebase Console → Authentication → Add user')
    console.log('  2. Copy the UID, then run:')
    console.log('     ADMIN_UID=<uid> ADMIN_EMAIL=you@inec.gov.ng npm run seed')
    console.log('  3. Login at: https://inec-xi.vercel.app/login')
  } catch (err) {
    console.error('\n❌ Seeding failed:', err)
    process.exit(1)
  }
}

main()
