# MISHWAR (مشوار) - Production Deployment Guide & Runbook

For full documentation and step-by-step instructions, see [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

---

## 1. Environments Overview

| Environment | Purpose | Data Source | Hosting / Runtime | Domain / URL |
| :--- | :--- | :--- | :--- | :--- |
| **Development** | Local iteration, feature engineering, unit tests | In-memory Mock Data & Simulators | Vite Dev Server (port 3000) | `http://localhost:3000` |
| **Staging** | Pilot staging, integration testing, QA verification | Firebase Emulators or Dedicated Staging Project | Google Cloud Run / Firebase Staging | `https://staging.mishwar-ye.com` |
| **Production** | Live Yemeni pilot & commercial operations | Live Firebase Firestore & Auth, Cloud Functions | Google Cloud Run / Firebase Hosting | `https://app.mishwar-ye.com` |

---

## 2. Environment Variables Configuration

All environment configurations are split cleanly without committing secrets to Git:

### `.env.development`
```ini
APP_ENV=development
DATA_MODE=mock
PORT=3000
VITE_API_BASE_URL=http://localhost:3000/api
VITE_PILOT_MODE=false
VITE_USE_MOCK_MAPS=true
```

### `.env.staging`
```ini
APP_ENV=staging
DATA_MODE=mock
PORT=3000
VITE_API_BASE_URL=https://staging-api.mishwar-ye.com/api
VITE_FIREBASE_PROJECT_ID="mishwar-staging"
VITE_PILOT_MODE=true
VITE_MAX_PILOT_DRIVERS=25
VITE_MAX_PILOT_CUSTOMERS=250
VITE_CASH_ONLY=true
```

### `.env.production`
```ini
APP_ENV=production
DATA_MODE=firebase
PORT=3000
VITE_API_BASE_URL=https://api.mishwar-ye.com/api
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="mishwar-prod.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="mishwar-prod"
VITE_FIREBASE_STORAGE_BUCKET="mishwar-prod.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="545901365611"
VITE_FIREBASE_APP_ID="1:545901365611:web:..."
VITE_GOOGLE_MAPS_API_KEY="AIzaSy..."
VITE_PILOT_MODE=true
VITE_MAX_PILOT_DRIVERS=10
VITE_MAX_PILOT_CUSTOMERS=100
VITE_DEFAULT_CITY="Sana'a"
VITE_DEFAULT_CURRENCY="YER"
VITE_CASH_ONLY=true
```

---

## 3. Firebase Setup & Security Rules

### Step 1: Firebase Project Provisioning
1. Create a Firebase project in the Google Cloud Console (`mishwar-prod`).
2. Enable **Firestore Database** in regional mode (`europe-west2` or closest Middle East region).
3. Enable **Firebase Authentication** with Phone Provider.
4. Enable **Firebase Cloud Messaging (FCM)** for native notifications.

### Step 2: Deploy Firestore Security Rules
Ensure strict security rules are applied from `firestore.rules`:
```bash
firebase use production
firebase deploy --only firestore:rules,storage:rules
```

---

## 4. Build Process

Execute clean build pipeline:
```bash
# 1. Install pristine dependencies
npm install

# 2. Run TypeScript strict type-check & linting
npm run lint

# 3. Compile high-performance production distribution
npm run build
```

Build outputs are compiled into `dist/` with optimized chunking and minification.

---

## 5. Hosting Architecture

### Option A: Static Web Application (Firebase Hosting / CDN)
```bash
firebase deploy --only hosting
```

### Option B: Containerized Cloud Run Deployment (Full-Stack Express + Static)
```bash
gcloud run deploy mishwar-web \
  --source . \
  --platform managed \
  --region europe-west2 \
  --allow-unauthenticated \
  --set-env-vars APP_ENV=production,DATA_MODE=firebase
```

---

## 6. Backup Strategy

1. **Daily Automated Firestore Backups:**
   ```bash
   gcloud firestore export gs://mishwar-backups-prod/$(date +%Y-%m-%d)
   ```
2. **Weekly Retention:**
   Automated Cloud Storage lifecycle policy archiving backups older than 30 days to Coldline.
3. **Audit Log Export:**
   Sink all audit logs to BigQuery for tamper-evident compliance.

---

## 7. Rollback Procedure

If a critical failure occurs during deployment:
1. **Instant Hosting Rollback:**
   ```bash
   firebase hosting:rollback
   ```
2. **Cloud Run Revision Rollback:**
   ```bash
   gcloud run services update-traffic mishwar-web --to-revisions=PREVIOUS_REVISION_TAG=100
   ```
3. **Verification:**
   Check health check endpoint `/api/health` and verify state machine transitions.

---

## 8. Pre-Flight Security Checklist

- [x] Zero API keys or secrets hardcoded in source control.
- [x] `.gitignore` excludes `.env`, `node_modules`, `build`, and logs.
- [x] Role-Based Access Control (RBAC) enforced on Admin routes.
- [x] Financial Ledger prevents double deductions via idempotency keys.
- [x] Rate limiting active on Phone OTP verification.
- [x] Data isolation verified between Passenger A and Passenger B.
- [x] Audit logs record all administrative, billing, and dispatch activities.
