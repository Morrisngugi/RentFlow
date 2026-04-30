# RentFlow Android App

This module now includes a Compose mobile scaffold for tenant and landlord workflows:

- Tenant: invoices, in-app notifications, complaint creation, complaint progress
- Landlord: monthly tenant payment report (cleared vs pending)

## Prerequisites

- Android Studio Iguana or newer
- Android SDK 35
- JDK 17

## Open and Run

1. Open the `android` folder in Android Studio.
2. Let Gradle sync the project.
3. Run the `app` configuration on an emulator or device.

## API Endpoint

The app currently targets development backend URL in:

- `app/src/main/kotlin/com/rentflow/android/data/ApiService.kt`

Update `BASE_URL` to your desired environment if needed.

## Backend Endpoint Added for Mobile Landlord Report

- `GET /api/v1/payments/landlord-report?month=4&year=2026`

Returns tenant-level monthly invoice/payment status and summary totals for landlord dashboards.
