// mobile/src/screens/VoteEntryScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
// MINI-INEC 2.0 — Field Officer Vote Entry Screen (Module 2)
// Offline-first: works with ZERO internet connectivity
// Auto-syncs to Firestore when connectivity restored
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useOfflineSync, VoteRecord } from '../hooks/useOfflineSync'

// Registered political parties (from system config)
const REGISTERED_PARTIES = ['APC', 'PDP', 'LP', 'NNPP', 'APGA', 'ADC', 'SDP']

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#060810',
  card: '#0f1520',
  elevated: '#1a2235',
  border: '#1e2a3d',
  green: '#00a651',
  greenDim: '#004d26',
  text: '#e8edf5',
  textSecondary: '#8b98b8',
  textMuted: '#4a5568',
  red: '#ef4444',
  orange: '#f59e0b',
  blue: '#3b82f6',
}

interface Props {
  officerId: string
  puId: string
  wardId: string
  lgaId: string
  stateId: string
  puName: string
  registeredVoters: number
}

export default function VoteEntryScreen({
  officerId,
  puId,
  wardId,
  lgaId,
  stateId,
  puName,
  registeredVoters,
}: Props) {
  const { syncStatus, error, submitVoteRecord } = useOfflineSync(officerId)

  const [partyResults, setPartyResults] = useState<Record<string, string>>(
    Object.fromEntries(REGISTERED_PARTIES.map((p) => [p, '']))
  )
  const [accreditedVoters, setAccreditedVoters] = useState('')
  const [rejectedBallots, setRejectedBallots] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const totalVotesCast = Object.values(partyResults).reduce(
    (sum, v) => sum + (parseInt(v) || 0),
    0
  )
  const validVotes = totalVotesCast - (parseInt(rejectedBallots) || 0)

  const handleSubmit = async () => {
    // Validation
    const accredited = parseInt(accreditedVoters)
    if (!accredited || accredited <= 0) {
      Alert.alert('Validation Error', 'Please enter the number of accredited voters.')
      return
    }
    if (totalVotesCast <= 0) {
      Alert.alert('Validation Error', 'Please enter vote counts for at least one party.')
      return
    }
    if (totalVotesCast > accredited) {
      Alert.alert(
        'Data Integrity Error',
        `Votes cast (${totalVotesCast}) cannot exceed accredited voters (${accredited}). Please recheck your entries.`
      )
      return
    }

    Alert.alert(
      'Confirm Submission',
      `Submit results for ${puName}?\n\nTotal Votes: ${totalVotesCast}\nAccredited: ${accredited}\n\n${syncStatus.isOnline ? 'Will sync immediately.' : '⚠ You are OFFLINE. Results will sync automatically when connectivity is restored.'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setIsSubmitting(true)

            const record: VoteRecord = {
              puId,
              wardId,
              lgaId,
              stateId,
              officerId,
              partyResults: Object.fromEntries(
                Object.entries(partyResults).map(([k, v]) => [k, parseInt(v) || 0])
              ),
              totalVotesCast,
              accreditedVoters: accredited,
              validVotes,
              rejectedBallots: parseInt(rejectedBallots) || 0,
            }

            const result = await submitVoteRecord(record)
            setIsSubmitting(false)

            if (result.success) {
              setSubmitted(true)
              Alert.alert(
                syncStatus.isOnline ? '✅ Submitted' : '📥 Saved Locally',
                syncStatus.isOnline
                  ? 'Results submitted successfully and synced to INEC HQ.'
                  : 'Results saved locally. Will automatically sync when internet connection is restored.',
                [{ text: 'OK' }]
              )
            } else {
              Alert.alert('Submission Error', error || 'Unknown error occurred.')
            }
          },
        },
      ]
    )
  }

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Results Submitted</Text>
        <Text style={styles.successSub}>
          {syncStatus.isOnline ? 'Synced to INEC HQ' : 'Saved locally — pending sync'}
        </Text>
        <Text style={[styles.successSub, { marginTop: 4 }]}>
          Total Votes: {totalVotesCast.toLocaleString()}
        </Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vote Entry</Text>
          <Text style={styles.headerSub}>{puId}</Text>
          <Text style={styles.headerName}>{puName}</Text>

          {/* Connectivity badge */}
          <View style={[
            styles.connBadge,
            { backgroundColor: syncStatus.isOnline ? C.greenDim + '40' : 'rgba(245,158,11,0.15)' },
          ]}>
            <View style={[
              styles.connDot,
              { backgroundColor: syncStatus.isOnline ? C.green : C.orange },
            ]} />
            <Text style={[
              styles.connText,
              { color: syncStatus.isOnline ? C.green : C.orange },
            ]}>
              {syncStatus.isOnline
                ? 'Online — Live Sync'
                : syncStatus.isSyncing
                ? 'Syncing...'
                : `Offline — ${syncStatus.pendingWrites} pending`
              }
            </Text>
          </View>
        </View>

        {/* Registered voters info */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>REGISTERED VOTERS</Text>
          <Text style={styles.cardValue}>{registeredVoters.toLocaleString()}</Text>
        </View>

        {/* Accredited Voters */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCREDITED VOTERS</Text>
          <TextInput
            style={styles.input}
            value={accreditedVoters}
            onChangeText={setAccreditedVoters}
            keyboardType="number-pad"
            placeholder="Enter number of accredited voters"
            placeholderTextColor={C.textMuted}
            maxLength={5}
          />
        </View>

        {/* Party Results */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>VOTES CAST PER PARTY</Text>
          {REGISTERED_PARTIES.map((party) => (
            <View key={party} style={styles.partyRow}>
              <View style={styles.partyLabel}>
                <View style={[styles.partyDot, {
                  backgroundColor:
                    party === 'APC' ? C.green
                    : party === 'PDP' ? C.blue
                    : party === 'LP' ? C.red
                    : C.orange
                }]} />
                <Text style={styles.partyName}>{party}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.partyInput]}
                value={partyResults[party]}
                onChangeText={(v) => setPartyResults((prev) => ({ ...prev, [party]: v }))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={C.textMuted}
                maxLength={5}
              />
            </View>
          ))}
        </View>

        {/* Rejected Ballots */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>REJECTED BALLOTS</Text>
          <TextInput
            style={styles.input}
            value={rejectedBallots}
            onChangeText={setRejectedBallots}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={C.textMuted}
            maxLength={4}
          />
        </View>

        {/* Running totals */}
        <View style={styles.totals}>
          {[
            { label: 'Total Votes', value: totalVotesCast, color: C.green },
            { label: 'Valid Votes', value: validVotes, color: C.blue },
            { label: 'Rejected', value: parseInt(rejectedBallots) || 0, color: C.red },
          ].map(({ label, value, color }) => (
            <View key={label} style={styles.totalItem}>
              <Text style={[styles.totalValue, { color }]}>{value.toLocaleString()}</Text>
              <Text style={styles.totalLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              {syncStatus.isOnline ? 'Submit Results' : 'Save Results Offline'}
            </Text>
          )}
        </TouchableOpacity>

        {!syncStatus.isOnline && (
          <Text style={styles.offlineNote}>
            📶 You are currently offline. Results will be securely stored on this device and automatically transmitted to INEC HQ when your internet connection is restored.
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 40 },

  header: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { fontWeight: '800', fontSize: 22, color: C.text, marginBottom: 4 },
  headerSub: { fontFamily: 'Courier', fontSize: 12, color: C.green, marginBottom: 2 },
  headerName: { fontSize: 13, color: C.textSecondary },

  connBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginTop: 10,
    gap: 6,
  },
  connDot: { width: 6, height: 6, borderRadius: 3 },
  connText: { fontSize: 11, fontWeight: '600' },

  card: {
    backgroundColor: C.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  cardLabel: { fontSize: 10, color: C.textMuted, letterSpacing: 1, marginBottom: 4 },
  cardValue: { fontSize: 28, fontWeight: '700', color: C.text, fontFamily: 'Courier' },

  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: C.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  input: {
    backgroundColor: C.elevated,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 12,
    color: C.text,
    fontSize: 15,
    fontFamily: 'Courier',
  },

  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  partyLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    gap: 6,
  },
  partyDot: { width: 8, height: 8, borderRadius: 4 },
  partyName: { color: C.text, fontWeight: '700', fontSize: 13 },
  partyInput: { flex: 1 },

  totals: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  totalItem: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  totalValue: { fontFamily: 'Courier', fontSize: 20, fontWeight: '700' },
  totalLabel: { fontSize: 9, color: C.textMuted, letterSpacing: 0.8, marginTop: 2 },

  submitBtn: {
    backgroundColor: C.green,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  offlineNote: {
    fontSize: 11,
    color: C.orange,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },

  successContainer: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 8 },
  successSub: { fontSize: 14, color: C.textSecondary },
})
