# RentFlow Android App

This module now includes a Compose mobile scaffold for tenant and landlord workflows:

- Tenant: invoices, in-app notifications, complaint creation, complaint progress
- Landlord: monthly tenant payment report (cleared vs pending)

## Prerequisites

- Android Studio Iguana or newer
- Android SDK 35
- JDK 17

## Open and Run

1. Open the android folder in Android Studio.
2. Let Gradle sync the project.
3. Run the app configuration on an emulator or device.

## API Endpoint

The app currently targets development backend URL in:

- app/src/main/kotlin/com/rentflow/android/data/ApiService.kt

Update `BASE_URL` to your desired environment if needed.

## Push Notifications (FCM)

To enable instant push notifications on Android:

1. Add your Firebase `google-services.json` to `app/google-services.json`.
2. Ensure the backend has `FCM_SERVICE_ACCOUNT_JSON` configured.
3. Sign in from the Android app once so the device token is registered via `/api/v1/notifications/push-token`.

## Backend Endpoint Added for Mobile Landlord Report

- GET /api/v1/payments/landlord-report?month=4&year=2026

Returns tenant-level monthly invoice/payment status and summary totals for landlord dashboards.

## Build for Testing

Debug APK:

1. From the android folder run: .\gradlew.bat assembleDebug
2. APK output: app/build/outputs/apk/debug/app-debug.apk

Release APK (unsigned by default):

1. From the android folder run: .\gradlew.bat assembleRelease
2. APK output: app/build/outputs/apk/release/app-release-unsigned.apk

## Optional Release Signing

To generate a signed release APK:

1. Create a keystore file (for example app/release-keystore.jks).
2. Copy keystore.properties.example to keystore.properties.
3. Update keystore.properties with your real values:
	storeFile, storePassword, keyAlias, keyPassword.
4. Run: .\gradlew.bat assembleRelease

If keystore.properties exists, Gradle uses it automatically for release signing.
