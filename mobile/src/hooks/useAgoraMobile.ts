// mobile/src/hooks/useAgoraMobile.ts
// ─────────────────────────────────────────────────────────────────────────────
// MINI-INEC 2.0 — Agora Mobile SDK Integration (Module 4 — Mobile Side)
//
// Flow:
// 1. Admin updates Firestore signaling/{channelId} → status: 'pending'
// 2. This hook listens to signaling docs for this officer's assigned PU
// 3. When a request arrives, officer is prompted to accept/decline
// 4. On accept → join Agora channel using channelId from Firestore
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import { Alert } from 'react-native'
import firestore from '@react-native-firebase/firestore'
import {
  createAgoraRtcEngine,
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
} from 'react-native-agora'

const AGORA_APP_ID = process.env.AGORA_APP_ID || 'YOUR_AGORA_APP_ID'

export interface IncomingCallData {
  channelId: string
  signalingDocId: string
  requestedByName: string
  puId: string
  agoraToken?: string
  agoraUid?: number
}

export function useAgoraMobile(officerId: string, assignedPUId: string) {
  const [engine, setEngine] = useState<IRtcEngine | null>(null)
  const [isInCall, setIsInCall] = useState(false)
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)

  // ─── Initialize Agora engine ────────────────────────────────────────────────
  useEffect(() => {
    const agoraEngine = createAgoraRtcEngine()
    agoraEngine.initialize({ appId: AGORA_APP_ID })
    agoraEngine.enableVideo()
    agoraEngine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication)
    setEngine(agoraEngine)

    return () => {
      agoraEngine.release()
    }
  }, [])

  // ─── Listen for incoming stream requests via Firestore signaling ────────────
  // This is the Firestore-based WebRTC signaling mechanism
  useEffect(() => {
    if (!officerId || !assignedPUId) return

    // Listen for ANY pending signaling document targeting this officer
    const unsubscribe = firestore()
      .collection('signaling')
      .where('targetOfficerId', '==', officerId)
      .where('status', '==', 'pending')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data()
            const callData: IncomingCallData = {
              channelId: data.channelId,
              signalingDocId: change.doc.id,
              requestedByName: 'HQ Admin',  // In production, fetch from /users/{requestedBy}
              puId: data.targetPUId,
              agoraToken: data.agoraToken,
              agoraUid: data.agoraUid,
            }
            setIncomingCall(callData)

            // Show native alert prompt to officer
            Alert.alert(
              '📹 Live Stream Request',
              'HQ Admin is requesting a live video feed from your polling unit. Do you want to accept?',
              [
                {
                  text: 'Decline',
                  style: 'destructive',
                  onPress: () => declineCall(callData),
                },
                {
                  text: 'Accept',
                  onPress: () => acceptCall(callData),
                },
              ],
              { cancelable: false }
            )
          }
        })
      })

    return () => unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officerId, assignedPUId])

  // ─── Accept Call ────────────────────────────────────────────────────────────
  const acceptCall = useCallback(async (call: IncomingCallData) => {
    if (!engine) return

    // Update Firestore signaling doc
    await firestore().collection('signaling').doc(call.signalingDocId).update({
      status: 'accepted',
      officerAcceptedAt: firestore.FieldValue.serverTimestamp(),
      officerJoined: true,
    })

    // Join Agora channel
    engine.setClientRole(ClientRoleType.ClientRoleBroadcaster)
    await engine.joinChannel(
      call.agoraToken || null,  // null = no token (test mode)
      call.channelId,
      call.agoraUid || 0,       // 0 = let Agora assign UID
      {}
    )

    // Update signaling to active
    await firestore().collection('signaling').doc(call.signalingDocId).update({
      status: 'active',
      sessionStartedAt: firestore.FieldValue.serverTimestamp(),
    })

    setIsInCall(true)
    setIncomingCall(null)
  }, [engine])

  // ─── Decline Call ───────────────────────────────────────────────────────────
  const declineCall = useCallback(async (call: IncomingCallData) => {
    await firestore().collection('signaling').doc(call.signalingDocId).update({
      status: 'declined',
      declineReason: 'Officer declined',
    })
    setIncomingCall(null)
  }, [])

  // ─── End Call ───────────────────────────────────────────────────────────────
  const endCall = useCallback(async (signalingDocId?: string) => {
    if (engine) {
      await engine.leaveChannel()
    }
    if (signalingDocId) {
      await firestore().collection('signaling').doc(signalingDocId).update({
        status: 'ended',
        officerJoined: false,
        sessionEndedAt: firestore.FieldValue.serverTimestamp(),
      })
    }
    setIsInCall(false)
  }, [engine])

  const toggleVideo = useCallback(() => {
    if (!engine) return
    engine.muteLocalVideoStream(isVideoEnabled)
    setIsVideoEnabled((v) => !v)
  }, [engine, isVideoEnabled])

  const toggleAudio = useCallback(() => {
    if (!engine) return
    engine.muteLocalAudioStream(isAudioEnabled)
    setIsAudioEnabled((a) => !a)
  }, [engine, isAudioEnabled])

  return {
    engine,
    isInCall,
    incomingCall,
    isVideoEnabled,
    isAudioEnabled,
    acceptCall,
    declineCall,
    endCall,
    toggleVideo,
    toggleAudio,
    RtcSurfaceView,
  }
}
