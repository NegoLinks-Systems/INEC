// mobile/src/screens/LoginScreen.tsx
import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { fbAuth, db } from '../firebase/config'
import { Colors } from '../utils/theme'

interface Props {
  onLogin: (user: {
    uid: string
    email: string
    fullName: string
    role: string
    assignedPU?: string
    assignedState?: string
    assignedLga?: string
    assignedWard?: string
    assignedVehicle?: string
  }) => void
}

export default function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Required', 'Please enter your email and password')
      return
    }
    setLoading(true)
    try {
      const cred = await fbAuth.signInWithEmailAndPassword(email.trim(), password)
      const userDoc = await db.collection('users').doc(cred.user.uid).get()

      if (!userDoc.exists) {
        Alert.alert('Access Denied', 'Your account is not registered. Contact INEC HQ.')
        await fbAuth.signOut()
        setLoading(false)
        return
      }

      const data = userDoc.data()!
      if (!data.isActive) {
        Alert.alert('Account Disabled', 'Your account has been deactivated. Contact your supervisor.')
        await fbAuth.signOut()
        setLoading(false)
        return
      }

      // Update last login
      await db.collection('users').doc(cred.user.uid).update({
        lastLogin: db.app.firestore.FieldValue.serverTimestamp(),
      })

      onLogin({
        uid:             cred.user.uid,
        email:           cred.user.email ?? email,
        fullName:        data.fullName        ?? 'Field Officer',
        role:            data.role            ?? 'pu_officer',
        assignedPU:      data.assignedPU,
        assignedState:   data.assignedState,
        assignedLga:     data.assignedLga,
        assignedWard:    data.assignedWard,
        assignedVehicle: data.assignedVehicle,
      })
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
        Alert.alert('Login Failed', 'Invalid email or password.')
      } else if (code.includes('network')) {
        Alert.alert('Network Error', 'Check your internet connection and try again.')
      } else {
        Alert.alert('Error', 'Login failed. Please try again.')
      }
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Image
              source={require('../assets/inec-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>INEC Field Officer</Text>
          <Text style={styles.subtitle}>ELECTORAL OPERATIONS APP · 2.0</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🔒 AUTHORIZED PERSONNEL ONLY</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="officer@inec.gov.ng"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>PASSWORD</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(v => !v)}
              style={styles.eyeBtn}
            >
              <Text style={{ color: Colors.textMuted, fontSize: 16 }}>
                {showPassword ? '🙈' : '👁'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.btnText}>Sign In</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Powered by NegoLinks Systems Ltd
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 24,
  },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logoBox: {
    width: 88, height: 88,
    backgroundColor: '#000',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.greenDark,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logo: { width: 80, height: 80 },
  title: {
    fontSize: 22, fontWeight: '800',
    color: Colors.textPrimary, marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11, color: Colors.textMuted,
    letterSpacing: 1.5, fontFamily: 'Courier New',
  },
  badge: {
    marginTop: 10,
    backgroundColor: 'rgba(0,166,81,0.1)',
    borderWidth: 1, borderColor: 'rgba(0,166,81,0.25)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  badgeText: { fontSize: 10, color: Colors.green, fontWeight: '700' },

  form: { width: '100%', maxWidth: 400 },
  label: {
    fontSize: 11, fontWeight: '700',
    letterSpacing: 1.2, color: Colors.textSecondary,
    textTransform: 'uppercase', marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1, borderColor: Colors.bgBorder,
    borderRadius: 10, padding: 12,
    color: Colors.textPrimary, fontSize: 14,
    width: '100%',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { marginLeft: 8, padding: 10 },
  btn: {
    marginTop: 24, backgroundColor: Colors.green,
    borderRadius: 10, padding: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  footer: {
    marginTop: 32, fontSize: 10,
    color: Colors.textMuted, fontFamily: 'Courier New',
  },
})
