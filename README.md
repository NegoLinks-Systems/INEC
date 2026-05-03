# MINI-INEC 2.0 — National Electoral Operations & Logistics Monitoring System

**Developed by NegoLinks Systems Ltd for INEC HQ, Abuja**

---

## System Architecture

```
mini-inec/
├── src/                          # Next.js Web Dashboard (Admin)
│   ├── app/                      # App Router pages
│   │   ├── inec/                 # Main dashboard routes (basePath: /inec)
│   │   │   ├── page.tsx          # Overview — Module 1
│   │   │   ├── map/              # Live Map — Module 1 + 3
│   │   │   ├── fleet/            # Fleet Tracker — Module 3
│   │   │   ├── video/            # Live Video — Module 4
│   │   │   ├── incidents/        # Incident Reports — Module 5
│   │   │   ├── legacy/           # Legacy Portals — Module 6
│   │   │   ├── ai-alerts/        # AI Intelligence — Module 7
│   │   │   └── war-room/         # War Room — Module 8
│   ├── components/
│   │   ├── dashboard/            # DashboardLayout (filter context + sidebar)
│   │   ├── map/                  # React Leaflet + MarkerCluster
│   │   ├── fleet/                # Fleet tracker with live GPS simulation
│   │   ├── video/                # Agora RTC video sessions
│   │   ├── incidents/            # Incident feed + Firebase Storage
│   │   ├── legacy/               # iframe portal embedder
│   │   ├── ai/                   # Anomaly detector alerts
│   │   └── warroom/              # 4-quadrant 1080p command display
│   ├── firebase/
│   │   ├── config.ts             # Firebase init + offline persistence
│   │   ├── schema.ts             # Full TypeScript Firestore schema
│   │   └── mockData.ts           # Demo seed data (6 states, 5 vehicles)
│   ├── hooks/
│   │   └── useAgora.ts           # Agora RTC web hook
│   └── utils/
│       └── anomalyDetector.ts    # AI anomaly detection engine
│
└── mobile/                       # React Native Field Officer App
    └── src/
        ├── firebase/config.ts    # Mobile Firebase + offline persistence
        ├── hooks/
        │   ├── useOfflineSync.ts # Offline-first vote logging (Module 2)
        │   └── useAgoraMobile.ts # Mobile Agora + Firestore signaling
        └── screens/
            └── VoteEntryScreen.tsx # Officer vote submission UI
```

---

## Module Summary

| # | Module | Technology | Status |
|---|--------|-----------|--------|
| 1 | Hierarchical Command Dashboard | React Context + useReducer + React Leaflet | ✅ Complete |
| 2 | Offline-First Mobile App | React Native + Firestore Persistence | ✅ Complete |
| 3 | Fleet Tracking (GPS/RFID) | Firestore real-time + Leaflet | ✅ Complete |
| 4 | On-Demand Live Video | Agora RTC SDK (Web + Mobile) | ✅ Complete |
| 5 | Incident Reporting | Firebase Storage + Firestore | ✅ Complete |
| 6 | Legacy System Harmonization | Secure iframe + fallback | ✅ Complete |
| 7 | AI Intelligence Layer | Custom anomaly detector | ✅ Complete |
| 8 | War Room Command Center | 4-quadrant 1080p display | ✅ Complete |

---

## Quick Start

### 1. Install dependencies

```bash
cd mini-inec
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your Firebase and Agora credentials
```

### 3. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Firestore Database** (start in test mode)
3. Enable **Firebase Storage**
4. Enable **Firebase Authentication** (Email/Password)
5. Copy credentials to `.env.local`
6. Deploy Firestore Security Rules from `src/firebase/schema.ts` (see comments)

### 4. Agora Setup

1. Create an account at https://console.agora.io
2. Create a new project
3. Copy the **App ID** to `.env.local`
4. For production: Set up an Agora Token Server (see Agora docs)

### 5. Run development server

```bash
npm run dev
# Open http://localhost:3000/inec
```

### 6. Build for production

```bash
npm run build
# Output goes to /out directory
# Upload /out to your server at negolinks.com/inec
```

---

## Deployment to negolinks.com/inec

The app is pre-configured for subdirectory deployment via `next.config.js`:

```js
basePath: '/inec',
assetPrefix: '/inec/',
output: 'export',
```

After `npm run build`:
1. Upload contents of `/out` to your server's `public_html/inec/` directory
2. Configure your web server (nginx/Apache) to serve the static files
3. Add a rewrite rule for client-side routing

**Nginx example:**
```nginx
location /inec {
  root /var/www/html;
  try_files $uri $uri/ /inec/index.html;
}
```

---

## Mobile App Setup

```bash
cd mobile
npm install
cd ios && pod install  # iOS only

# Android
npx react-native run-android

# iOS
npx react-native run-ios
```

Add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) from Firebase Console.

---

## Key Design Decisions

### Cascading Filters (Module 1)
Uses React `useReducer` + `createContext` for the State → LGA → Ward → PU hierarchy. Each level is derived from the parent selection, so resetting State also clears LGA/Ward/PU. No external state library needed.

### Offline-First (Module 2)
Firestore's `enableIndexedDbPersistence()` (web) and `persistence: true` setting (mobile) handle all offline queuing automatically. Officers write to Firestore as normal — if offline, writes are cached locally and flushed when connectivity resumes. No custom sync queue needed.

### Agora Signaling (Module 4)
Rather than a separate WebSocket signaling server, we use Firestore documents in the `/signaling` collection. Admin writes → Mobile reads via `onSnapshot` listener → both sides join same Agora channel. Firestore acts as the signaling layer.

### War Room (Module 8)
Uses its own `layout.tsx` that bypasses `DashboardLayout`, rendering full-screen without the sidebar. Optimized for 1080p/4K displays with CSS Grid quadrants.

---

## License
Proprietary — NegoLinks Systems Ltd / INEC PoC 2025
