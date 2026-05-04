// src/hooks/useAgora.ts
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface AgoraRTCClient {
  join: (appId: string, channel: string, token: string | null, uid: number | null) => Promise<number>
  leave: () => Promise<void>
  publish: (tracks: AgoraTrack[]) => Promise<void>
  subscribe: (user: AgoraRemoteUser, mediaType: 'video' | 'audio') => Promise<void>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on: (event: string, callback: (...args: any[]) => void) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off: (event: string, callback: (...args: any[]) => void) => void
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

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID ?? 'c12ef624608244059d1a19c8b1229423'

// Fetch token from our Vercel serverless function
async function fetchAgoraToken(channelName: string, uid: number): Promise<string | null> {
  try {
    const res = await fetch(`/api/agora-token?channel=${encodeURIComponent(channelName)}&uid=${uid}&role=publisher`)
    if (!res.ok) return null
    const data = await res.json()
    return data.token ?? null
  } catch {
    console.warn('Could not fetch Agora token, using null (test mode)')
    return null
  }
}

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

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }) as unknown as AgoraRTCClient
      clientRef.current = client

      client.on('user-published', async (user: AgoraRemoteUser, mediaType: 'video' | 'audio') => {
        await client.subscribe(user, mediaType)
        setRemoteUsers(prev => {
          const exists = prev.find(u => u.uid === user.uid)
          return exists ? prev.map(u => u.uid === user.uid ? user : u) : [...prev, user]
        })
      })

      client.on('user-unpublished', (user: AgoraRemoteUser) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
      })

      client.on('user-left', (user: AgoraRemoteUser) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
      })

      // Generate a unique UID for this session
      const uid = Math.floor(Math.random() * 100000)

      // Fetch token from our serverless function
      const token = await fetchAgoraToken(session.channelId, uid)

      // Join the channel
      await client.join(APP_ID, session.channelId, token, uid)

      // Create local tracks
      const [audioTrack, videoTrack] = await (AgoraRTC as {
        createMicrophoneAndCameraTracks: () => Promise<[AgoraTrack, AgoraTrack]>
      }).createMicrophoneAndCameraTracks()

      localAudioTrackRef.current = audioTrack
      localVideoTrackRef.current = videoTrack

      await client.publish([audioTrack, videoTrack])

      setIsConnected(true)
      setLocalVideoReady(true)
      setIsConnecting(false)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start video session'
      setError(message)
      setIsConnecting(false)
    }
  }, [getAgoraRTC])

  const endSession = useCallback(async () => {
    try {
      localVideoTrackRef.current?.stop()
      localVideoTrackRef.current?.close()
      localAudioTrackRef.current?.stop()
      localAudioTrackRef.current?.close()
      await clientRef.current?.leave()
    } catch (err) {
      console.error('Error ending session:', err)
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
      localVideoTrackRef.current.setEnabled(isVideoMuted)
      setIsVideoMuted(v => !v)
    }
  }, [isVideoMuted])

  const toggleAudio = useCallback(() => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.setEnabled(isAudioMuted)
      setIsAudioMuted(a => !a)
    }
  }, [isAudioMuted])

  const playRemoteVideo = useCallback((uid: number, elementId: string) => {
    const user = remoteUsers.find(u => u.uid === uid)
    if (user?.videoTrack) user.videoTrack.play(elementId)
  }, [remoteUsers])

  useEffect(() => {
    return () => { endSession() }
  }, [endSession])

  return {
    isConnected, isConnecting, localVideoReady,
    remoteUsers, error,
    startSession, endSession,
    toggleVideo, toggleAudio,
    isVideoMuted, isAudioMuted,
    playRemoteVideo,
  }
}
