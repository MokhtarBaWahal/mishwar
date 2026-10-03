# MISHWAR (مشوار) - Pilot Phase Test Plan (خطة الفحص الميداني والتشغيل التجريبي)

## 1. Executive Summary & Goals
This document defines the comprehensive test plan for validating the **MISHWAR** ride-hailing platform before and during the initial pilot release in **Sana'a** (and secondary expansion in **Aden**).

The pilot targets:
- **Max 10 Verified Drivers** (Cars & Motorcycles).
- **Max 100 Registered Pilot Customers**.
- **Cash-First with Local Wallet Ledger readiness**.
- **Strict Minimum Fares:** 1,800 YER (Cars) / 700 YER (Motorcycles).
- **10% Fixed Platform Commission**.

---

## 2. Test Scope & Core Engines

### Engine 1: Pricing Engine
- **Motorcycle Tariff:**
  - Base Fare: 500 YER
  - Distance Fare: 150 YER / km
  - Time Fare: 25 YER / min
  - Minimum Fare Clamp: 700 YER
  - Commission: 10%
- **Car Tariff (Economy / Comfort / Family):**
  - Economy Base: 1,200 YER, Distance: 350 YER / km, Time: 45 YER / min
  - Minimum Fare Clamp: 1,800 YER
  - Commission: 10%
- **Acceptance Criterion:** Zero discrepancy between UI estimation and final driver payout calculation.

### Engine 2: Ride State Machine
```
[REQUESTED] ──> [SEARCHING_DRIVER] ──> [DRIVER_ASSIGNED] ──> [DRIVER_ARRIVING / ON_THE_WAY]
                                                                        │
                                                                        ▼
[TRIP_COMPLETED] <── [TRIP_STARTED] <── [DRIVER_ARRIVED]
```
- **Guards:** All illegal leaps (e.g. `REQUESTED` -> `TRIP_COMPLETED` or `TRIP_COMPLETED` -> `TRIP_STARTED`) are blocked by strict state verification guards.

### Engine 3: Dispatch Proximity Engine
- **Filtering Rules:**
  - Exclude `OFFLINE` drivers.
  - Exclude `IN_RIDE` (busy) drivers.
  - Exclude `SUSPENDED` and `PENDING_APPROVAL` drivers.
  - Exclude inactive driver accounts.
  - Exclude drivers locked in active concurrent offers.
- **Sorting Rule:** Nearest Great-Circle distance (Haversine) to pickup location.

### Engine 4: Financial Ledger & Idempotency
- Double-entry wallet transactions with `balanceBefore` and `balanceAfter`.
- Idempotency key deduplication prevents double deductions on network retries.
- Cash trips credit net earnings directly to driver ledger.

### Engine 5: Authentication & Yemeni Carriers
- Validates 9-digit mobile numbers with carrier detection:
  - `77` & `78`: Yemen Mobile
  - `73`: YOU (MTN)
  - `71`: Sabafon
  - `70`: Y Telecom
- Rate limits OTP requests (max 3 sends per 2 minutes, 3 wrong attempts triggers 60s lockout).

---

## 3. Standard Ride Scenarios Matrix (Scenarios A through J)

| Scenario | Description | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| **Scenario A** | Passenger + Car Booking | Minimum fare >= 1,800 YER, car assigned, lifecycle completed cleanly. | **PASS** |
| **Scenario B** | Passenger + Motorcycle Booking | Minimum fare >= 700 YER, 10% commission, motorcycle assigned. | **PASS** |
| **Scenario C** | No Driver Available | Search times out gracefully; status transitions to `NO_DRIVER_AVAILABLE` without application crash. | **PASS** |
| **Scenario D** | Passenger Cancellation | Ride marked `CANCELLED_BY_CUSTOMER`; assigned driver released back to pool. | **PASS** |
| **Scenario E** | Driver Cancellation | Ride marked `CANCELLED_BY_DRIVER`; customer notified immediately. | **PASS** |
| **Scenario F** | Payment Failure | Insufficient wallet balance handled; transaction flagged `FAILED`, balance untouched. | **PASS** |
| **Scenario G** | Successful Cash Payment | Marked `PAID`; platform records commission and driver net earnings. | **PASS** |
| **Scenario H** | Wallet Payment | Debited with `WalletLedgerEntry`; `balanceBefore` and `balanceAfter` verified. | **PASS** |
| **Scenario I** | Invalid State Transition | Illegal leaps blocked (e.g., `REQUESTED` -> `TRIP_COMPLETED`). | **PASS** |
| **Scenario J** | Driver Already Busy | Driver in `IN_RIDE` excluded from dispatch candidates. | **PASS** |

---

## 4. Hardware & Telemetry Validation
- **Device GPS Geolocation:** Successfully resolves physical device location with Arabic permission fallback.
- **Driver Motion Interpolation:** Smooth route animation along polylines between Sana'a landmarks.
- **SOS Emergency Trigger:** Dispatches instant high-priority alert with live coordinates to Admin Ops.

---

## 5. Mobile & Viewport Responsiveness
Validation across 7 viewport widths:
- `320px` (Ultra-compact Android devices)
- `375px` (Standard iPhone SE)
- `390px` (Modern iPhone 14/15)
- `430px` (iPhone Pro Max / Galaxy S24 Ultra)
- `768px` (iPad / Android Tablets)
- `1024px` (Desktop Tablets / Laptops)
- `1440px` (High-resolution monitors)
Zero horizontal overflow, legible Arabic fonts (`Cairo`), touch targets >= 44px.
