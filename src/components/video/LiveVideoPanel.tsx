// src/components/video/LiveVideoPanel.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Video, VideoOff, Mic, MicOff, PhoneOff, Signal, Search, Users, Monitor } from 'lucide-react'
import { getAllMockPUs, MockPU } from '@/firebase/mockData'

// ─── Active Session ───────────────────────────────────────────────────────────
function ActiveSession({ session, onEnd }: { session: { pu: MockPU; channelId: string }; onEnd: () => void }) {
  const [phase, setPhase]         = useState<'requesting' | 'connecting' | 'live'>('requesting')
  const [elapsed, setElapsed]     = useState(0)
  const [videoMuted, setVideoMuted] = useState(false)
  const [audioMuted, setAudioMuted] = useState(false)
  const [quality, setQuality]     = useState(95)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Phase progression
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('connecting'), 2500)
    const t2 = setTimeout(() => {
      setPhase('live')
      // Try to start real camera for demo
      if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() } })
          .catch(() => { /* fallback to simulated */ })
      }
    }, 5000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Elapsed timer
  useEffect(() => {
    if (phase !== 'live') return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  // Quality fluctuation for realism
  useEffect(() => {
    if (phase !== 'live') return
    const t = setInterval(() => setQuality(85 + Math.floor(Math.random() * 15)), 3000)
    return () => clearInterval(t)
  }, [phase])

  const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  const handleEnd = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(t => t.stop())
    }
    onEnd()
  }

  return (
    <div style={{ flex: 1, background: '#000', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* Phase overlays */}
      {phase === 'requesting' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', zIndex: 10, gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,166,81,0.15)', border: '2px solid #00a651', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.5s infinite' }}>
            <span style={{ fontSize: 24 }}>📡</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#00a651', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em' }}>REQUESTING STREAM</div>
            <div style={{ color: '#8b98b8', fontSize: 11, marginTop: 6 }}>Contacting {session.pu.assignedOfficerName}...</div>
            <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'monospace', marginTop: 4 }}>Channel: {session.channelId.slice(0, 30)}...</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#00a651', opacity: 0.3, animation: `bounce ${0.6 + i * 0.2}s infinite alternate` }} />
            ))}
          </div>
        </div>
      )}

      {phase === 'connecting' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', zIndex: 10, gap: 16 }}>
          <div style={{ color: '#3b82f6', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em' }}>OFFICER ACCEPTED</div>
          <div style={{ color: '#8b98b8', fontSize: 11 }}>Establishing secure connection...</div>
          <div style={{ width: 200, height: 4, background: '#1a2235', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: '70%', height: '100%', background: '#3b82f6', borderRadius: 2, transition: 'width 2s' }} />
          </div>
          <div style={{ fontSize: 10, color: '#4a5568', fontFamily: 'monospace' }}>AES-256 Encrypted · Agora RTC</div>
        </div>
      )}

      {/* Video feed */}
      {phase === 'live' && (
        <>
          {/* Real camera or simulated feed */}
          <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: videoMuted ? 0 : 1 }} />

          {/* If camera unavailable — show simulated feed */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0e18 0%, #0f1a2e 50%, #0a1020 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: videoMuted ? 2 : -1 }}>
            {videoMuted
              ? <div style={{ textAlign: 'center' }}><VideoOff size={40} color="#4a5568" /><div style={{ color: '#4a5568', fontSize: 12, marginTop: 8 }}>Video paused</div></div>
              : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>👮</div>
                  <div style={{ color: '#8b98b8', fontSize: 11 }}>{session.pu.assignedOfficerName}</div>
                  <div style={{ color: '#00a651', fontSize: 10, fontFamily: 'monospace', marginTop: 4 }}>{session.pu.puCode}</div>
                </div>
              )
            }
          </div>

          {/* LIVE badge */}
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', gap: 8 }}>
            <div style={{ background: 'rgba(239,68,68,0.9)', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>
              ● LIVE {fmt(elapsed)}
            </div>
            <div style={{ background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: 4, fontSize: 10, fontFamily: 'monospace', color: '#8b98b8' }}>
              {session.pu.puCode}
            </div>
            <div style={{ background: 'rgba(0,0,0,0.7)', padding: '4px 10px', borderRadius: 4, fontSize: 10, fontFamily: 'monospace', color: '#00a651' }}>
              {quality}% signal
            </div>
          </div>

          {/* Officer info */}
          <div style={{ position: 'absolute', bottom: 64, left: 12, zIndex: 10, background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{session.pu.assignedOfficerName}</div>
            <div style={{ color: '#8b98b8', fontSize: 10, marginTop: 2 }}>{session.pu.name}</div>
          </div>
        </>
      )}

      {/* Controls */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', padding: '24px 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 10 }}>
        <button onClick={() => setAudioMuted(v => !v)} style={{ width: 42, height: 42, borderRadius: '50%', background: audioMuted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)', border: `1px solid ${audioMuted ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          {audioMuted ? <MicOff size={16} color="#ef4444" /> : <Mic size={16} color="#fff" />}
        </button>
        <button onClick={handleEnd} style={{ width: 50, height: 50, borderRadius: '50%', background: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 20px rgba(239,68,68,0.5)' }}>
          <PhoneOff size={20} color="#fff" />
        </button>
        <button onClick={() => setVideoMuted(v => !v)} style={{ width: 42, height: 42, borderRadius: '50%', background: videoMuted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)', border: `1px solid ${videoMuted ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          {videoMuted ? <VideoOff size={16} color="#ef4444" /> : <Video size={16} color="#fff" />}
        </button>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.05)} }
        @keyframes bounce { from{transform:translateY(0)} to{transform:translateY(-6px)} }
      `}</style>
    </div>
  )
}

// ─── Officer Card ─────────────────────────────────────────────────────────────
function OfficerCard({ pu, onRequest }: { pu: MockPU; onRequest: (pu: MockPU) => void }) {
  const statusColor = ({ active: '#00a651', voting: '#3b82f6', offline: '#f59e0b', pending: '#6b7280', completed: '#10b981', flagged: '#ef4444', submitted: '#8b5cf6' } as Record<string,string>)[pu.status] ?? '#6b7280'
  return (
    <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'default' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-elevated)', border: `2px solid ${statusColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 700, color: statusColor }}>
        {pu.assignedOfficerName.charAt(0)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pu.assignedOfficerName}</div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--green-inec)', marginTop: 1 }}>{pu.puCode}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pu.name}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Signal size={10} color={statusColor} />
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: statusColor }}>{pu.status.toUpperCase()}</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => onRequest(pu)} disabled={pu.status === 'offline'} style={{ opacity: pu.status === 'offline' ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Video size={11} /> Stream
        </button>
      </div>
    </div>
  )
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ pus }: { pus: MockPU[] }) {
  const active  = pus.filter(p => p.status === 'active' || p.status === 'voting').length
  const offline = pus.filter(p => p.status === 'offline').length
  return (
    <div style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--bg-border)', marginBottom: 12 }}>
      {[
        { label: 'Total Officers', value: pus.length, color: 'var(--text-secondary)' },
        { label: 'Available',      value: active,     color: '#00a651'              },
        { label: 'Offline',        value: offline,    color: '#f59e0b'              },
      ].map(({ label, value, color }) => (
        <div key={label} style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function LiveVideoPanel() {
  const allPUs        = getAllMockPUs()
  const activePUs     = allPUs.filter(p => p.status === 'active' || p.status === 'voting')
  const [session, setSession] = useState<{ pu: MockPU; channelId: string } | null>(null)
  const [search, setSearch]   = useState('')
  const [tab, setTab]         = useState<'available' | 'all'>('available')

  const displayPUs = (tab === 'available' ? activePUs : allPUs).filter(p =>
    !search || p.puCode.toLowerCase().includes(search.toLowerCase()) || p.assignedOfficerName.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleRequest = (pu: MockPU) => {
    const channelId = `inec-${pu.puId.replace(/\//g, '-')}-${Date.now()}`
    setSession({ pu, channelId })
  }

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>

      {/* Left — officer list */}
      <div style={{ width: 360, borderRight: '1px solid var(--bg-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Monitor size={18} color="var(--green-inec)" />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>Live Video</h2>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>Request live streams from field officers</p>
          <StatsBar pus={allPUs} />

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {(['available', 'all'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, textTransform: 'capitalize' }}>
                {t === 'available' ? `Available (${activePUs.length})` : `All (${allPUs.length})`}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 30, fontSize: 12 }} placeholder="Search officer or PU..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Officer list */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayPUs.length === 0
            ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 12 }}>No officers found</div>
            : displayPUs.map(pu => <OfficerCard key={pu.puId} pu={pu} onRequest={handleRequest} />)
          }
        </div>
      </div>

      {/* Right — video area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {session
          ? <ActiveSession session={session} onEnd={() => setSession(null)} />
          : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#000' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(0,166,81,0.08)', border: '2px solid rgba(0,166,81,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={36} color="rgba(0,166,81,0.4)" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 600 }}>No Active Stream</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6, maxWidth: 280, lineHeight: 1.6 }}>
                  Select an officer from the list and click <strong style={{ color: 'var(--green-inec)' }}>Stream</strong> to request a live video feed from their polling unit.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {['AES-256 Encrypted', 'Low Latency RTC', 'Agora Powered'].map(tag => (
                  <div key={tag} style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: 20, padding: '3px 10px', border: '1px solid var(--bg-border)' }}>{tag}</div>
                ))}
              </div>
            </div>
          )
        }
      </div>
    </div>
  )
}
