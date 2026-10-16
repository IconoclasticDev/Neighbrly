# Neighbrly (Android first)

Demo build of the Neighbrly app: quiz, scored area reports with confidence ranges, metric ledger,
Asking-Price check, Promoter record, visit checklist, compare. **All data is demo data.**
Light theme only. No blue or purple (enforced by `npm run lint:palette`).

## Run it on your phone (fastest, free)
```bash
npm install
npx expo start          # scan the QR with the Expo Go app on Android
```

## Build a free installable APK
**Option A: EAS cloud build (no Android Studio needed)**
```bash
npm install -g eas-cli
eas login               # free Expo account
eas build -p android --profile preview    # produces an .apk download link
```
Free-tier builds are limited per month and can queue; check current limits at expo.dev/pricing.

**Option B: build locally (no account, needs Android Studio / JDK 17 + Android SDK)**
```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```
Note: a local release build is signed with the debug key by default. Fine for sideloading and demos,
not for Play Store upload.

## Install the APK
Copy it to the phone, open it, and allow "Install unknown apps" for your file manager or browser.

## Checks
```bash
npm run typecheck
npm run lint:palette
```

## What is real vs placeholder
- Real: navigation, quiz -> weights, on-device storage, range bar, ledger-cited summary, visit checklist.
- Placeholder: scores (`src/score.ts`), all data (`src/data.ts`), Hindi/Marathi, maps, WhatsApp, API (`src/api.ts`).
