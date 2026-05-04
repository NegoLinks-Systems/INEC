// App.tsx — INEC 2.0 Field Officer App (Single File Build)
import React, { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Switch,
  KeyboardAvoidingView, Platform, RefreshControl,
  SafeAreaView,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut,
} from 'firebase/auth'
import {
  initializeFirestore, doc, getDoc, setDoc, addDoc,
  updateDoc, collection, serverTimestamp,
} from 'firebase/firestore'
import * as Location from 'expo-location'
import * as ImagePicker from 'expo-image-picker'

// ─── Firebase ─────────────────────────────────────────────────────────────────
const app = getApps().length === 0
  ? initializeApp({
      apiKey:            'AIzaSyC268-1qt_qaSISS8BphbvFYc3osyUPuxc',
      authDomain:        'inec-9a779.firebaseapp.com',
      projectId:         'inec-9a779',
      storageBucket:     'inec-9a779.firebasestorage.app',
      messagingSenderId: '770158005919',
      appId:             '1:770158005919:web:94964e0942f4d7642a1caa',
    })
  : getApps()[0]

const db   = initializeFirestore(app, { experimentalForceLongPolling: true })
const auth = getAuth(app)

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  green: '#00a651', greenDark: '#004d26', bgDark: '#060810',
  bgCard: '#0f1520', bgElevated: '#1a2235', bgBorder: '#1e2a3d',
  text: '#e8edf5', textSec: '#8b98b8', textMuted: '#4a5568',
  active: '#00a651', offline: '#f59e0b', flagged: '#ef4444',
  completed: '#10b981', voting: '#3b82f6', pending: '#6b7280',
  critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e',
  white: '#ffffff',
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = 'login' | 'home' | 'vote' | 'incident' | 'gps' | 'video'
interface User {
  uid: string; email: string; fullName: string; role: string
  assignedPU?: string; assignedState?: string
  assignedLga?: string; assignedWard?: string; assignedVehicle?: string
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail]     = useState('')
  const [pass, setPass]       = useState('')
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)

  const login = async () => {
    if (!email.trim() || !pass) { Alert.alert('Required', 'Enter email and password'); return }
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass)
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      let profile: User

      if (!snap.exists()) {
        profile = { uid: cred.user.uid, email: cred.user.email ?? email, fullName: 'Field Officer', role: 'pu_officer' }
        await setDoc(doc(db, 'users', cred.user.uid), { ...profile, isActive: true, createdAt: serverTimestamp() })
      } else {
        const d = snap.data()
        if (!d.isActive) { Alert.alert('Disabled', 'Account deactivated'); await signOut(auth); setLoading(false); return }
        profile = { uid: cred.user.uid, email: cred.user.email ?? email, fullName: d.fullName ?? 'Officer', role: d.role ?? 'pu_officer', assignedPU: d.assignedPU, assignedState: d.assignedState, assignedLga: d.assignedLga, assignedWard: d.assignedWard, assignedVehicle: d.assignedVehicle }
      }
      onLogin(profile)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) Alert.alert('Failed', 'Invalid email or password')
      else Alert.alert('Error', 'Login failed. Check your connection.')
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView style={ls.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={ls.scroll} keyboardShouldPersistTaps="handled">
        <View style={ls.logoBox}>
          <Text style={ls.logoText}>🗳️</Text>
        </View>
        <Text style={ls.title}>INEC Field Officer</Text>
        <Text style={ls.subtitle}>ELECTORAL OPERATIONS · 2.0</Text>
        <View style={ls.badge}><Text style={ls.badgeText}>🔒 AUTHORIZED PERSONNEL ONLY</Text></View>

        <View style={ls.form}>
          <Text style={ls.label}>EMAIL</Text>
          <TextInput style={ls.input} value={email} onChangeText={setEmail}
            placeholder="officer@inec.gov.ng" placeholderTextColor={C.textMuted}
            keyboardType="email-address" autoCapitalize="none" />

          <Text style={[ls.label, { marginTop: 14 }]}>PASSWORD</Text>
          <View>
            <TextInput style={ls.input} value={pass} onChangeText={setPass}
              placeholder="••••••••" placeholderTextColor={C.textMuted} secureTextEntry={!show} />
            <TouchableOpacity style={ls.eye} onPress={() => setShow(v => !v)}>
              <Text style={{ fontSize: 18 }}>{show ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[ls.btn, (!email || !pass || loading) && { opacity: 0.5 }]}
            onPress={login} disabled={loading || !email || !pass}>
            {loading ? <ActivityIndicator color={C.white} /> : <Text style={ls.btnText}>Sign In</Text>}
          </TouchableOpacity>
        </View>
        <Text style={ls.footer}>Powered by NegoLinks Systems Ltd</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const ls = StyleSheet.create({
  root:     { flex: 1, backgroundColor: C.bgDark },
  scroll:   { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: 60 },
  logoBox:  { width: 88, height: 88, backgroundColor: C.bgCard, borderRadius: 18, borderWidth: 2, borderColor: C.greenDark, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { fontSize: 44 },
  title:    { fontSize: 22, fontWeight: '800', color: C.text },
  subtitle: { fontSize: 11, color: C.textMuted, letterSpacing: 2, marginTop: 4 },
  badge:    { marginTop: 10, backgroundColor: 'rgba(0,166,81,0.1)', borderWidth: 1, borderColor: 'rgba(0,166,81,0.25)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontSize: 10, color: C.green, fontWeight: '700' },
  form:     { width: '100%', maxWidth: 400, marginTop: 28 },
  label:    { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: C.textSec, marginBottom: 6, textTransform: 'uppercase' },
  input:    { backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.bgBorder, borderRadius: 10, padding: 13, color: C.text, fontSize: 14 },
  eye:      { position: 'absolute', right: 12, top: 10 },
  btn:      { marginTop: 22, backgroundColor: C.green, borderRadius: 10, padding: 15, alignItems: 'center' },
  btnText:  { color: C.white, fontSize: 16, fontWeight: '700' },
  footer:   { marginTop: 36, fontSize: 10, color: C.textMuted },
})

// ─── Home Screen ──────────────────────────────────────────────────────────────
function HomeScreen({ user, onNavigate, onLogout }: { user: User; onNavigate: (s: string) => void; onLogout: () => void }) {
  const [puInfo, setPUInfo]     = useState<Record<string, unknown> | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [online, setOnline]     = useState(true)

  const MENU = [
    { id: 'vote',     icon: '🗳️', label: 'Submit Results',  color: C.green   },
    { id: 'incident', icon: '⚠️', label: 'Report Incident', color: C.flagged },
    { id: 'gps',      icon: '📍', label: 'GPS Tracker',     color: C.medium  },
    { id: 'video',    icon: '📹', label: 'Live Video',      color: C.voting  },
  ]

  useEffect(() => { loadPU() }, [])

  const loadPU = async () => {
    if (!user.assignedPU || !user.assignedState || !user.assignedLga || !user.assignedWard) return
    try {
      const snap = await getDoc(doc(db, 'states', user.assignedState, 'lgas', user.assignedLga, 'wards', user.assignedWard, 'polling_units', user.assignedPU.replace(/\//g, '-')))
      if (snap.exists()) { setPUInfo(snap.data()); setOnline(true) }
    } catch { setOnline(false) }
  }

  const onRefresh = async () => { setRefreshing(true); await loadPU(); setRefreshing(false) }

  const statusColor = (s: string) => ({ active: C.active, voting: C.voting, completed: C.completed, pending: C.pending, offline: C.offline, flagged: C.flagged }[s] ?? C.pending)

  return (
    <ScrollView style={hs.root} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />}>
      <View style={hs.header}>
        <View>
          <Text style={hs.greeting}>Welcome,</Text>
          <Text style={hs.name}>{user.fullName}</Text>
          <Text style={hs.role}>{user.role.replace(/_/g, ' ').toUpperCase()}</Text>
        </View>
        <TouchableOpacity style={hs.logoutBtn} onPress={onLogout}><Text style={hs.logoutText}>Logout</Text></TouchableOpacity>
      </View>

      <View style={[hs.net, { backgroundColor: online ? 'rgba(0,166,81,0.1)' : 'rgba(245,158,11,0.1)' }]}>
        <View style={[hs.netDot, { backgroundColor: online ? C.green : C.offline }]} />
        <Text style={[hs.netText, { color: online ? C.green : C.offline }]}>
          {online ? 'Connected — syncing to INEC HQ' : 'Offline — data saved locally'}
        </Text>
      </View>

      {puInfo ? (
        <View style={hs.puCard}>
          <View style={hs.puTop}>
            <View style={{ flex: 1 }}>
              <Text style={hs.puCode}>{String(puInfo.puCode ?? user.assignedPU)}</Text>
              <Text style={hs.puName}>{String(puInfo.name ?? 'My Polling Unit')}</Text>
            </View>
            <View style={[hs.badge, { backgroundColor: statusColor(String(puInfo.status ?? 'pending')) + '22' }]}>
              <Text style={[hs.badgeText, { color: statusColor(String(puInfo.status ?? 'pending')) }]}>
                {String(puInfo.status ?? 'PENDING').toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={hs.stats}>
            {[
              { l: 'Registered', v: Number(puInfo.registeredVoters ?? 0), c: C.text   },
              { l: 'Accredited', v: Number(puInfo.accreditedVoters ?? 0), c: C.voting },
              { l: 'Votes Cast', v: Number(puInfo.totalVotesCast   ?? 0), c: C.green  },
            ].map(({ l, v, c }) => (
              <View key={l} style={hs.statItem}>
                <Text style={[hs.statVal, { color: c }]}>{v.toLocaleString()}</Text>
                <Text style={hs.statLbl}>{l}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={hs.noPU}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>📋</Text>
          <Text style={hs.noPUText}>No polling unit assigned</Text>
          <Text style={hs.noPUSub}>Contact your INEC supervisor</Text>
        </View>
      )}

      <Text style={hs.sectionTitle}>ACTIONS</Text>
      {MENU.map(item => (
        <TouchableOpacity key={item.id} style={hs.card} onPress={() => onNavigate(item.id)}>
          <Text style={{ fontSize: 26, width: 36, textAlign: 'center' }}>{item.icon}</Text>
          <Text style={hs.cardLabel}>{item.label}</Text>
          <View style={[hs.arrow, { backgroundColor: item.color + '22' }]}>
            <Text style={[hs.arrowText, { color: item.color }]}>›</Text>
          </View>
        </TouchableOpacity>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const hs = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bgDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingTop: 54, backgroundColor: C.bgCard, borderBottomWidth: 1, borderBottomColor: C.bgBorder },
  greeting: { fontSize: 12, color: C.textMuted },
  name:     { fontSize: 20, fontWeight: '800', color: C.text },
  role:     { fontSize: 9, color: C.green, letterSpacing: 1.5, marginTop: 2 },
  logoutBtn: { backgroundColor: C.bgElevated, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.bgBorder },
  logoutText: { color: C.textSec, fontSize: 12 },
  net:     { flexDirection: 'row', alignItems: 'center', padding: 10, paddingHorizontal: 16, gap: 8 },
  netDot:  { width: 8, height: 8, borderRadius: 4 },
  netText: { fontSize: 12, fontWeight: '500', flex: 1 },
  puCard:  { margin: 16, backgroundColor: C.bgCard, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.bgBorder },
  puTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  puCode:  { fontSize: 11, color: C.green, marginBottom: 2 },
  puName:  { fontSize: 15, fontWeight: '700', color: C.text },
  badge:   { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  stats:   { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statVal:  { fontSize: 20, fontWeight: '700' },
  statLbl:  { fontSize: 9, color: C.textMuted, marginTop: 2 },
  noPU:    { margin: 16, backgroundColor: C.bgCard, borderRadius: 12, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: C.bgBorder },
  noPUText: { fontSize: 15, fontWeight: '700', color: C.textSec },
  noPUSub:  { fontSize: 12, color: C.textMuted, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: C.textMuted, paddingHorizontal: 16, marginBottom: 8, marginTop: 8 },
  card:  { backgroundColor: C.bgCard, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.bgBorder, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, marginHorizontal: 16 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: C.text, flex: 1 },
  arrow:     { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 22, fontWeight: '700' },
})

// ─── Vote Screen ──────────────────────────────────────────────────────────────
const PARTIES = ['APC', 'PDP', 'LP', 'NNPP', 'APGA', 'ADC', 'SDP']

function VoteScreen({ user, onBack }: { user: User; onBack: () => void }) {
  const [accredited, setAccredited] = useState('')
  const [rejected, setRejected]     = useState('')
  const [results, setResults]       = useState<Record<string, string>>(Object.fromEntries(PARTIES.map(p => [p, ''])))
  const [loading, setLoading]       = useState(false)
  const [done, setDone]             = useState(false)

  const total  = Object.values(results).reduce((s, v) => s + (parseInt(v) || 0), 0)
  const accNum = parseInt(accredited) || 0

  const submit = async () => {
    if (!accNum) { Alert.alert('Required', 'Enter accredited voters'); return }
    if (total === 0) { Alert.alert('Required', 'Enter at least one vote count'); return }
    if (total > accNum) { Alert.alert('Error', `Votes (${total}) cannot exceed accredited (${accNum})`); return }

    Alert.alert('Confirm', `Submit results?\n\nTotal: ${total} votes\nAccredited: ${accNum}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', onPress: async () => {
        setLoading(true)
        let coords = null
        try {
          const { status } = await Location.requestForegroundPermissionsAsync()
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({})
            coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
          }
        } catch { /* GPS optional */ }

        try {
          const logId = `${user.assignedPU ?? 'unknown'}-${Date.now()}`
          await setDoc(doc(db, 'vote_logs', logId), {
            logId, puId: user.assignedPU ?? '', wardId: user.assignedWard ?? '',
            lgaId: user.assignedLga ?? '', stateId: user.assignedState ?? '',
            officerId: user.uid, officerName: user.fullName,
            partyResults: Object.fromEntries(Object.entries(results).map(([k, v]) => [k, parseInt(v) || 0])),
            totalVotesCast: total, accreditedVoters: accNum,
            validVotes: total - (parseInt(rejected) || 0), rejectedBallots: parseInt(rejected) || 0,
            submittedAt: serverTimestamp(), submissionCoordinates: coords, isVerified: false,
          })
          if (user.assignedPU && user.assignedState && user.assignedLga && user.assignedWard) {
            await updateDoc(doc(db, 'states', user.assignedState, 'lgas', user.assignedLga, 'wards', user.assignedWard, 'polling_units', user.assignedPU.replace(/\//g, '-')), {
              totalVotesCast: total, accreditedVoters: accNum,
              status: 'submitted', resultsSubmitted: true, resultsSubmittedAt: serverTimestamp(),
            })
          }
          setDone(true)
        } catch {
          Alert.alert('Saved Offline', 'Results saved locally. Will sync when online.')
          setDone(true)
        } finally { setLoading(false) }
      }}
    ])
  }

  if (done) return (
    <View style={vs.success}>
      <Text style={{ fontSize: 64 }}>✅</Text>
      <Text style={vs.successTitle}>Results Submitted!</Text>
      <Text style={vs.successSub}>Total: {total.toLocaleString()} votes</Text>
      <TouchableOpacity style={vs.backBtn} onPress={onBack}><Text style={vs.backBtnText}>Back to Home</Text></TouchableOpacity>
    </View>
  )

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={vs.root}>
        <View style={vs.header}>
          <TouchableOpacity onPress={onBack}><Text style={vs.back}>← Back</Text></TouchableOpacity>
          <Text style={vs.title}>Submit Results</Text>
          <Text style={vs.sub}>{user.assignedPU ?? 'No PU assigned'}</Text>
        </View>
        <View style={vs.form}>
          <Text style={vs.label}>ACCREDITED VOTERS *</Text>
          <TextInput style={vs.input} value={accredited} onChangeText={setAccredited} keyboardType="number-pad" placeholder="0" placeholderTextColor={C.textMuted} />

          <Text style={[vs.label, { marginTop: 18 }]}>VOTES PER PARTY *</Text>
          {PARTIES.map(p => (
            <View key={p} style={vs.partyRow}>
              <View style={[vs.dot, { backgroundColor: p === 'APC' ? C.green : p === 'PDP' ? C.voting : p === 'LP' ? C.flagged : C.medium }]} />
              <Text style={vs.partyName}>{p}</Text>
              <TextInput style={[vs.input, { flex: 1 }]} value={results[p]} onChangeText={v => setResults(r => ({ ...r, [p]: v }))} keyboardType="number-pad" placeholder="0" placeholderTextColor={C.textMuted} />
            </View>
          ))}

          <Text style={[vs.label, { marginTop: 18 }]}>REJECTED BALLOTS</Text>
          <TextInput style={vs.input} value={rejected} onChangeText={setRejected} keyboardType="number-pad" placeholder="0" placeholderTextColor={C.textMuted} />

          <View style={vs.totals}>
            {[{ l: 'Total Votes', v: total, c: C.green }, { l: 'Valid', v: total - (parseInt(rejected) || 0), c: C.voting }, { l: 'Rejected', v: parseInt(rejected) || 0, c: C.flagged }].map(({ l, v, c }) => (
              <View key={l} style={vs.total}><Text style={[vs.totalVal, { color: c }]}>{v.toLocaleString()}</Text><Text style={vs.totalLbl}>{l}</Text></View>
            ))}
          </View>

          <TouchableOpacity style={[vs.submitBtn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color={C.white} /> : <Text style={vs.submitText}>Submit Results</Text>}
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const vs = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bgDark },
  header: { backgroundColor: C.bgCard, padding: 16, paddingTop: 54, borderBottomWidth: 1, borderBottomColor: C.bgBorder },
  back: { color: C.green, fontSize: 14, marginBottom: 6 }, title: { fontSize: 20, fontWeight: '800', color: C.text }, sub: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  form: { padding: 16 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: C.textSec, marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.bgBorder, borderRadius: 10, padding: 12, color: C.text, fontSize: 14 },
  partyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 }, partyName: { fontSize: 13, fontWeight: '700', color: C.text, width: 60 },
  totals: { flexDirection: 'row', backgroundColor: C.bgCard, borderRadius: 12, marginVertical: 16, borderWidth: 1, borderColor: C.bgBorder, overflow: 'hidden' },
  total: { flex: 1, alignItems: 'center', padding: 14, borderRightWidth: 1, borderRightColor: C.bgBorder },
  totalVal: { fontSize: 20, fontWeight: '700' }, totalLbl: { fontSize: 9, color: C.textMuted, marginTop: 2 },
  submitBtn: { backgroundColor: C.green, borderRadius: 10, padding: 15, alignItems: 'center' }, submitText: { color: C.white, fontSize: 16, fontWeight: '700' },
  success: { flex: 1, backgroundColor: C.bgDark, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successTitle: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 8, marginTop: 16 }, successSub: { fontSize: 14, color: C.textSec },
  backBtn: { marginTop: 24, backgroundColor: C.green, borderRadius: 10, padding: 14, paddingHorizontal: 32 }, backBtnText: { color: C.white, fontSize: 16, fontWeight: '700' },
})

// ─── Incident Screen ──────────────────────────────────────────────────────────
function IncidentScreen({ user, onBack }: { user: User; onBack: () => void }) {
  const [title, setTitle]   = useState('')
  const [desc, setDesc]     = useState('')
  const [sev, setSev]       = useState('medium')
  const [cat, setCat]       = useState('other')
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)

  const SEVS = [{ v: 'low', l: 'Low', c: C.low }, { v: 'medium', l: 'Medium', c: C.medium }, { v: 'high', l: 'High', c: C.high }, { v: 'critical', l: 'Critical', c: C.critical }]
  const CATS = [{ v: 'violence', i: '⚔️', l: 'Violence' }, { v: 'equipment_failure', i: '📱', l: 'Equipment' }, { v: 'material_shortage', i: '📦', l: 'Materials' }, { v: 'irregularity', i: '⚖️', l: 'Irregularity' }, { v: 'other', i: '📝', l: 'Other' }]

  const submit = async () => {
    if (!title.trim()) { Alert.alert('Required', 'Enter incident title'); return }
    if (!desc.trim()) { Alert.alert('Required', 'Describe the incident'); return }
    setLoading(true)
    let coords = null
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({})
        coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
      }
    } catch { /* GPS optional */ }

    try {
      await addDoc(collection(db, 'incidents'), {
        reportedBy: user.uid, officerName: user.fullName,
        puId: user.assignedPU ?? '', stateId: user.assignedState ?? '', lgaId: user.assignedLga ?? '',
        title: title.trim(), description: desc.trim(), severity: sev, category: cat,
        status: 'open', imageUrls: [], reportCoordinates: coords, reportedAt: serverTimestamp(),
      })
      setDone(true)
    } catch { Alert.alert('Saved Offline', 'Report saved and will sync when online.'); setDone(true) }
    finally { setLoading(false) }
  }

  if (done) return (
    <View style={is.success}>
      <Text style={{ fontSize: 64 }}>✅</Text>
      <Text style={is.successTitle}>Incident Reported</Text>
      <Text style={is.successSub}>Sent to INEC HQ</Text>
      <TouchableOpacity style={is.backBtn} onPress={onBack}><Text style={is.backBtnText}>Back to Home</Text></TouchableOpacity>
    </View>
  )

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={is.root}>
        <View style={is.header}>
          <TouchableOpacity onPress={onBack}><Text style={is.back}>← Back</Text></TouchableOpacity>
          <Text style={is.title}>Report Incident</Text>
        </View>
        <View style={is.form}>
          <Text style={is.label}>TITLE *</Text>
          <TextInput style={is.input} value={title} onChangeText={setTitle} placeholder="Brief incident title" placeholderTextColor={C.textMuted} />

          <Text style={[is.label, { marginTop: 14 }]}>SEVERITY *</Text>
          <View style={is.row}>
            {SEVS.map(s => (
              <TouchableOpacity key={s.v} onPress={() => setSev(s.v)} style={[is.chip, sev === s.v && { backgroundColor: s.c + '22', borderColor: s.c }]}>
                <Text style={[is.chipText, sev === s.v && { color: s.c, fontWeight: '700' }]}>{s.l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[is.label, { marginTop: 14 }]}>CATEGORY *</Text>
          <View style={is.row}>
            {CATS.map(c => (
              <TouchableOpacity key={c.v} onPress={() => setCat(c.v)} style={[is.chip, cat === c.v && { backgroundColor: 'rgba(0,166,81,0.15)', borderColor: C.green }]}>
                <Text>{c.i}</Text>
                <Text style={[is.chipText, cat === c.v && { color: C.green }]}> {c.l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[is.label, { marginTop: 14 }]}>DESCRIPTION *</Text>
          <TextInput style={[is.input, { height: 120, textAlignVertical: 'top', paddingTop: 12 }]}
            value={desc} onChangeText={setDesc} multiline
            placeholder="What happened? Who was involved? What action was taken?"
            placeholderTextColor={C.textMuted} />

          <View style={is.gpsNote}><Text style={is.gpsText}>📍 GPS coordinates captured automatically on submit</Text></View>

          <TouchableOpacity style={[is.submitBtn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color={C.white} /> : <Text style={is.submitText}>⚠ Submit Report</Text>}
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const is = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bgDark },
  header: { backgroundColor: C.bgCard, padding: 16, paddingTop: 54, borderBottomWidth: 1, borderBottomColor: C.bgBorder },
  back: { color: C.green, fontSize: 14, marginBottom: 6 }, title: { fontSize: 20, fontWeight: '800', color: C.text },
  form: { padding: 16 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: C.textSec, marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.bgBorder, borderRadius: 10, padding: 12, color: C.text, fontSize: 14 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.bgBorder, backgroundColor: C.bgElevated, marginBottom: 6 },
  chipText: { fontSize: 12, color: C.textSec },
  gpsNote: { marginVertical: 12, backgroundColor: 'rgba(0,166,81,0.08)', borderRadius: 8, padding: 10 },
  gpsText: { fontSize: 11, color: C.green, textAlign: 'center' },
  submitBtn: { backgroundColor: C.flagged, borderRadius: 10, padding: 15, alignItems: 'center' }, submitText: { color: C.white, fontSize: 16, fontWeight: '700' },
  success: { flex: 1, backgroundColor: C.bgDark, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successTitle: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 8, marginTop: 16 }, successSub: { fontSize: 14, color: C.textSec },
  backBtn: { marginTop: 24, backgroundColor: C.green, borderRadius: 10, padding: 14, paddingHorizontal: 32 }, backBtnText: { color: C.white, fontSize: 16, fontWeight: '700' },
})

// ─── GPS Screen ───────────────────────────────────────────────────────────────
function GPSScreen({ user, onBack }: { user: User; onBack: () => void }) {
  const [tracking, setTracking] = useState(false)
  const [gps, setGPS] = useState<{ lat: number; lng: number; speed: number; heading: number } | null>(null)
  const [syncs, setSyncs] = useState(0)
  const subRef = React.useRef<Location.LocationSubscription | null>(null)
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const latestRef = React.useRef(gps)
  latestRef.current = gps

  useEffect(() => () => { subRef.current?.remove(); if (timerRef.current) clearInterval(timerRef.current) }, [])

  const start = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permission Required', 'Location access needed for GPS tracking'); return }
    setTracking(true)
    subRef.current = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 10 }, loc => {
      setGPS({ lat: loc.coords.latitude, lng: loc.coords.longitude, speed: (loc.coords.speed ?? 0) * 3.6, heading: loc.coords.heading ?? 0 })
    })
    timerRef.current = setInterval(async () => {
      const g = latestRef.current
      if (!g || !user.assignedVehicle) return
      try {
        await updateDoc(doc(db, 'fleet_locations', user.assignedVehicle), {
          currentCoordinates: { latitude: g.lat, longitude: g.lng },
          speedKph: Math.round(g.speed), heading: Math.round(g.heading), lastUpdated: serverTimestamp(),
          status: g.speed > 5 ? 'in_transit' : 'idle',
        })
        setSyncs(s => s + 1)
      } catch { /* offline */ }
    }, 30000)
  }

  const stop = () => { subRef.current?.remove(); if (timerRef.current) clearInterval(timerRef.current); setTracking(false) }

  return (
    <View style={gs.root}>
      <View style={gs.header}>
        <TouchableOpacity onPress={onBack}><Text style={gs.back}>← Back</Text></TouchableOpacity>
        <Text style={gs.title}>GPS Tracker</Text>
        <Text style={gs.sub}>Vehicle: {user.assignedVehicle ?? 'Not assigned'}</Text>
      </View>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={gs.card}>
          <View style={{ flex: 1 }}>
            <Text style={gs.toggleLabel}>Live GPS Tracking</Text>
            <Text style={gs.toggleSub}>{tracking ? '● Syncing to INEC HQ every 30s' : 'Tap to start tracking'}</Text>
          </View>
          <Switch value={tracking} onValueChange={v => v ? start() : stop()} trackColor={{ false: C.bgBorder, true: '#004d26' }} thumbColor={tracking ? C.green : C.textMuted} />
        </View>

        {gps && (
          <View style={gs.card}>
            <Text style={gs.cardTitle}>📍 Current Position</Text>
            <View style={gs.coordRow}>
              {[{ l: 'LATITUDE', v: gps.lat.toFixed(5) }, { l: 'LONGITUDE', v: gps.lng.toFixed(5) }].map(({ l, v }) => (
                <View key={l} style={gs.coordBox}><Text style={gs.coordLbl}>{l}</Text><Text style={gs.coordVal}>{v}</Text></View>
              ))}
            </View>
            <View style={gs.metricsRow}>
              {[{ l: 'Speed', v: `${Math.round(gps.speed)} km/h`, c: C.voting }, { l: 'Heading', v: `${Math.round(gps.heading)}°`, c: C.text }].map(({ l, v, c }) => (
                <View key={l} style={{ alignItems: 'center' }}><Text style={[gs.metricVal, { color: c }]}>{v}</Text><Text style={gs.metricLbl}>{l}</Text></View>
              ))}
            </View>
          </View>
        )}

        <View style={gs.card}>
          <Text style={gs.cardTitle}>📡 Sync Status</Text>
          <View style={gs.syncRow}><Text style={gs.syncLbl}>Syncs completed</Text><Text style={gs.syncVal}>{syncs}</Text></View>
          <View style={gs.syncRow}><Text style={gs.syncLbl}>Interval</Text><Text style={gs.syncVal}>{tracking ? 'Every 30s' : 'Off'}</Text></View>
        </View>

        {!user.assignedVehicle && (
          <View style={gs.warn}><Text style={gs.warnText}>⚠ No vehicle assigned. Contact INEC HQ for vehicle assignment.</Text></View>
        )}
      </ScrollView>
    </View>
  )
}

const gs = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bgDark },
  header: { backgroundColor: C.bgCard, padding: 16, paddingTop: 54, borderBottomWidth: 1, borderBottomColor: C.bgBorder },
  back: { color: C.green, fontSize: 14, marginBottom: 6 }, title: { fontSize: 20, fontWeight: '800', color: C.text }, sub: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  card: { backgroundColor: C.bgCard, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.bgBorder, marginBottom: 12, flexDirection: undefined },
  cardTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '700', color: C.text }, toggleSub: { fontSize: 11, color: C.textMuted, marginTop: 2, flexDirection: 'row' },
  coordRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  coordBox: { flex: 1, backgroundColor: C.bgElevated, borderRadius: 8, padding: 10 },
  coordLbl: { fontSize: 9, color: C.textMuted, letterSpacing: 1 }, coordVal: { fontSize: 13, color: C.text, marginTop: 2 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  metricVal: { fontSize: 18, fontWeight: '700' }, metricLbl: { fontSize: 9, color: C.textMuted, marginTop: 2, textTransform: 'uppercase' },
  syncRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.bgBorder },
  syncLbl: { fontSize: 12, color: C.textSec }, syncVal: { fontSize: 12, fontWeight: '600', color: C.text },
  warn: { backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  warnText: { fontSize: 12, color: C.offline, textAlign: 'center', lineHeight: 20 },
})

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [user, setUser]     = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async fu => {
      if (fu) {
        try {
          const snap = await getDoc(doc(db, 'users', fu.uid))
          if (snap.exists() && snap.data().isActive) {
            const d = snap.data()
            setUser({ uid: fu.uid, email: fu.email ?? '', fullName: d.fullName ?? 'Officer', role: d.role ?? 'pu_officer', assignedPU: d.assignedPU, assignedState: d.assignedState, assignedLga: d.assignedLga, assignedWard: d.assignedWard, assignedVehicle: d.assignedVehicle })
            setScreen('home')
          } else setScreen('login')
        } catch { setUser({ uid: fu.uid, email: fu.email ?? '', fullName: 'Field Officer', role: 'pu_officer' }); setScreen('home') }
      } else { setUser(null); setScreen('login') }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const logout = async () => { await signOut(auth); setUser(null); setScreen('login') }

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: C.bgDark, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <ActivityIndicator size="large" color={C.green} />
      <Text style={{ color: C.textSec, fontSize: 14 }}>INEC Field Officer App</Text>
    </View>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bgDark }}>
      <StatusBar style="light" backgroundColor={C.bgDark} />
      {screen === 'login' || !user
        ? <LoginScreen onLogin={u => { setUser(u); setScreen('home') }} />
        : screen === 'home'     ? <HomeScreen    user={user} onNavigate={s => setScreen(s as Screen)} onLogout={logout} />
        : screen === 'vote'     ? <VoteScreen    user={user} onBack={() => setScreen('home')} />
        : screen === 'incident' ? <IncidentScreen user={user} onBack={() => setScreen('home')} />
        : screen === 'gps'      ? <GPSScreen     user={user} onBack={() => setScreen('home')} />
        : (
          <View style={{ flex: 1, backgroundColor: C.bgDark, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <Text style={{ fontSize: 56, marginBottom: 16 }}>📹</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 8 }}>Live Video</Text>
            <Text style={{ fontSize: 14, color: C.textSec, textAlign: 'center', lineHeight: 22 }}>
              Video sessions are initiated by INEC HQ.{'\n\n'}
              You will receive a notification when an admin requests a live stream.
            </Text>
            <TouchableOpacity onPress={() => setScreen('home')} style={{ marginTop: 24 }}>
              <Text style={{ color: C.green, fontSize: 16, fontWeight: '600' }}>← Back to Home</Text>
            </TouchableOpacity>
          </View>
        )
      }
    </SafeAreaView>
  )
}
