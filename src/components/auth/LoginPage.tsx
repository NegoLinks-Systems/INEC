// src/components/auth/LoginPage.tsx
'use client'

import React, { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import { Eye, EyeOff, Loader, Lock } from 'lucide-react'

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
      const uid = credential.user.uid

      // Check if user profile exists in Firestore
      const userRef = doc(db, 'users', uid)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        // Auto-create profile for first superadmin login
        // In production this would be locked down
        await setDoc(userRef, {
          userId: uid,
          fullName: 'INEC Super Administrator',
          email: credential.user.email ?? email,
          phone: '',
          role: 'superadmin',
          isActive: true,
          lastLogin: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      } else {
        // Update last login
        const data = userDoc.data()
        const role = data?.role ?? ''
        const allowedRoles = ['superadmin', 'state_admin', 'lga_admin', 'ward_officer', 'observer']
        if (!allowedRoles.includes(role)) {
          setError('Access denied. Contact your administrator.')
          await auth.signOut()
          setIsLoading(false)
          return
        }
        if (!data?.isActive) {
          setError('Your account has been deactivated. Contact your administrator.')
          await auth.signOut()
          setIsLoading(false)
          return
        }
      }

      // Successful login — redirect
      window.location.href = '/dashboard'

    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/invalid-email'
      ) {
        setError('Invalid email or password. Please try again.')
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a few minutes and try again.')
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.')
      } else if (code === 'auth/user-disabled') {
        setError('This account has been disabled. Contact your administrator.')
      } else {
        // Log the actual error in console for debugging
        console.error('Login error:', err)
        setError(`Login failed (${code || 'unknown'}). Please try again.`)
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
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background glow effects */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at 30% 50%, rgba(0,166,81,0.07) 0%, transparent 60%),
          radial-gradient(ellipse at 70% 30%, rgba(0,100,50,0.05) 0%, transparent 60%)
        `,
      }} />

      {/* Grid pattern */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.03,
        backgroundImage: `linear-gradient(var(--bg-border) 1px, transparent 1px),
                          linear-gradient(90deg, var(--bg-border) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* Top badge */}
        <div style={{
          textAlign: 'center', marginBottom: 24,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.15em',
            color: 'var(--green-inec)', fontWeight: 700,
            background: 'rgba(0,166,81,0.08)',
            border: '1px solid rgba(0,166,81,0.25)',
            padding: '5px 14px', borderRadius: 20,
          }}>
            <Lock size={9} /> AUTHORIZED PERSONNEL ONLY
          </span>
        </div>

        {/* Main card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--bg-border)',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,166,81,0.05)',
        }}>

          {/* Green top bar */}
          <div style={{
            height: 4,
            background: 'linear-gradient(90deg, #00a651, #00cc66, #00a651)',
          }} />

          <div style={{ padding: '36px 36px 32px' }}>

            {/* Logo + Title */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 88, height: 88,
                background: '#000',
                borderRadius: 18,
                border: '1px solid rgba(0,166,81,0.3)',
                boxShadow: '0 0 30px rgba(0,166,81,0.15)',
                margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/inec-logo.png"
                  alt="INEC Logo"
                  style={{ width: 80, height: 80, objectFit: 'contain' }}
                />
              </div>

              <h1 style={{
                fontSize: 22, fontWeight: 800,
                color: '#ffffff',
                marginBottom: 6, lineHeight: 1.2,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '-0.03em',
              }}>
                INEC Command Dashboard
              </h1>
              <p style={{
                fontSize: 12, color: 'var(--text-secondary)',
                letterSpacing: '0.05em', fontFamily: 'monospace',
              }}>
                ELECTORAL OPERATIONS MONITORING · 2.0
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Email */}
              <div>
                <label style={{
                  display: 'block', marginBottom: 7,
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: '#a0aec0',
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="officer@inec.gov.ng"
                  required
                  autoComplete="email"
                  style={{
                    width: '100%', padding: '11px 14px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--bg-border)',
                    borderRadius: 10, outline: 'none',
                    color: '#e8edf5', fontSize: 14,
                    fontFamily: 'system-ui, sans-serif',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#00a651'}
                  onBlur={e => e.target.style.borderColor = 'var(--bg-border)'}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{
                  display: 'block', marginBottom: 7,
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: '#a0aec0',
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoComplete="current-password"
                    style={{
                      width: '100%', padding: '11px 42px 11px 14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--bg-border)',
                      borderRadius: 10, outline: 'none',
                      color: '#e8edf5', fontSize: 14,
                      fontFamily: 'system-ui, sans-serif',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#00a651'}
                    onBlur={e => e.target.style.borderColor = 'var(--bg-border)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', right: 12, top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      cursor: 'pointer', color: '#4a5568', padding: 4,
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8, padding: '10px 14px',
                  fontSize: 13, color: '#fc8181',
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  lineHeight: 1.5,
                }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>⚠</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                style={{
                  width: '100%', padding: '13px',
                  background: isLoading || !email || !password
                    ? 'rgba(0,166,81,0.4)'
                    : '#00a651',
                  border: 'none', borderRadius: 10,
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: isLoading || !email || !password ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.15s',
                  letterSpacing: '0.02em',
                  boxShadow: isLoading ? 'none' : '0 4px 20px rgba(0,166,81,0.3)',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                    Signing in...
                  </>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 36px 24px',
            borderTop: '1px solid var(--bg-border)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 11, color: '#4a5568', lineHeight: 1.7 }}>
              Restricted to authorized INEC personnel only.<br />
              Contact your supervisor if you need access.
            </p>
            <p style={{
              fontSize: 10, color: '#2d3748', marginTop: 8,
              fontFamily: 'monospace', letterSpacing: '0.05em',
            }}>
              Powered by NegoLinks Systems Ltd
            </p>
          </div>
        </div>

        {/* Version tag */}
        <p style={{
          textAlign: 'center', marginTop: 20,
          fontSize: 10, color: '#2d3748', fontFamily: 'monospace',
        }}>
          INEC 2.0 · BUILD {new Date().getFullYear()}
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input::placeholder { color: #2d3748; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #1a2235 inset !important;
          -webkit-text-fill-color: #e8edf5 !important;
        }
      `}</style>
    </div>
  )
}
