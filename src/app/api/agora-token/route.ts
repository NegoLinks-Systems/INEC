// src/app/api/agora-token/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// INEC 2.0 — Agora Token Server (Vercel Serverless Function)
// Generates secure RTC tokens for live video sessions
// Called by the dashboard when admin requests a stream
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { RtcTokenBuilder, RtcRole } from 'agora-token'

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID ?? 'c12ef624608244059d1a19c8b1229423'
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE ?? '0fdccb8a51dc4a64bfa50ab455fe1864'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const channelName = searchParams.get('channel')
  const uid = parseInt(searchParams.get('uid') ?? '0')
  const role = searchParams.get('role') === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER

  if (!channelName) {
    return NextResponse.json({ error: 'channel parameter is required' }, { status: 400 })
  }

  try {
    // Token expires in 1 hour (3600 seconds)
    const expirationTimeInSeconds = 3600
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
      privilegeExpiredTs
    )

    return NextResponse.json({
      token,
      channelName,
      uid,
      appId: APP_ID,
      expiresAt: privilegeExpiredTs,
    })
  } catch (err) {
    console.error('Agora token generation failed:', err)
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
  }
}

// Handle preflight CORS for mobile app
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
