// src/middleware.ts
// Temporarily pass-through all routes while Firebase Auth is being set up
// We handle auth redirects client-side in the dashboard layout instead
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
