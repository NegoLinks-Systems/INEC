// mobile/src/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { db } from '../firebase/config'
import { Colors } from '../utils/theme'

interface User {
  uid: string
  fullName: string
  role: string
  assignedPU?: string
  assignedState?: string
  assignedLga?: string
  assignedWard?: string
}

interface PUInfo {
  puCode: string
  name: string
  status: string
  registeredVoters: number
  accreditedVoters: number
  totalVotesCast: number
  materialsDelivered: boolean
}

interface Props {
  user: User
  onNavigate: (screen: string) => void
  onLogout: () => void
}

export default function HomeScreen({ user, onNavigate, onLogout }: Props) {
  const [isOnline, setIsOnline] = useState(true)
  const [puInfo, setPUInfo] = useState<PUInfo | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [pendingSync, setPendingSync] = useState(0)

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    loadPUInfo()
  }, [user.assignedPU])

  const loadPUInfo = async () => {
    if (!user.assignedPU || !user.assignedState || !user.assignedLga || !user.assignedWard) return
    try {
      const doc = await db
        .collection('states').doc(user.assignedState)
        .collection('lgas').doc(user.assignedLga)
        .collection('wards').doc(user.assignedWard)
        .collection('polling_units').doc(user.assignedPU.replace(/\//g, '-'))
        .get()
      if (doc.exists) {
        const d = doc.data()!
        setPUInfo({
          puCode:           d.puCode           ?? user.assignedPU,
          name:             d.name             ?? 'My Polling Unit',
          status:           d.status           ?? 'pending',
          registeredVoters: d.registeredVoters ?? 0,
          accreditedVoters: d.accreditedVoters ?? 0,
          totalVotesCast:   d.totalVotesCast   ?? 0,
          materialsDelivered: d.materialsDelivered ?? false,
        })
      }
    } catch { /* offline — use cached */ }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadPUInfo()
    setRefreshing(false)
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      active: Colors.active, voting: Colors.voting,
      completed: Colors.completed, pending: Colors.pending,
      offline: Colors.offline, flagged: Colors.flagged,
    }
    return map[status] ?? Colors.pending
  }

  const menuItems = [
    { id: 'vote',     icon: '🗳️',  label: 'Submit Results',    desc: 'Log vote counts for your PU',      color: Colors.green   },
    { id: 'incident', icon: '⚠️',  label: 'Report Incident',   desc: 'Report issues with photo evidence', color: Colors.flagged },
    { id: 'video',    icon: '📹',  label: 'Live Video',        desc: 'Connect to HQ via Agora',           color: Colors.voting  },
    { id: 'gps',      icon: '📍',  label: 'Update Location',   desc: 'Sync your GPS coordinates',         color: Colors.medium  },
  ]

  return (
    <ScrollView
      style={styles.root}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.role}>{user.role.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Connectivity banner */}
      <View style={[styles.connBanner, { backgroundColor: isOnline ? 'rgba(0,166,81,0.1)' : 'rgba(245,158,11,0.1)' }]}>
        <View style={[styles.connDot, { backgroundColor: isOnline ? Colors.green : Colors.offline }]} />
        <Text style={[styles.connText, { color: isOnline ? Colors.green : Colors.offline }]}>
          {isOnline
            ? '● Connected — Data syncing live to INEC HQ'
            : `● Offline — ${pendingSync > 0 ? `${pendingSync} submissions queued` : 'Submissions will sync when online'}`
          }
        </Text>
      </View>

      {/* PU Info card */}
      {puInfo && (
        <View style={styles.puCard}>
          <View style={styles.puCardHeader}>
            <View>
              <Text style={styles.puCode}>{puInfo.puCode}</Text>
              <Text style={styles.puName}>{puInfo.name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(puInfo.status) + '22' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(puInfo.status) }]}>
                {puInfo.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            {[
              { label: 'Registered', value: puInfo.registeredVoters.toLocaleString(), color: Colors.textPrimary },
              { label: 'Accredited', value: puInfo.accreditedVoters.toLocaleString(), color: Colors.voting },
              { label: 'Votes Cast', value: puInfo.totalVotesCast.toLocaleString(), color: Colors.green },
            ].map(({ label, value, color }) => (
              <View key={label} style={styles.statItem}>
                <Text style={[styles.statValue, { color }]}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {!puInfo.materialsDelivered && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>⚠ Electoral materials not yet delivered to this PU</Text>
            </View>
          )}
        </View>
      )}

      {/* No PU assigned */}
      {!puInfo && (
        <View style={styles.noPUCard}>
          <Text style={styles.noPUText}>No polling unit assigned</Text>
          <Text style={styles.noPUSubText}>Contact your INEC supervisor to get assigned</Text>
        </View>
      )}

      {/* Action menu */}
      <Text style={styles.sectionTitle}>ACTIONS</Text>
      <View style={styles.menuGrid}>
        {menuItems.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuCard}
            onPress={() => onNavigate(item.id)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuDesc}>{item.desc}</Text>
            <View style={[styles.menuArrow, { backgroundColor: item.color + '22' }]}>
              <Text style={[styles.menuArrowText, { color: item.color }]}>→</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Today's summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>📊 Today's Activity</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Check-in time:</Text>
          <Text style={styles.summaryValue}>
            {new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Results submitted:</Text>
          <Text style={styles.summaryValue}>{puInfo?.totalVotesCast ?? 0} votes</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Pending sync:</Text>
          <Text style={[styles.summaryValue, { color: pendingSync > 0 ? Colors.offline : Colors.green }]}>
            {pendingSync > 0 ? `${pendingSync} items` : 'All synced ✓'}
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 20, paddingTop: 50,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1, borderBottomColor: Colors.bgBorder,
  },
  greeting: { fontSize: 12, color: Colors.textMuted },
  name:     { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  role:     { fontSize: 10, color: Colors.green, fontFamily: 'Courier New', letterSpacing: 1, marginTop: 2 },
  logoutBtn: {
    backgroundColor: Colors.bgElevated, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.bgBorder,
  },
  logoutText: { color: Colors.textSecondary, fontSize: 12 },

  connBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, paddingHorizontal: 16,
  },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  connText: { fontSize: 12, fontWeight: '500', flex: 1 },

  puCard: {
    margin: 16, backgroundColor: Colors.bgCard,
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.bgBorder,
  },
  puCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 16,
  },
  puCode:  { fontSize: 11, color: Colors.green, fontFamily: 'Courier New', marginBottom: 2 },
  puName:  { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, maxWidth: 220 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusText:  { fontSize: 10, fontWeight: '700', fontFamily: 'Courier New' },

  statsRow:  { flexDirection: 'row', justifyContent: 'space-around' },
  statItem:  { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', fontFamily: 'Courier New' },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2, letterSpacing: 0.5 },

  warningBanner: {
    marginTop: 12, backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 6, padding: 8,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
  },
  warningText: { fontSize: 11, color: Colors.offline, textAlign: 'center' },

  noPUCard: {
    margin: 16, backgroundColor: Colors.bgCard,
    borderRadius: 12, padding: 24,
    alignItems: 'center',
    borderWidth: 1, borderColor: Colors.bgBorder,
  },
  noPUText:    { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  noPUSubText: { fontSize: 12, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },

  sectionTitle: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
    color: Colors.textMuted, paddingHorizontal: 16, marginBottom: 8,
  },
  menuGrid: { paddingHorizontal: 16, gap: 10 },
  menuCard: {
    backgroundColor: Colors.bgCard, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: Colors.bgBorder,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8,
  },
  menuIcon:  { fontSize: 24, width: 32, textAlign: 'center' },
  menuLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  menuDesc:  { fontSize: 11, color: Colors.textMuted, display: 'none' },
  menuArrow: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  menuArrowText: { fontSize: 16, fontWeight: '700' },

  summaryCard: {
    margin: 16, backgroundColor: Colors.bgCard,
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.bgBorder,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.bgBorder },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary },
  summaryValue: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, fontFamily: 'Courier New' },
})
