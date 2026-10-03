# MISHWAR Real Pilot Migration

## Current Inventory

- Web app: React, Vite, TypeScript, Tailwind, simulator views for passenger, driver, and admin.
- Backend: Express TypeScript API with health, pricing, legacy ride creation, dispatch accept, SOS, payments, and pilot config endpoints.
- Firebase: client config, Firestore rules, Storage rules, indexes.
- Flutter: passenger and driver apps with initial health/status screens.
- Shared packages: canonical types and shared pricing, distance, phone validation, and ride state machine utilities.
- Services: pricing, rides, drivers, passengers, payments, notifications, Firebase, maps, GPS, ratings, KYC, safety, analytics.

## Real Components

- Pricing formulas in `packages/shared_utils`.
- Ride state machine in `packages/shared_utils`.
- Firebase client initialization with safe demo fallback.
- Firestore security rules baseline.
- Backend request validation and role middleware foundation.
- Server-authoritative `/api/rides` fare calculation foundation.

## Mock / Simulator Components

- Demo accounts and OTP codes.
- Most web ride lifecycle state in `MishwarContext`.
- Driver dispatch locks in frontend services and backend memory.
- Wallet balances and ledger in memory.
- Flutter passenger and driver flows beyond health/status.
- Push notifications.
- Real SMS provider.
- Real payment provider.

## Partial Components

- Firebase data layer: repository interfaces and Firestore implementations exist, but a real Firebase project must be configured and tested.
- Authentication: Firebase token verification is scaffolded in backend; production requires Admin SDK credentials and custom claims/roles.
- Realtime: Firestore subscription exists for rides in `firestoreService`, but full app wiring is not complete.
- Maps: mock and Google service code exist; production routing/geocoding requires keys and validation.

## Problems Found

- Mojibake existed across Arabic docs/UI strings.
- `localStorage` was previously used as persisted app state for rides/drivers/payments in demo.
- Demo OTP was accepted without mode separation.
- Backend accepted demo identity in development and used memory stores for idempotency, locks, rides, and wallets.
- Diagnostic tests depend on Vite/browser globals and are not yet a standalone runner.
- Web bundle is large and needs later code splitting.

## Files That Need Continued Migration

- `src/context/MishwarContext.tsx`
- `src/services/authService.ts`
- `src/services/firebase/authService.ts`
- `src/services/paymentService.ts`
- `src/services/rideService.ts`
- `src/services/driverService.ts`
- `backend/src/server.ts`
- `apps/customer_app/lib/main.dart`
- `apps/driver_app/lib/main.dart`

## Implemented Foundation

- Added runtime mode config: demo, staging, pilot, production.
- Added repository interfaces and mock/firestore implementations.
- Added shared pilot types for ride offers, payments, and live driver locations.
- Restricted demo OTP/demo accounts/local persistence outside demo mode.
- Added backend auth and validation foundation.
- Added server-authoritative ride API at `/api/rides`.
- Extended Firestore rules and indexes for pilot collections.

## Next P0 Work

- Replace `MishwarContext` ride mutations with repository calls per flow.
- Move backend ride, dispatch, wallet, and payment persistence from memory to Firestore/Admin SDK transactions.
- Add backend Firebase custom-claim role source and remove demo fallback in strict modes after credentials are present.
- Add transaction-backed wallet and dispatch services.
