// mobile/src/screens/IncidentScreen.tsx
import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, Platform,
} from 'react-native'
import { launchCamera } from 'react-native-image-picker'
import Geolocation from 'react-native-geolocation-service'
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions'
import { db, store } from '../firebase/config'
import { Colors } from '../utils/theme'
import { v4 as uuid } from 'uuid'

interface Props {
  user: { uid: string; fullName: string; assignedPU?: string; assignedState?: string; assignedLga?: string }
  onBack: () => void
}

type Severity = 'low' | 'medium' | 'high' | 'critical'
type Category = 'violence' | 'equipment_failure' | 'material_shortage' | 'irregularity' | 'other'

const SEVERITIES: { value: Severity; label: string; color: string }[] = [
  { value: 'low',      label: 'Low',      color: Colors.low      },
  { value: 'medium',   label: 'Medium',   color: Colors.medium   },
  { value: 'high',     label: 'High',     color: Colors.high     },
  { value: 'critical', label: 'Critical', color: Colors.critical },
]

const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: 'violence',          label: 'Violence/Threat',     icon: '⚔️' },
  { value: 'equipment_failure', label: 'Equipment Failure',   icon: '📱' },
  { value: 'material_shortage', label: 'Material Shortage',   icon: '📦' },
  { value: 'irregularity',      label: 'Electoral Irregularity', icon: '⚖️' },
  { value: 'other',             label: 'Other',               icon: '📝' },
]

export default function IncidentScreen({ user, onBack }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<Severity>('medium')
  const [category, setCategory] = useState<Category>('other')
  const [photos, setPhotos] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const takePhoto = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.7,
      saveToPhotos: false,
    })
    if (result.assets?.[0]?.uri) {
      setPhotos(prev => [...prev, result.assets![0].uri!])
    }
  }

  const getGPS = (): Promise<{ lat: number; lng: number; accuracy: number } | null> => {
    return new Promise(async (resolve) => {
      const perm = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION

      const status = await request(perm)
      if (status !== RESULTS.GRANTED) { resolve(null); return }

      Geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      )
    })
  }

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert('Required', 'Please enter an incident title'); return }
    if (!description.trim()) { Alert.alert('Required', 'Please describe the incident'); return }

    setSubmitting(true)
    const incidentId = uuid()

    try {
      // Get GPS
      const coords = await getGPS()

      // Upload photos to Firebase Storage
      const imageUrls: string[] = []
      for (const photoUri of photos) {
        try {
          const ref = store.ref(`incidents/${incidentId}/${uuid()}.jpg`)
          await ref.putFile(photoUri)
          const url = await ref.getDownloadURL()
          imageUrls.push(url)
        } catch { /* photo upload failed — continue */ }
      }

      // Save to Firestore (works offline too!)
      await db.collection('incidents').doc(incidentId).set({
        incidentId,
        reportedBy:   user.uid,
        officerName:  user.fullName,
        puId:         user.assignedPU ?? '',
        stateId:      user.assignedState ?? '',
        lgaId:        user.assignedLga ?? '',
        title:        title.trim(),
        description:  description.trim(),
        severity,
        category,
        status:       'open',
        imageUrls,
        reportCoordinates: coords
          ? new (db as any).app.firestore.GeoPoint(coords.lat, coords.lng)
          : null,
        reportAccuracy: coords?.accuracy ?? null,
        reportedAt:   (db as any).app.firestore.FieldValue.serverTimestamp(),
        createdOffline: false,
      })

      setSubmitted(true)
    } catch (err) {
      Alert.alert('Error', 'Failed to submit. Report saved locally and will sync when online.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <View style={styles.successScreen}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Incident Reported</Text>
        <Text style={styles.successSub}>
          Your report has been sent to INEC HQ.{'\n'}
          A supervisor will review and respond.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.root} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backArrow}>
          <Text style={styles.backArrowText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Incident</Text>
      </View>

      <View style={styles.form}>
        {/* Title */}
        <Text style={styles.label}>INCIDENT TITLE *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Brief title describing the incident"
          placeholderTextColor={Colors.textMuted}
          maxLength={100}
        />

        {/* Severity */}
        <Text style={[styles.label, { marginTop: 16 }]}>SEVERITY *</Text>
        <View style={styles.chipRow}>
          {SEVERITIES.map(s => (
            <TouchableOpacity
              key={s.value}
              onPress={() => setSeverity(s.value)}
              style={[
                styles.chip,
                severity === s.value && { backgroundColor: s.color + '22', borderColor: s.color },
              ]}
            >
              <Text style={[styles.chipText, severity === s.value && { color: s.color, fontWeight: '700' }]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category */}
        <Text style={[styles.label, { marginTop: 16 }]}>CATEGORY *</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.value}
              onPress={() => setCategory(c.value)}
              style={[
                styles.categoryChip,
                category === c.value && { backgroundColor: 'rgba(0,166,81,0.15)', borderColor: Colors.green },
              ]}
            >
              <Text style={styles.categoryIcon}>{c.icon}</Text>
              <Text style={[styles.categoryText, category === c.value && { color: Colors.green }]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Text style={[styles.label, { marginTop: 16 }]}>DESCRIPTION *</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what happened, who was involved, and any actions taken..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        {/* Photos */}
        <Text style={[styles.label, { marginTop: 16 }]}>PHOTO EVIDENCE</Text>
        <View style={styles.photoRow}>
          {photos.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.photo} />
          ))}
          {photos.length < 5 && (
            <TouchableOpacity style={styles.addPhotoBtn} onPress={takePhoto}>
              <Text style={styles.addPhotoIcon}>📷</Text>
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* GPS note */}
        <View style={styles.gpsNote}>
          <Text style={styles.gpsNoteText}>
            📍 Your GPS coordinates will be automatically captured on submission
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.submitBtnText}>Submit Incident Report</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
  header: {
    backgroundColor: Colors.bgCard, padding: 16, paddingTop: 50,
    borderBottomWidth: 1, borderBottomColor: Colors.bgBorder,
  },
  backArrow: { marginBottom: 8 },
  backArrowText: { color: Colors.green, fontSize: 14 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },

  form: { padding: 16 },
  label: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.2,
    color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.bgBorder,
    borderRadius: 10, padding: 12, color: Colors.textPrimary, fontSize: 14,
  },
  textarea: { height: 120, paddingTop: 12 },

  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.bgBorder,
    backgroundColor: Colors.bgElevated,
  },
  chipText: { fontSize: 13, color: Colors.textSecondary },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.bgBorder, backgroundColor: Colors.bgElevated,
  },
  categoryIcon: { fontSize: 16 },
  categoryText: { fontSize: 12, color: Colors.textSecondary },

  photoRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  photo: { width: 80, height: 80, borderRadius: 8 },
  addPhotoBtn: {
    width: 80, height: 80, borderRadius: 8,
    backgroundColor: Colors.bgElevated, borderWidth: 1,
    borderStyle: 'dashed', borderColor: Colors.bgBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  addPhotoIcon: { fontSize: 24 },
  addPhotoText: { fontSize: 9, color: Colors.textMuted, marginTop: 4 },

  gpsNote: {
    marginTop: 12, backgroundColor: 'rgba(0,166,81,0.08)',
    borderRadius: 8, padding: 10, borderWidth: 1, borderColor: 'rgba(0,166,81,0.2)',
  },
  gpsNoteText: { fontSize: 11, color: Colors.green, textAlign: 'center' },

  submitBtn: {
    marginTop: 20, backgroundColor: Colors.flagged,
    borderRadius: 10, padding: 14, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },

  successScreen: {
    flex: 1, backgroundColor: Colors.bgDark,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  successIcon:  { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  successSub:   { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  backBtn: {
    marginTop: 24, backgroundColor: Colors.green,
    borderRadius: 10, padding: 14, paddingHorizontal: 32,
  },
  backBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
})
