// mobile/App.tsx
// ─────────────────────────────────────────────────────────────────────────────
// INEC 2.0 Field Officer App — Main Entry Point
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, StatusBar,
  ActivityIndicator, SafeAreaView,
} from 'react-native'
import { fbAuth, db } from './src/firebase/config'
import { Colors } from './src/utils/theme'

// Screens
import LoginScreen from './src/screens/LoginScreen'
import HomeScreen from './src/screens/HomeScreen'
import VoteEntryScreen from './src/screens/VoteEntryScreen'
import IncidentScreen from './src/screens/IncidentScreen'
import GPSScreen from './src/screens/GPSScreen'

type Screen = 'login' | 'home' | 'vote' | 'incident' | 'video' | 'gps'

interface User {
  uid: string
  email: string
  fullName: string
  role: string
  assignedPU?: string
  assignedState?: string
  assignedLga?: string
  assignedWard?: string
  assignedVehicle?: string
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if already logged in
  useEffect(() => {
    const unsub = fbAuth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const doc = await db.collection('users').doc(firebaseUser.uid).get()
          if (doc.exists && doc.data()?.isActive) {
            const d = doc.data()!
            setUser({
              uid:             firebaseUser.uid,
              email:           firebaseUser.email ?? '',
              fullName:        d.fullName        ?? 'Field Officer',
              role:            d.role            ?? 'pu_officer',
              assignedPU:      d.assignedPU,
              assignedState:   d.assignedState,
              assignedLga:     d.assignedLga,
              assignedWard:    d.assignedWard,
              assignedVehicle: d.assignedVehicle,
            })
            setScreen('home')
          } else {
            setScreen('login')
          }
        } catch {
          // Offline — still show home if logged in
          setScreen('home')
        }
      } else {
        setScreen('login')
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser)
    setScreen('home')
  }

  const handleLogout = async () => {
    await fbAuth.signOut()
    setUser(null)
    setScreen('login')
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.green} />
        <Text style={styles.loadingText}>Loading INEC Field App...</Text>
      </View>
    )
  }

  const renderScreen = () => {
    if (screen === 'login' || !user) {
      return <LoginScreen onLogin={handleLogin} />
    }

    switch (screen) {
      case 'home':
        return (
          <HomeScreen
            user={user}
            onNavigate={(s) => setScreen(s as Screen)}
            onLogout={handleLogout}
          />
        )

      case 'vote':
        return (
          <VoteEntryScreen
            officerId={user.uid}
            puId={user.assignedPU ?? ''}
            wardId={user.assignedWard ?? ''}
            lgaId={user.assignedLga ?? ''}
            stateId={user.assignedState ?? ''}
            puName={user.assignedPU ?? 'My Polling Unit'}
            registeredVoters={0}
          />
        )

      case 'incident':
        return (
          <IncidentScreen
            user={user}
            onBack={() => setScreen('home')}
          />
        )

      case 'gps':
        return (
          <GPSScreen
            user={user}
            onBack={() => setScreen('home')}
          />
        )

      case 'video':
        return (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>📹</Text>
            <Text style={styles.placeholderTitle}>Live Video</Text>
            <Text style={styles.placeholderText}>
              Video sessions are initiated by HQ.{'\n'}
              You will receive a notification when{'\n'}
              an admin requests a live stream.
            </Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                💡 When HQ requests a stream, you will see a pop-up alert asking you to accept or decline the live video session.
              </Text>
            </View>
            <Text
              style={styles.backLink}
              onPress={() => setScreen('home')}
            >
              ← Back to Home
            </Text>
          </View>
        )

      default:
        return <HomeScreen user={user} onNavigate={(s) => setScreen(s as Screen)} onLogout={handleLogout} />
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgDark} />
      {renderScreen()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },

  loading: {
    flex: 1, backgroundColor: Colors.bgDark,
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },

  placeholder: {
    flex: 1, backgroundColor: Colors.bgDark,
    alignItems: 'center', justifyContent: 'center',
    padding: 32,
  },
  placeholderIcon:  { fontSize: 64, marginBottom: 16 },
  placeholderTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  placeholderText:  { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  infoCard: {
    marginTop: 20, backgroundColor: 'rgba(0,166,81,0.1)',
    borderRadius: 12, padding: 16, borderWidth: 1,
    borderColor: 'rgba(0,166,81,0.25)', maxWidth: 320,
  },
  infoText: { fontSize: 13, color: Colors.green, textAlign: 'center', lineHeight: 20 },
  backLink: { marginTop: 24, color: Colors.green, fontSize: 16, fontWeight: '600' },
})
