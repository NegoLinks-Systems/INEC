// src/components/auth/LoginPage.tsx
'use client'

import React, { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import { Shield, Eye, EyeOff, Loader } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      // Check role in Firestore
      const userDoc = await getDoc(doc(db, 'users', credential.user.uid))
      if (!userDoc.exists()) {
        setError('User profile not found. Contact your administrator.')
        await auth.signOut()
        setIsLoading(false)
        return
      }
      const role = userDoc.data().role
      const adminRoles = ['superadmin', 'state_admin', 'lga_admin', 'observer']
      if (!adminRoles.includes(role)) {
        setError('Access denied. This dashboard is for admin users only.')
        await auth.signOut()
        setIsLoading(false)
        return
      }
      // Redirect to dashboard
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.')
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.')
      } else {
        setError('Login failed. Please check your connection and try again.')
      }
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-void)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: 'var(--font-body)',
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(0,166,81,0.05) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, rgba(0,166,81,0.03) 0%, transparent 50%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: 420,
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--bg-border)',
          borderRadius: 16,
          padding: '40px 36px',
          boxShadow: 'var(--shadow-elevated)',
        }}>
          {/* INEC Logo + Title */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 80,
              height: 80,
              background: '#000',
              borderRadius: 16,
              border: '2px solid var(--green-dim)',
              boxShadow: 'var(--glow-green)',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/inec-logo.png"
                alt="INEC Logo"
                style={{ width: 76, height: 76, objectFit: 'contain' }}
              />
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: 4,
              letterSpacing: '-0.02em',
            }}>
              INEC Command Dashboard
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              ELECTORAL OPERATIONS MONITORING
            </p>
            <div style={{
              marginTop: 8,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(0,166,81,0.08)',
              border: '1px solid rgba(0,166,81,0.2)',
              borderRadius: 20,
              padding: '4px 12px',
            }}>
              <Shield size={10} color="var(--green-inec)" />
              <span style={{ fontSize: 10, color: 'var(--green-inec)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
                AUTHORIZED PERSONNEL ONLY
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                marginBottom: 6,
              }}>
                Email Address
              </label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@inec.gov.ng"
                required
                autoComplete="email"
                style={{ fontSize: 14 }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                marginBottom: 6,
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ fontSize: 14, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 4,
                  }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 16,
                fontSize: 13,
                color: 'var(--severity-critical)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: 14,
                justifyContent: 'center',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Signing in...</>
              ) : (
                <><Shield size={14} /> Sign In to Dashboard</>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid var(--bg-border)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Access restricted to authorized INEC personnel.<br />
              Contact your supervisor if you need access.
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
              Powered by NegoLinks Systems Ltd
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
