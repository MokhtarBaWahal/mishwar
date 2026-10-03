# MISHWAR (مشوار) - Security Architecture & Rules Guide

## 1. Authentication & Session Security
- **Yemeni Carriers Phone OTP:** Enforces strict regex validation on prefixes (`77`, `78`, `73`, `71`, `70`).
- **Anti-Spam Rate Limiting:** Limits OTP requests to a maximum of 3 requests per 5-minute rolling window per phone number.
- **Role Isolation:** Roles are strictly segregated (`CUSTOMER`, `DRIVER`, `DISPATCHER`, `SUPPORT`, `ADMIN`, `SUPER_ADMIN`). No client-side parameter can elevate privileges.

## 2. Cloud Firestore Security Rules Review
Production rules in `firebase/firestore.rules` enforce:
- **Zero Public Access:** No `allow read, write: if true;` rules anywhere in the codebase.
- **User Ownership:** Customers can only read and update their own document in `/users/{userId}`.
- **Driver Verification Guard:** Drivers in `PENDING_APPROVAL` or `SUSPENDED` status are blocked from accepting rides or appearing in dispatch queries.
- **Rides Access Control:** Rides are accessible only to the authenticated customer who booked it, the assigned driver, and authorized dispatch/admin personnel.
- **Immutable Audit Trail:** Documents in `/audit_logs` are strictly read-only or write-only by verified administrators. Deletion is forbidden.

## 3. API & Server-Side Security
- **Idempotency Keys:** Mandatory `x-idempotency-key` header on `POST /api/rides/create` prevents double charges or duplicate booking creation on unstable 3G networks.
- **Atomic Driver Locks:** In-memory & Firestore transactional locking prevents race conditions where two drivers accept the same ride request concurrently.
- **Data Scrubbing in Logs:** Passwords, OTP codes, authentication tokens, and private identity documents are completely omitted from logs.

## 4. Pilot Security Updates
- Runtime mode is controlled by `APP_MODE` / `VITE_APP_MODE`: `demo`, `staging`, `pilot`, or `production`.
- Demo OTP and demo accounts are disabled outside demo mode by configuration.
- Production safety checks reject unsafe flags such as mock data, demo OTP, demo accounts, local persistence, and real payment.
- Backend strict modes require authenticated requests. Firebase ID token verification is scaffolded and requires Firebase Admin credentials.
- New backend helpers: `requireAuth`, `requireRole`, and request validators for coordinates, vehicle type, passenger count, payment method, and amounts.

## 5. Remaining Security Work
- Move backend ride, dispatch, wallet, and payment state from memory to Firestore/Admin SDK transactions.
- Configure Firebase custom claims for roles.
- Deploy and test Firestore rules against emulator and real staging data.
- Add structured logging without secrets.
