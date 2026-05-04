// scripts/seedFirebase.mjs
// Run with: node scripts/seedFirebase.mjs

import { readFileSync, existsSync } from 'fs'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { parse } from 'csv-parse/sync'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)

// Load firebase-admin via require (CommonJS)
const admin = require('firebase-admin')

// ─── Init Firebase Admin ──────────────────────────────────────────────────────
const serviceAccountPath = join(__dirname, 'serviceAccount.json')
if (!existsSync(serviceAccountPath)) {
  console.error('\n❌ Missing: scripts/serviceAccount.json')
  process.exit(1)
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'inec-9a779',
})

const db = admin.firestore()
db.settings({ ignoreUndefinedProperties: true })

console.log('✅ Firebase connected!')

// ─── State coordinates ────────────────────────────────────────────────────────
const STATE_COORDS = {
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

function toId(str) {
  return str.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

function titleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}

function jitter(base, range = 0.05) {
  return parseFloat((base + (Math.random() - 0.5) * range).toFixed(6))
}

// ─── Load CSVs ────────────────────────────────────────────────────────────────
function loadCSVs() {
  const f1Candidates = [
    join(__dirname, 'Nigeria_polling_units.csv'),
    join(__dirname, '..', 'Nigeria_polling_units.csv'),
  ]
  const f1Path = f1Candidates.find(p => existsSync(p))
  if (!f1Path) {
    console.error('\n❌ Nigeria_polling_units.csv not found in scripts/ folder')
    process.exit(1)
  }

  const f2Candidates = [
    join(__dirname, 'Nigeria_PU_List_Extracted.csv'),
    join(__dirname, '..', 'Nigeria_PU_List_Extracted.csv'),
  ]
  const f2Path = f2Candidates.find(p => existsSync(p))

  console.log(`  ✓ File 1: ${f1Path}`)

  const raw1 = parse(readFileSync(f1Path, 'utf-8'), {
    columns: true, skip_empty_lines: true, trim: true,
  })

  const addressMap = new Map()
  if (f2Path) {
    console.log(`  ✓ File 2: ${f2Path}`)
    const raw2 = parse(readFileSync(f2Path, 'utf-8'), {
      columns: true, skip_empty_lines: true, trim: true,
    })
    for (const r of raw2) {
      const code = (r.PU ?? '').trim()
      if (code) addressMap.set(code, (r['PU Address'] ?? '').trim())
    }
  }

  return raw1.map(r => ({
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
}

// ─── Seed States ──────────────────────────────────────────────────────────────
async function seedStates(stateNames) {
  console.log('\n📍 Step 1: Seeding states...')
  const batch = db.batch()
  for (const name of stateNames) {
    const stateId = toId(name)
    const coords = STATE_COORDS[name] ?? { lat: 9.08, lng: 8.67 }
    const displayName = name === 'fct' ? 'FCT Abuja' : titleCase(name) + ' State'
    batch.set(db.collection('states').doc(stateId), {
      stateId, name: displayName,
      code: name.toUpperCase().slice(0, 2),
      coordinates: { latitude: coords.lat, longitude: coords.lng },
      totalLGAs: 0, totalWards: 0, totalPUs: 0,
      stats: { activePUs: 0, offlinePUs: 0, completedPUs: 0, flaggedPUs: 0, totalVotesCast: 0 },
      createdAt: admin.firestore.Timestamp.now(),
    }, { merge: true })
  }
  await batch.commit()
  console.log(`  ✅ ${stateNames.length} states seeded`)
}

// ─── Seed LGAs ────────────────────────────────────────────────────────────────
async function seedLGAs(rows) {
  console.log('\n🏙  Step 2: Seeding LGAs...')
  const lgaMap = new Map()
  for (const row of rows) {
    const stateId = toId(row.state)
    const lgaId = `${stateId}_${toId(row.lg)}`
    if (!lgaMap.has(lgaId)) {
      const sc = STATE_COORDS[row.state] ?? { lat: 9.08, lng: 8.67 }
      lgaMap.set(lgaId, { stateId, lgaId, name: titleCase(row.lg), stateCode: row.stateCode, lgCode: row.lgCode, coords: { lat: jitter(sc.lat, 0.4), lng: jitter(sc.lng, 0.4) } })
    }
  }

  const entries = Array.from(lgaMap.values())
  let batch = db.batch()
  let ops = 0, batchNum = 0

  for (const lga of entries) {
    batch.set(db.collection('states').doc(lga.stateId).collection('lgas').doc(lga.lgaId), {
      lgaId: lga.lgaId, stateId: lga.stateId, name: lga.name,
      stateCode: lga.stateCode, lgCode: lga.lgCode,
      coordinates: { latitude: lga.coords.lat, longitude: lga.coords.lng },
      totalWards: 0, totalPUs: 0,
      stats: { activePUs: 0, offlinePUs: 0, completedPUs: 0, totalVotesCast: 0 },
    }, { merge: true })
    ops++
    if (ops >= 400) {
      await batch.commit()
      batchNum++
      process.stdout.write(`\r  Committed ${batchNum * 400} / ${entries.length} LGAs`)
      batch = db.batch()
      ops = 0
    }
  }
  if (ops > 0) await batch.commit()
  console.log(`\n  ✅ ${lgaMap.size} LGAs seeded`)
}

// ─── Seed Wards ───────────────────────────────────────────────────────────────
async function seedWards(rows) {
  console.log('\n🏘  Step 3: Seeding wards...')
  const wardMap = new Map()
  for (const row of rows) {
    const stateId = toId(row.state)
    const lgaId = `${stateId}_${toId(row.lg)}`
    const wardId = `${lgaId}_${toId(row.ward)}`
    if (!wardMap.has(wardId)) {
      const sc = STATE_COORDS[row.state] ?? { lat: 9.08, lng: 8.67 }
      wardMap.set(wardId, { stateId, lgaId, wardId, name: titleCase(row.ward), wardCode: row.wardCode, coords: { lat: jitter(sc.lat, 0.2), lng: jitter(sc.lng, 0.2) } })
    }
  }

  const entries = Array.from(wardMap.values())
  let batch = db.batch()
  let ops = 0, batchNum = 0

  for (const w of entries) {
    batch.set(db.collection('states').doc(w.stateId).collection('lgas').doc(w.lgaId).collection('wards').doc(w.wardId), {
      wardId: w.wardId, lgaId: w.lgaId, stateId: w.stateId,
      name: w.name, wardCode: w.wardCode,
      coordinates: { latitude: w.coords.lat, longitude: w.coords.lng },
      totalPUs: 0, registeredVoters: 0,
    }, { merge: true })
    ops++
    if (ops >= 400) {
      await batch.commit()
      batchNum++
      process.stdout.write(`\r  Committed ${batchNum * 400} / ${entries.length} wards`)
      batch = db.batch()
      ops = 0
    }
  }
  if (ops > 0) await batch.commit()
  console.log(`\n  ✅ ${wardMap.size} wards seeded`)
}

// ─── Seed PUs ─────────────────────────────────────────────────────────────────
async function seedPUs(rows) {
  console.log('\n🗳  Step 4: Seeding polling units...')
  let batch = db.batch()
  let ops = 0, batchNum = 0, total = 0

  for (const row of rows) {
    if (!row.code) continue
    const stateId = toId(row.state)
    const lgaId = `${stateId}_${toId(row.lg)}`
    const wardId = `${lgaId}_${toId(row.ward)}`
    const puId = row.code.replace(/\//g, '-')
    const sc = STATE_COORDS[row.state] ?? { lat: 9.08, lng: 8.67 }

    batch.set(
      db.collection('states').doc(stateId)
        .collection('lgas').doc(lgaId)
        .collection('wards').doc(wardId)
        .collection('polling_units').doc(puId),
      {
        puId, puCode: row.code,
        name: row.puAddress ? titleCase(row.puAddress) : row.location ? titleCase(row.location) : `PU ${row.code}`,
        address: row.puAddress || row.location || '',
        wardId, lgaId, stateId,
        stateCode: row.stateCode, lgCode: row.lgCode,
        wardCode: row.wardCode, puCode_num: row.puCode,
        coordinates: { latitude: jitter(sc.lat, 0.15), longitude: jitter(sc.lng, 0.15) },
        senatorial: row.senatorial, houseOfRep: row.houseOfRep,
        status: 'pending',
        registeredVoters: 0, accreditedVoters: 0, totalVotesCast: 0,
        validVotes: 0, rejectedBallots: 0,
        resultsSubmitted: false, materialsDelivered: false,
        assignedOfficerId: '', assignedOfficerName: 'Unassigned',
        isFlagged: false, hasGuaranteedNetwork: false, networkType: 'lte',
        createdAt: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    )
    ops++
    total++
    if (ops >= 400) {
      await batch.commit()
      batchNum++
      process.stdout.write(`\r  Batch ${batchNum} — ${total.toLocaleString()} / ${rows.length.toLocaleString()} PUs`)
      batch = db.batch()
      ops = 0
    }
  }
  if (ops > 0) {
    await batch.commit()
    process.stdout.write(`\r  Done — ${total.toLocaleString()} PUs written`)
  }
  console.log(`\n  ✅ ${total.toLocaleString()} polling units seeded`)
}

// ─── Seed Config & Admin ──────────────────────────────────────────────────────
async function seedConfig() {
  console.log('\n⚙️  Step 5: Seeding system config...')
  await db.collection('system_config').doc('main').set({
    electionName: '2027 Presidential & National Assembly Election',
    totalRegisteredVoters: 93469008,
    totalPUs: 176846, totalLGAs: 774, totalWards: 8793, totalStates: 37,
    registeredParties: ['APC', 'PDP', 'LP', 'NNPP', 'APGA', 'ADC', 'SDP', 'ZLP'],
    liveVideoEnabled: true, aiAlertsEnabled: true, offlineSyncEnabled: true,
  }, { merge: true })

  await db.collection('system_config').doc('national_stats').set({
    totalPUs: 176846, activePUs: 0, offlinePUs: 0, completedPUs: 0,
    flaggedPUs: 0, totalVotesCast: 0, totalVehicles: 0,
    vehiclesInTransit: 0, vehiclesDelivered: 0,
    lastUpdated: admin.firestore.Timestamp.now(),
  }, { merge: true })
  console.log('  ✅ System config seeded')
}

async function seedAdmin() {
  const uid = 'EQoYQ1Cs2ZRbqi1SFupVnYBYhWs2'
  console.log(`\n👤 Step 6: Seeding admin user...`)
  await db.collection('users').doc(uid).set({
    userId: uid, fullName: 'INEC Super Administrator',
    email: 'admin@inec.gov.ng', phone: '+2348000000000',
    role: 'superadmin', isActive: true, lastLogin: null,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  }, { merge: true })
  console.log('  ✅ Admin user seeded')
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const start = Date.now()
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║   INEC 2.0 — Firebase Data Seeder            ║')
  console.log('║   37 States | 774 LGAs | 8,793 Wards         ║')
  console.log('║   176,846 Polling Units                       ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log('\n📂 Loading CSV files...')

  const rows = loadCSVs()
  console.log(`  ✓ ${rows.length.toLocaleString()} records loaded`)

  const stateNames = [...new Set(rows.map(r => r.state))].filter(Boolean).sort()

  await seedStates(stateNames)
  await seedLGAs(rows)
  await seedWards(rows)
  await seedPUs(rows)
  await seedConfig()
  await seedAdmin()

  const mins = ((Date.now() - start) / 60000).toFixed(1)
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log(`║  ✅ Complete! Took ${mins} minutes`)
  console.log('╚══════════════════════════════════════════════╝')
  process.exit(0)
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
