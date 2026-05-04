// src/app/setup/page.tsx
// ONE-TIME SETUP PAGE — seeds admin user into Firestore
// Visit: https://inec-xi.vercel.app/setup
'use client'

import { useState } from 'react'
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'

export const dynamic = 'force-dynamic'

const ADMIN_UID = 'EQoYQ1Cs2ZRbqi1SFupVnYBYhWs2'
const ADMIN_EMAIL = 'admin@inec.gov.ng'

export default function SetupPage() {
  const [status, setStatus] = useState<'idle'|'running'|'done'|'error'>('idle')
  const [message, setMessage] = useState('')

  const runSetup = async () => {
    setStatus('running')
    setMessage('Connecting to Firebase...')
    try {
      const existing = await getDoc(doc(db, 'users', ADMIN_UID))
      if (existing.exists()) {
        setMessage('Admin user already exists! You can now login at /login')
        setStatus('done')
        return
      }
      setMessage('Creating admin profile...')
      await setDoc(doc(db, 'users', ADMIN_UID), {
        userId: ADMIN_UID,
        fullName: 'INEC Super Administrator',
        email: ADMIN_EMAIL,
        phone: '+2348000000000',
        role: 'superadmin',
        isActive: true,
        lastLogin: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      await setDoc(doc(db, 'system_config', 'national_stats'), {
        totalPUs: 176846,
        activePUs: 0, offlinePUs: 0, completedPUs: 0,
        flaggedPUs: 0, totalVotesCast: 0,
        totalVehicles: 0, vehiclesInTransit: 0, vehiclesDelivered: 0,
        lastUpdated: Timestamp.now(),
      })
      await setDoc(doc(db, 'system_config', 'main'), {
        electionName: '2027 Presidential & National Assembly Election',
        totalRegisteredVoters: 93469008,
        totalPUs: 176846, totalLGAs: 774, totalWards: 8793, totalStates: 37,
        registeredParties: ['APC', 'PDP', 'LP', 'NNPP', 'APGA', 'ADC', 'SDP', 'ZLP'],
        liveVideoEnabled: true, aiAlertsEnabled: true, offlineSyncEnabled: true,
      })
      setMessage('Setup complete! Admin user created. Go to /login to sign in.')
      setStatus('done')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setMessage('Error: ' + msg + '\n\nMake sure Firestore is enabled at:\nhttps://console.firebase.google.com/project/inec-9a779/firestore')
      setStatus('error')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060810', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#0f1520', border: '1px solid #1e2a3d', borderRadius: 16, padding: 40, maxWidth: 500, width: '100%' }}>
        <h1 style={{ color: '#00a651', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>INEC 2.0 — First Time Setup</h1>
        <p style={{ color: '#8b98b8', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
          This seeds your admin profile into Firestore. Run once, then use <strong style={{ color: '#e8edf5' }}>/login</strong>.
        </p>
        <div style={{ background: '#1a2235', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 12, color: '#8b98b8', lineHeight: 1.8 }}>
          <strong style={{ color: '#e8edf5' }}>Admin:</strong> {ADMIN_EMAIL}<br />
          <strong style={{ color: '#e8edf5' }}>UID:</strong> {ADMIN_UID}<br />
          <strong style={{ color: '#e8edf5' }}>Role:</strong> superadmin
        </div>
        {message && (
          <div style={{ background: status === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(0,166,81,0.1)', border: `1px solid ${status === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(0,166,81,0.3)'}`, borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 12, color: status === 'error' ? '#fc8181' : '#68d391', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
            {message}
          </div>
        )}
        {status !== 'done' ? (
          <button onClick={runSetup} disabled={status === 'running'}
            style={{ width: '100%', padding: '12px', background: status === 'running' ? 'rgba(0,166,81,0.4)' : '#00a651', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: status === 'running' ? 'not-allowed' : 'pointer' }}>
            {status === 'running' ? 'Running...' : 'Run Setup Now'}
          </button>
        ) : (
          <a href="/login" style={{ display: 'block', padding: '12px', background: '#00a651', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
            Go to Login →
          </a>
        )}
      </div>
    </div>
  )
}
