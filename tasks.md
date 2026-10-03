# Remaining Tasks to Reach Production

## 1. Production identity and app polish [COMPLETED]
- Finalized a single brand system for Mishwar across customer and driver apps.
- Standardized theme, cards, status surfaces, and app shell styling across both apps.
- Established a reusable brand package with a consistent Arabic-first visual identity.
- Remaining polish: real app icons, splash screens, launch screens, and store metadata for release packaging.
- Continue reviewing Arabic/English typography and production device rendering before launch.

## 2. Real authentication and identity
- Replace demo user IDs and role headers with real Firebase Auth or server-issued tokens.
- Add login, OTP, KYC onboarding, and account recovery flows for production.
- Enforce role validation on the backend using trusted claims only.
- Add account security: logout, session expiry, token refresh, and blocked sessions.
- Add user profile editing and profile validation for drivers and passengers.

## 3. Production backend and persistence
- Move ride, wallet, dispatch, and driver-location data from in-memory maps to a persistent database.
- Add transactional ride assignment and atomic locking for real concurrency safety.
- Add audit logs for all rider, driver, admin, and financial actions.
- Add database migrations and backup/restore procedures.
- Add health checks, uptime monitoring, and app metrics for production operations.

## 4. Real-time operations and notifications
- Connect live driver location updates to a persistent real-time stream or Firestore listener.
- Add driver location refresh throttling and battery-aware interval optimization.
- Integrate push notifications for ride requests, accept/decline events, trip status updates, and emergency alerts.
- Add offline queueing for lost connectivity and sync recovery on reconnect.

## 5. Payments and financial operations
- Replace mock payment logic with real payment provider integration.
- Add wallet ledger reconciliation, payout flows, settlement reporting, and refund handling.
- Add transaction idempotency validation and audit trail for all money movement.
- Enforce legal/compliance requirements for cash and digital payment workflows.

## 6. Native mobile packaging
- Generate Android and iOS app projects and project configuration files.
- Configure bundle IDs, signing keys, provisioning, and release certificates.
- Add required app permissions for location, notifications, network, and camera if needed.
- Test release builds on both Android and iOS devices.
- Prepare app store listing assets, privacy policy, and support links.

## 7. Firebase and cloud configuration
- Create production Firebase project(s) and enable required services.
- Deploy Firestore rules, storage rules, and admin configuration securely.
- Add Firebase Cloud Messaging, Analytics, Crashlytics, and App Distribution.
- Keep secret values in secure environment management rather than source code.
- Validate production rules with real test users and driver flows.

## 8. Maps, routing, and geo services
- Replace demo or public fallback tile usage with production-approved map and routing policies.
- Add address geocoding, place search, and route caching for better user experience.
- Add driver location accuracy controls and map-safe follow behavior.
- Validate service limits, failover behavior, and offline fallbacks.

## 9. Safety and risk operations
- Finalize SOS escalation flow with dispatcher and emergency response handling.
- Add ride safety checks, emergency contact flows, and trip incident reporting.
- Add fraud detection and suspicious activity review for accounts and payments.
- Add admin tools for blocking, investigation, and user support workflows.

## 10. QA, release, and deployment readiness
- Add automated CI/CD pipelines for backend, frontend, and Flutter apps.
- Add test suites for auth, rides, payments, driver assignment, and map flows.
- Add staging environment and production smoke tests before each release.
- Create deployment runbook, rollback procedure, and incident response checklist.
- Run final beta and pilot release checks with real devices and real users.

## 11. Market launch checklist
- Final legal review for privacy, licensing, and local operating compliance.
- Prepare support, help center, and user onboarding content.
- Confirm allowed payment and operating model for Yemen market launch.
- Prepare launch analytics and conversion tracking.
- Train operations team for dispatch support, escalation, and driver onboarding.

## 12. Sprint priority order
1. Real auth and backend persistence
2. Production Firebase and security rules
3. Real payment and wallet flows
4. Native mobile build and store release setup
5. Push notifications and live dispatch
6. Beta QA and pilot rollout
7. Launch marketing and support readiness

## Current status summary
- UI identity upgrade is completed for the app shell and the brand system is now shared across customer and driver apps.
- Core ride flow, map handling, and driver tracking foundations exist.
- The project now looks like a market-ready product in appearance, but it is not yet production-ready because auth, persistence, mobile packaging, and production services are still missing or demo-only.
