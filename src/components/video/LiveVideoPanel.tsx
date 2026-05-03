// src/components/video/LiveVideoPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// MINI-INEC 2.0 — On-Demand Live Video (Module 4)
// Agora RTC integration via Firestore signaling
// Admin clicks "Request Stream" → Firestore triggers officer's device
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Loader, Monitor, Users, Signal } from 'lucide-react'
import { getAllMockPUs, MockPU } from '@/firebase/mockData'
import { useAgora, AgoraSession } from '@/hooks/useAgora'
import { v4 as uuid } from 'uuid'

// ─── Active Session Panel ─────────────────────────────────────────────────────
function ActiveSession({
  session,
  onEnd,
}: {
  session: { pu: MockPU; channelId: string }
  onEnd: () => void
}) {
  const {
    isConnecting, isConnected, localVideoReady, remoteUsers,
    error, startSession, endSession,
    toggleVideo, toggleAudio, isVideoMuted, isAudioMuted,
  } = useAgora()

  const localVideoRef = useRef<HTMLDivElement>(null)
  const [elapsed, setElapsed] = useState(0)
  const [isRequesting, setIsRequesting] = useState(true)

  // Simulate officer accepting after 3s (PoC demo)
  useEffect(() => {
    const timer = setTimeout(() => setIsRequesting(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  // Elapsed timer
  useEffect(() => {
    if (!isConnected) return
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(interval)
  }, [isConnected])

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  // Auto-start Agora session when officer "accepts"
  useEffect(() => {
    if (!isRequesting && !isConnected && !isConnecting) {
      const agoraSession: AgoraSession = {
        channelId: session.channelId,
        targetOfficerId: session.pu.puId,
        targetPUId: session.pu.puId,
        officerName: session.pu.assignedOfficerName,
      }
      startSession(agoraSession)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRequesting])

  const handleEnd = async () => {
    await endSession()
    onEnd()
  }

  return (
    <div style={{
      background: '#000',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      border: '1px solid var(--bg-border)',
      position: 'relative',
      aspectRatio: '16/9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Requesting overlay */}
      {isRequesting && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(10, 14, 24, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          zIndex: 10,
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            border: '2px solid var(--green-inec)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse-ring 1.5s infinite',
          }}>
            <Phone size={24} color="var(--green-inec)" />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
            Requesting Stream...
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Waiting for {session.pu.assignedOfficerName} to accept
          </div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {session.pu.puCode} · {session.pu.name}
          </div>
        </div>
      )}

      {/* Connecting overlay */}
      {!isRequesting && isConnecting && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(10,14,24,0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}>
          <Loader size={32} color="var(--green-inec)" style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Connecting to Agora...</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          position: 'absolute',
          bottom: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(239,68,68,0.2)',
          border: '1px solid rgba(239,68,68,0.4)',
          padding: '8px 16px',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--severity-critical)',
          zIndex: 10,
          maxWidth: '80%',
          textAlign: 'center',
        }}>
          ⚠ {error} (PoC: configure AGORA_APP_ID in .env.local)
        </div>
      )}

      {/* Remote video area */}
      <div
        id="remote-video-container"
        style={{ width: '100%', height: '100%', background: '#0a0e18' }}
      >
        {isConnected && remoteUsers.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
            <Users size={32} color="var(--text-muted)" />
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Waiting for officer to share video...
            </div>
          </div>
        )}
        {remoteUsers.map((user) => (
          <div key={user.uid} id={`remote-${user.uid}`} style={{ width: '100%', height: '100%' }} />
        ))}
      </div>

      {/* Local video PiP */}
      {isConnected && (
        <div
          ref={localVideoRef}
          id="local-video"
          style={{
            position: 'absolute',
            bottom: 70,
            right: 12,
            width: 160,
            height: 90,
            background: '#1a2235',
            borderRadius: 8,
            border: '1px solid var(--bg-border)',
            overflow: 'hidden',
            zIndex: 5,
          }}
        >
          {isVideoMuted && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <VideoOff size={20} color="var(--text-muted)" />
            </div>
          )}
        </div>
      )}

      {/* Session info bar */}
      {isConnected && (
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          display: 'flex',
          gap: 8,
          zIndex: 5,
        }}>
          <div style={{
            background: 'rgba(239,68,68,0.9)',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em',
          }}>
            ● LIVE {formatElapsed(elapsed)}
          </div>
          <div style={{
            background: 'rgba(10,14,24,0.8)',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
          }}>
            {session.pu.puCode}
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
        padding: '20px 16px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        zIndex: 5,
      }}>
        <button
          onClick={toggleAudio}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: isAudioMuted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)',
            border: `1px solid ${isAudioMuted ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.2)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {isAudioMuted ? <MicOff size={16} color="var(--severity-critical)" /> : <Mic size={16} color="#fff" />}
        </button>

        <button
          onClick={handleEnd}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--severity-critical)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--glow-red)',
          }}
        >
          <PhoneOff size={20} color="#fff" />
        </button>

        <button
          onClick={toggleVideo}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: isVideoMuted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)',
            border: `1px solid ${isVideoMuted ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.2)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {isVideoMuted ? <VideoOff size={16} color="var(--severity-critical)" /> : <Video size={16} color="#fff" />}
        </button>
      </div>
    </div>
  )
}

// ─── Officer Card for stream requests ────────────────────────────────────────
function OfficerCard({ pu, onRequest }: { pu: MockPU; onRequest: (pu: MockPU) => void }) {
  const statusColor = pu.status === 'active' || pu.status === 'voting'
    ? 'var(--status-active)'
    : pu.status === 'offline'
    ? 'var(--status-offline)'
    : 'var(--text-muted)'

  return (
    <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Avatar */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'var(--bg-elevated)',
        border: `2px solid ${statusColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: statusColor }}>
          {pu.assignedOfficerName.charAt(0)}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {pu.assignedOfficerName}
        </div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--green-inec)', marginTop: 1 }}>
          {pu.puCode}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {pu.name}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Signal size={10} color={statusColor} />
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: statusColor }}>
            {pu.status.toUpperCase()}
          </span>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onRequest(pu)}
          disabled={pu.status === 'offline'}
          style={{ opacity: pu.status === 'offline' ? 0.4 : 1 }}
        >
          <Video size={12} />
          Stream
        </button>
      </div>
    </div>
  )
}

// ─── Live Video Page ──────────────────────────────────────────────────────────
export default function LiveVideoPanel() {
  const allPUs = getAllMockPUs()
  const activePUs = allPUs.filter((pu) => pu.status === 'active' || pu.status === 'voting')
  const [activeSession, setActiveSession] = useState<{ pu: MockPU; channelId: string } | null>(null)
  const [search, setSearch] = useState('')

  const handleRequestStream = (pu: MockPU) => {
    const channelId = `inec-${pu.puId.replace(/\//g, '-')}-${Date.now()}`
    setActiveSession({ pu, channelId })
  }

  const filteredPUs = activePUs.filter(
    (pu) =>
      !search ||
      pu.puCode.toLowerCase().includes(search.toLowerCase()) ||
      pu.assignedOfficerName.toLowerCase().includes(search.toLowerCase()) ||
      pu.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ height: '100%', display: 'flex', gap: 0, overflow: 'hidden' }}>
      {/* Officer list panel */}
      <div style={{
        width: 340,
        borderRight: '1px solid var(--bg-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: 20,
        gap: 12,
        overflow: 'hidden',
      }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>
            Live Video
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {activePUs.length} officers available for streaming
          </p>
        </div>

        <input
          className="input"
          placeholder="Search officer, PU code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredPUs.map((pu) => (
            <OfficerCard
              key={pu.puId}
              pu={pu}
              onRequest={handleRequestStream}
            />
          ))}
          {filteredPUs.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
              No officers match your search
            </div>
          )}
        </div>
      </div>

      {/* Video area */}
      <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
        {activeSession ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
                  {activeSession.pu.assignedOfficerName} — {activeSession.pu.puCode}
                </h3>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  Channel: {activeSession.channelId}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                <Monitor size={12} />
                Powered by Agora RTC
              </div>
            </div>

            <ActiveSession
              session={activeSession}
              onEnd={() => setActiveSession(null)}
            />

            <div className="panel" style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--text-primary)' }}>How it works:</strong>
              {' '}Admin clicks "Request Stream" →{' '}
              Firestore <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)', padding: '1px 4px', borderRadius: 3 }}>signaling</code>{' '}
              document updated → Officer's mobile app detects change and prompts them to join →{' '}
              Both sides connect to the same Agora channel using token from Firestore.
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            color: 'var(--text-muted)',
          }}>
            <Video size={48} strokeWidth={1} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)' }}>
              No Active Stream
            </div>
            <div style={{ fontSize: 12, maxWidth: 280, textAlign: 'center', lineHeight: 1.6 }}>
              Select an officer from the list and click <strong>Stream</strong> to request a live video feed from their polling unit.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
