# INEC 2.0 — Field Officer Mobile App

## Screens

| Screen | Purpose |
|--------|---------|
| Login | Firebase Auth sign-in |
| Home | PU info, quick actions, sync status |
| Vote Entry | Submit election results (works offline) |
| Incident Report | Report issues with photo + GPS |
| GPS Tracker | Real-time vehicle location to Firestore |
| Live Video | Receive stream requests from HQ via Agora |

## Setup

### 1. Install dependencies
```bash
cd mobile
npm install
cd ios && pod install  # iOS only
```

### 2. Add Firebase config files
- **Android:** Download `google-services.json` from Firebase Console → Project Settings → Android app → Add app
  - Place at: `mobile/android/app/google-services.json`
- **iOS:** Download `GoogleService-Info.plist`
  - Place at: `mobile/ios/InecFieldOfficer/GoogleService-Info.plist`

### 3. Add INEC logo
Place `inec-logo.png` in `mobile/src/assets/`

### 4. Run
```bash
# Android
npx react-native run-android

# iOS  
npx react-native run-ios
```

## Build for Production

### Android APK
```bash
cd android
./gradlew assembleRelease
# APK at: android/app/build/outputs/apk/release/app-release.apk
```

### iOS IPA
Open `ios/InecFieldOfficer.xcworkspace` in Xcode → Product → Archive

## How Field Officers Are Set Up

Each officer needs a Firebase Auth account created by admin:
1. Go to Firebase Console → Authentication → Add user
2. Set email and password
3. Create their user profile in Firestore `/users/{uid}`:
```json
{
  "userId": "their-uid",
  "fullName": "Officer Name",
  "email": "officer@inec.gov.ng",
  "role": "pu_officer",
  "isActive": true,
  "assignedState": "lagos",
  "assignedLga": "lagos_ikeja",
  "assignedWard": "lagos_ikeja_ward_1_airport",
  "assignedPU": "LA/002/001/001",
  "assignedVehicle": "v001"
}
```

## Offline Capability

- Vote results saved locally via Firestore persistence
- Auto-syncs when internet restored
- GPS updates queued when offline
- Incident reports saved locally, photos upload when online
