# Pilot Runbook

## Web

```bash
npm.cmd run dev
```

## Backend

```bash
cd backend
npm.cmd run dev
```

## Passenger Flutter

```bash
cd apps/customer_app
flutter pub get
flutter run --dart-define=MISHWAR_API_BASE_URL=http://localhost:4000
```

## Driver Flutter

```bash
cd apps/driver_app
flutter pub get
flutter run --dart-define=MISHWAR_API_BASE_URL=http://localhost:4000
```

## Manual External Setup

- Firebase project and web app credentials.
- Firebase Admin service account for backend token verification.
- SMS/Phone auth configuration.
- Google Maps key for browser/mobile routing and geocoding.
- FCM configuration for push notifications.

Real payment remains disabled.
