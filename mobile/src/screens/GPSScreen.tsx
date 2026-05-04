// mobile/src/screens/GPSScreen.tsx
import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Switch, Alert, Platform,
} from 'react-native'
import Geolocation from 'react-native-geolocation-service'
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions'
import { db } from '../firebase/config'
import { Colors } from '../utils/theme'

interface Props {
  user: { uid: string; assignedVehicle?: string; assignedState?: string; assignedLga?: string }
  onBack: () => void
}

interface GPSData {
  lat: number
  lng: number
  accuracy: number
  speed: number
  heading: number
  timestamp: Date
}

export default function GPSScreen({ user, onBack }: Props) {
  const [tracking, setTracking] = useState(false)
  const [gpsData, setGPSData] = useState<GPSData | null>(null)
  const [syncCount, setSyncCount] = useState(0)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const watchId = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      stopTracking()
    }
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    const perm = Platform.OS === 'ios'
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
    const status = await request(perm)
    return status === RESULTS.GRANTED
  }

  const startTracking = async () => {
    const granted = await requestPermission()
    if (!granted) {
      Alert.alert('Permission Denied', 'Location permission is required for GPS tracking.')
      return
    }

    setTracking(true)

    // Watch position continuously
    watchId.current = Geolocation.watchPosition(
      (position) => {
        const data: GPSData = {
          lat:       position.coords.latitude,
          lng:       position.coords.longitude,
          accuracy:  position.coords.accuracy,
          speed:     (position.coords.speed ?? 0) * 3.6, // m/s to km/h
          heading:   position.coords.heading ?? 0,
          timestamp: new Date(position.timestamp),
        }
        setGPSData(data)
      },
      (err) => console.warn('GPS error:', err),
      { enableHighAccuracy: true, distanceFilter: 10, interval: 5000 }
    )

    // Sync to Firestore every 30 seconds
    intervalRef.current = setInterval(() => {
      syncToFirestore()
    }, 30000)

    // First sync immediately
    syncToFirestore()
  }

  const stopTracking = () => {
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setTracking(false)
  }

  const syncToFirestore = async () => {
    if (!gpsData || !user.assignedVehicle) return
    try {
      await db.collection('fleet_locations').doc(user.assignedVehicle).update({
        currentCoordinates: new (db as any).app.firestore.GeoPoint(gpsData.lat, gpsData.lng),
        speedKph:    Math.round(gpsData.speed),
        heading:     Math.round(gpsData.heading),
        locationAccuracy: gpsData.accuracy,
        lastUpdated: (db as any).app.firestore.FieldValue.serverTimestamp(),
        status: gpsData.speed > 5 ? 'in_transit' : 'idle',
        routeHistory: (db as any).app.firestore.FieldValue.arrayUnion({
          coordinates: new (db as any).app.firestore.GeoPoint(gpsData.lat, gpsData.lng),
          timestamp: (db as any).app.firestore.FieldValue.serverTimestamp(),
          speedKph: Math.round(gpsData.speed),
        }),
      })
      setSyncCount(c => c + 1)
      setLastSync(new Date())
    } catch { /* offline — will sync when connected */ }
  }

  const toggleTracking = async (value: boolean) => {
    if (value) await startTracking()
    else stopTracking()
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backArrow}>
          <Text style={styles.backArrowText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GPS Tracker</Text>
        <Text style={styles.headerSub}>
          Vehicle: {user.assignedVehicle ?? 'Not assigned'}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Toggle */}
        <View style={styles.toggleCard}>
          <View>
            <Text style={styles.toggleLabel}>Live GPS Tracking</Text>
            <Text style={styles.toggleSub}>
              {tracking ? '● Sending location to INEC HQ every 30s' : 'Off — tap to start tracking'}
            </Text>
          </View>
          <Switch
            value={tracking}
            onValueChange={toggleTracking}
            trackColor={{ false: Colors.bgBorder, true: Colors.greenDark }}
            thumbColor={tracking ? Colors.green : Colors.textMuted}
          />
        </View>

        {/* GPS data */}
        {gpsData && (
          <View style={styles.gpsCard}>
            <Text style={styles.cardTitle}>📍 Current Position</Text>
            <View style={styles.coordRow}>
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>LATITUDE</Text>
                <Text style={styles.coordValue}>{gpsData.lat.toFixed(6)}</Text>
              </View>
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>LONGITUDE</Text>
                <Text style={styles.coordValue}>{gpsData.lng.toFixed(6)}</Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              {[
                { label: 'Speed',    value: `${Math.round(gpsData.speed)} km/h`,  color: Colors.voting    },
                { label: 'Heading',  value: `${Math.round(gpsData.heading)}°`,    color: Colors.textPrimary },
                { label: 'Accuracy', value: `±${Math.round(gpsData.accuracy)}m`,  color: gpsData.accuracy < 20 ? Colors.green : Colors.offline },
              ].map(({ label, value, color }) => (
                <View key={label} style={styles.metricItem}>
                  <Text style={[styles.metricValue, { color }]}>{value}</Text>
                  <Text style={styles.metricLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sync stats */}
        <View style={styles.syncCard}>
          <Text style={styles.cardTitle}>📡 Sync Status</Text>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Syncs completed:</Text>
            <Text style={styles.syncValue}>{syncCount}</Text>
          </View>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Last sync:</Text>
            <Text style={styles.syncValue}>
              {lastSync ? lastSync.toLocaleTimeString('en-NG') : 'Never'}
            </Text>
          </View>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Next sync in:</Text>
            <Text style={styles.syncValue}>{tracking ? '30s' : '—'}</Text>
          </View>
        </View>

        {!user.assignedVehicle && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              ⚠ No vehicle assigned to your account.{'\n'}
              GPS tracking requires a vehicle assignment from INEC HQ.
            </Text>
          </View>
        )}
      </View>
    </View>
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
  headerSub:   { fontSize: 11, color: Colors.textMuted, fontFamily: 'Courier New', marginTop: 2 },

  content: { flex: 1, padding: 16, gap: 12 },

  toggleCard: {
    backgroundColor: Colors.bgCard, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.bgBorder,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  toggleLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  toggleSub:   { fontSize: 11, color: Colors.textMuted, marginTop: 2, maxWidth: 220 },

  gpsCard: {
    backgroundColor: Colors.bgCard, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.bgBorder,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  coordRow:  { flexDirection: 'row', gap: 12, marginBottom: 12 },
  coordItem: { flex: 1, backgroundColor: Colors.bgElevated, borderRadius: 8, padding: 10 },
  coordLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  coordValue: { fontSize: 13, fontFamily: 'Courier New', color: Colors.textPrimary, marginTop: 2 },

  metricsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  metricItem: { alignItems: 'center' },
  metricValue: { fontSize: 18, fontWeight: '700', fontFamily: 'Courier New' },
  metricLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 2, textTransform: 'uppercase' },

  syncCard: {
    backgroundColor: Colors.bgCard, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.bgBorder,
  },
  syncRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.bgBorder },
  syncLabel: { fontSize: 12, color: Colors.textSecondary },
  syncValue: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, fontFamily: 'Courier New' },

  warningCard: {
    backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
  },
  warningText: { fontSize: 12, color: Colors.offline, textAlign: 'center', lineHeight: 20 },
})
