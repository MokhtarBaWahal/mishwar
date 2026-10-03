# Firebase Setup

## Required Manual Setup

Create separate Firebase projects for staging/pilot/production.

Add these values to the relevant `.env` file:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Collections

- `users`
- `passengers`
- `drivers`
- `vehicles`
- `rides`
- `rideOffers`
- `payments`
- `wallets`
- `walletTransactions`
- `ratings`
- `notifications`
- `auditLogs`
- `pricingRules`
- `settings`
- `sosReports`

## Status

Firebase code is scaffolded. It is not confirmed working until a real project is connected, rules are deployed, and a full ride scenario is tested.
