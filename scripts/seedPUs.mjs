// scripts/seedPUs.mjs
// Seeds ONLY polling units with rate limiting to avoid Firestore quota
// Run with: node scripts/seedPUs.mjs
// Can be safely re-run — uses merge:true so duplicates are overwritten
// If it stops, run again — it will skip already-written PUs (Firestore merge)

import { readFileSync, existsSync, writeFileSync } from 'fs'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { parse } from 'csv-parse/sync'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)
const admin = require('firebase-admin')

// ─── Init ─────────────────────────────────────────────────────────────────────
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf-8'))
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'inec-9a779',
})
const db = admin.firestore()
db.settings({ ignoreUndefinedProperties: true })
console.log('✅ Firebase connected!')

// ─── Progress tracking ────────────────────────────────────────────────────────
const PROGRESS_FILE = join(__dirname, 'seed_progress.json')

function loadProgress() {
  if (existsSync(PROGRESS_FILE)) {
    const p = JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'))
    console.log(`📌 Resuming from PU #${p.lastIndex.toLocaleString()} (${p.completed.toLocaleString()} already done)`)
    return p
  }
  return { lastIndex: 0, completed: 0 }
}

function saveProgress(lastIndex, completed) {
  writeFileSync(PROGRESS_FILE, JSON.stringify({ lastIndex, completed }))
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

function toId(str) { return str.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') }
function titleCase(str) { return str.replace(/\b\w/g, c => c.toUpperCase()) }
function jitter(base, range = 0.05) { return parseFloat((base + (Math.random() - 0.5) * range).toFixed(6)) }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════╗')
  console.log('║   INEC 2.0 — PU Seeder (Rate Limited)   ║')
  console.log('║   176,846 Polling Units                   ║')
  console.log('║   Safe to re-run if interrupted           ║')
  console.log('╚══════════════════════════════════════════╝\n')

  // Load CSV
  const csvPath = join(__dirname, 'Nigeria_polling_units.csv')
  const addrPath = join(__dirname, 'Nigeria_PU_List_Extracted.csv')

  if (!existsSync(csvPath)) { console.error('❌ Nigeria_polling_units.csv not found'); process.exit(1) }

  const rows = parse(readFileSync(csvPath, 'utf-8'), { columns: true, skip_empty_lines: true, trim: true })

  const addressMap = new Map()
  if (existsSync(addrPath)) {
    const raw2 = parse(readFileSync(addrPath, 'utf-8'), { columns: true, skip_empty_lines: true, trim: true })
    for (const r of raw2) {
      const code = (r.PU ?? '').trim()
      if (code) addressMap.set(code, (r['PU Address'] ?? '').trim())
    }
  }

  console.log(`✓ ${rows.length.toLocaleString()} PUs loaded from CSV\n`)

  const progress = loadProgress()
  let startIndex = progress.lastIndex
  let completed = progress.completed

  // Settings — tuned for Firestore free tier
  const BATCH_SIZE = 200        // smaller batches
  const DELAY_MS = 2000         // 2 second pause between batches
  const SAVE_EVERY = 5          // save progress every 5 batches

  let batchNum = 0
  let consecutiveErrors = 0

  for (let i = startIndex; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE)
    const batch = db.batch()

    for (const row of chunk) {
      if (!row.code) continue
      const stateId = toId(row.state ?? '')
      const lgaId = `${stateId}_${toId(row.lg ?? '')}`
      const wardId = `${lgaId}_${toId(row.ward ?? '')}`
      const puId = row.code.replace(/\//g, '-')
      const sc = STATE_COORDS[row.state] ?? { lat: 9.08, lng: 8.67 }
      const addr = addressMap.get(row.code) ?? (row.location ?? '')

      batch.set(
        db.collection('states').doc(stateId)
          .collection('lgas').doc(lgaId)
          .collection('wards').doc(wardId)
          .collection('polling_units').doc(puId),
        {
          puId, puCode: row.code,
          name: addr ? titleCase(addr) : row.location ? titleCase(row.location) : `PU ${row.code}`,
          address: addr || row.location || '',
          wardId, lgaId, stateId,
          stateCode: parseInt(row.state_code ?? '0'),
          lgCode: parseInt(row.lg_code ?? '0'),
          wardCode: parseInt(row.ward_code ?? '0'),
          puCode_num: parseInt(row.pu_code ?? '0'),
          coordinates: {
            latitude: jitter(sc.lat, 0.15),
            longitude: jitter(sc.lng, 0.15),
          },
          senatorial: row.senatorial ?? '',
          houseOfRep: row.house_of_rep ?? '',
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
    }

    try {
      await batch.commit()
      completed += chunk.length
      batchNum++
      consecutiveErrors = 0

      const pct = ((completed / rows.length) * 100).toFixed(1)
      process.stdout.write(`\r  ✅ ${completed.toLocaleString()} / ${rows.length.toLocaleString()} PUs (${pct}%) — Batch ${batchNum}`)

      // Save progress periodically
      if (batchNum % SAVE_EVERY === 0) {
        saveProgress(i + BATCH_SIZE, completed)
      }

      // Rate limiting delay
      await sleep(DELAY_MS)

    } catch (err) {
      consecutiveErrors++
      console.error(`\n\n⚠️  Batch failed (attempt ${consecutiveErrors}): ${err.message}`)

      // Save progress so we can resume
      saveProgress(i, completed)

      if (consecutiveErrors >= 3) {
        console.error('\n❌ Too many consecutive errors. Stopping.')
        console.error(`\n📌 Progress saved at PU #${i.toLocaleString()}`)
        console.error('   Run again to resume from where you stopped!\n')
        process.exit(1)
      }

      // Wait longer before retrying after error
      console.log(`   Waiting 30 seconds before retry...`)
      await sleep(30000)
      i -= BATCH_SIZE // retry this batch
    }
  }

  // Clear progress file when done
  if (existsSync(PROGRESS_FILE)) {
    writeFileSync(PROGRESS_FILE, JSON.stringify({ lastIndex: rows.length, completed }))
  }

  console.log(`\n\n╔══════════════════════════════════════════╗`)
  console.log(`║  ✅ ALL ${completed.toLocaleString()} PUs SEEDED SUCCESSFULLY!  `)
  console.log(`╚══════════════════════════════════════════╝`)
  console.log('\n🎉 Your INEC dashboard now has all real data!')
  console.log('   Visit: https://inec-xi.vercel.app/dashboard\n')
  process.exit(0)
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message)
  process.exit(1)
})
