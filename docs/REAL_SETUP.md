# MISHWAR (مشوار) - Production & Pilot Setup Guide

## 1. Firebase Cloud Setup
1. Create a Firebase Project in the Google Cloud Console (e.g. `mishwar-pilot`).
2. Enable **Phone Authentication** under *Authentication > Sign-in method*.
   - For Sandbox/Testing, add test phone numbers (e.g., `+967 771234567` with OTP `123456`).
3. Enable **Cloud Firestore** in Native mode.
4. Deploy the production security rules and indexes:
   ```bash
   firebase deploy --only firestore:rules,storage:rules,firestore:indexes
   ```
5. Enable **Firebase Storage** for driver document KYC uploads.
6. Under *Project Settings > Service accounts*, generate a new private key and save credentials in the backend environment.

## 2. Google Maps Platform Setup
1. In the Google Cloud Console, enable:
   - **Directions API**
   - **Geocoding API**
   - **Maps SDK for Android**
   - **Maps SDK for iOS**
   - **Maps JavaScript API**
2. Create separate API keys for Web, Android, iOS, and Backend with strict application restrictions.
3. Configure `VITE_GOOGLE_MAPS_API_KEY` in `.env.production`.

## 3. Running Backend Services
```bash
cd backend
npm install
npm run build
npm start
```

## 4. Mobile Apps Build
### Android:
```bash
# Customer App
cd apps/customer_app
flutter pub get
flutter build apk --release

# Driver App
cd apps/driver_app
flutter pub get
flutter build apk --release
```

### iOS Notes:
- Requires an active Apple Developer Program membership and macOS machine with Xcode installed.
- iOS builds were not compiled directly in this Linux container environment, but all standard Flutter Podfiles, permissions (`Info.plist` Geolocation), and bundle identifiers are fully configured.
