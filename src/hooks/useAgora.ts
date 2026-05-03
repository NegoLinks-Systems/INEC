// src/hooks/useAgora.ts
// ─────────────────────────────────────────────────────────────────────────────
// Agora RTC integration hook for MINI-INEC 2.0
// Manages live video sessions between Admin and Field Officers
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from 'react'

// Agora types
interface AgoraRTCClient {
  join: (appId: string, channel: string, token: string | null, uid: number | null) => Promise<number>
  leave: () => Promise<void>
  publish: (tracks: AgoraTrack[]) => Promise<void>
  unpublish: (tracks?: AgoraTrack[]) => Promise<void>
  subscribe: (user: AgoraRemoteUser, mediaType: 'video' | 'audio') => Promise<void>
  on: (event: string, callback: (...args: unknown[]) => void) => void
  off: (event: string, callback: (...args: unknown[]) => void) => void
  remoteUsers: AgoraRemoteUser[]
}

interface AgoraTrack {
  play: (element: HTMLElement | string) => void
  stop: () => void
  close: () => void
  setEnabled: (enabled: boolean) => void
}

interface AgoraRemoteUser {
  uid: number
  videoTrack?: AgoraTrack
  audioTrack?: AgoraTrack
}

export interface AgoraSession {
  channelId: string
  targetOfficerId: string
  targetPUId: string
  officerName: string
}

export interface UseAgoraReturn {
  isConnected: boolean
  isConnecting: boolean
  localVideoReady: boolean
  remoteUsers: AgoraRemoteUser[]
  error: string | null
  startSession: (session: AgoraSession) => Promise<void>
  endSession: () => Promise<void>
  toggleVideo: () => void
  toggleAudio: () => void
  isVideoMuted: boolean
  isAudioMuted: boolean
  playRemoteVideo: (uid: number, elementId: string) => void
}

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || 'YOUR_AGORA_APP_ID'

export function useAgora(): UseAgoraReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [localVideoReady, setLocalVideoReady] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState<AgoraRemoteUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)

  const clientRef = useRef<AgoraRTCClient | null>(null)
  const localVideoTrackRef = useRef<AgoraTrack | null>(null)
  const localAudioTrackRef = useRef<AgoraTrack | null>(null)

  // Dynamically import Agora SDK (client-side only)
  const getAgoraRTC = useCallback(async () => {
    if (typeof window === 'undefined') return null
    const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
    return AgoraRTC
  }, [])

  const startSession = useCallback(async (session: AgoraSession) => {
    setIsConnecting(true)
    setError(null)

    try {
      const AgoraRTC = await getAgoraRTC()
      if (!AgoraRTC) throw new Error('Agora SDK not available')

      // Create client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }) as unknown as AgoraRTCClient
      clientRef.current = client

      // Listen for remote users
      client.on('user-published', async (user: AgoraRemoteUser, mediaType: 'video' | 'audio') => {
        await client.subscribe(user, mediaType)
        setRemoteUsers((prev) => {
          const exists = prev.find((u) => u.uid === user.uid)
          return exists ? prev.map((u) => (u.uid === user.uid ? user : u)) : [...prev, user]
        })
      })

      client.on('user-unpublished', (user: AgoraRemoteUser) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid))
      })

      client.on('user-left', (user: AgoraRemoteUser) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid))
      })

      // Join channel (token = null for testing; use token server in production)
      await client.join(AGORA_APP_ID, session.channelId, null, null)

      // Create local tracks
      const [audioTrack, videoTrack] = await (AgoraRTC as {
        createMicrophoneAndCameraTracks: () => Promise<[AgoraTrack, AgoraTrack]>
      }).createMicrophoneAndCameraTracks()

      localAudioTrackRef.current = audioTrack
      localVideoTrackRef.current = videoTrack

      // Publish local tracks
      await client.publish([audioTrack, videoTrack])

      setIsConnected(true)
      setLocalVideoReady(true)
      setIsConnecting(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start Agora session'
      setError(message)
      setIsConnecting(false)
      console.error('Agora session error:', err)
    }
  }, [getAgoraRTC])

  const endSession = useCallback(async () => {
    try {
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop()
        localVideoTrackRef.current.close()
      }
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop()
        localAudioTrackRef.current.close()
      }
      if (clientRef.current) {
        await clientRef.current.leave()
      }
    } catch (err) {
      console.error('Error ending Agora session:', err)
    } finally {
      setIsConnected(false)
      setLocalVideoReady(false)
      setRemoteUsers([])
      clientRef.current = null
      localVideoTrackRef.current = null
      localAudioTrackRef.current = null
    }
  }, [])

  const toggleVideo = useCallback(() => {
    if (localVideoTrackRef.current) {
      const newMuted = !isVideoMuted
      localVideoTrackRef.current.setEnabled(!newMuted)
      setIsVideoMuted(newMuted)
    }
  }, [isVideoMuted])

  const toggleAudio = useCallback(() => {
    if (localAudioTrackRef.current) {
      const newMuted = !isAudioMuted
      localAudioTrackRef.current.setEnabled(!newMuted)
      setIsAudioMuted(newMuted)
    }
  }, [isAudioMuted])

  const playRemoteVideo = useCallback((uid: number, elementId: string) => {
    const user = remoteUsers.find((u) => u.uid === uid)
    if (user?.videoTrack) {
      user.videoTrack.play(elementId)
    }
  }, [remoteUsers])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endSession()
    }
  }, [endSession])

  return {
    isConnected,
    isConnecting,
    localVideoReady,
    remoteUsers,
    error,
    startSession,
    endSession,
    toggleVideo,
    toggleAudio,
    isVideoMuted,
    isAudioMuted,
    playRemoteVideo,
  }
}
