# MISHWAR (مشوار) - Architecture Overview

## 1. Executive Summary
**MISHWAR (مشوار)** is a modern, high-performance, modular smart ride-hailing and logistics platform engineered specifically for the Yemeni market. It supports motorcycles and cars with future architecture for deliveries, corporate fleets, and inter-city transit (Sana'a, Aden, Taiz, Hodeidah, Mukalla).

## 2. Monorepo Structure
```
mishwar-platform/
├── apps/
│   ├── customer_app/        # Flutter Customer Mobile Application
│   ├── driver_app/          # Flutter Driver Mobile Application
│   └── admin_dashboard/     # React / TypeScript Management Console
├── backend/                 # Node.js / Express / TypeScript REST & Dispatch API
├── packages/
│   ├── shared_types/        # Canonical TypeScript interfaces & enums
│   ├── shared_utils/        # Pricing, Geolocation, and State Machine logic
├── firebase/
│   ├── firestore.rules      # Strict RBAC & Document Security Rules
│   ├── storage.rules        # Secure Driver Documents & Avatars Rules
│   └── firebase.json
└── docs/                    # Architectural & API Specifications
```

## 3. Core Subsystems

### A. Pricing Engine (Server-Authoritative)
The pricing engine guarantees deterministic calculations computed exclusively on the server:
$$\text{GrossFare} = \max\Big(\text{MinimumFare}, \big(\text{BaseFare} + (\text{DistanceKm} \times \text{PricePerKm}) + (\text{DurationMins} \times \text{PricePerMin})\big) \times \text{PeakMultiplier} \times \text{ZoneMultiplier}\Big)$$

- **Platform Commission:**
  $$\text{PlatformCommission} = \text{GrossFare} \times \text{CommissionRate} \quad (\text{Default } 10\%)$$
- **Driver Net Earnings:**
  $$\text{DriverNet} = \text{GrossFare} - \text{PlatformCommission}$$

### B. Dispatch Engine & Concurrency
1. Customer initiates request with an `x-idempotency-key` header to prevent duplicate booking.
2. The server queries online drivers filtered by `vehicleType` and within a 5 km radius.
3. Candidate drivers are locked one by one using transactional Firestore atomic operations.
4. If a driver rejects or the 15-second timer expires, the lock is released and the request moves to the next closest driver.

### C. Ride State Machine
Guards against invalid hops. Permitted transitions:
- `REQUESTED` $\to$ `SEARCHING_DRIVER` $\to$ `DRIVER_ASSIGNED` $\to$ `DRIVER_ARRIVING` $\to$ `DRIVER_ARRIVED` $\to$ `TRIP_STARTED` $\to$ `TRIP_COMPLETED`.
- Cancellation paths are strictly audited with reasons and role stamps (`CUSTOMER`, `DRIVER`, or `ADMIN`).

### D. Real-Time Location & Battery Optimization
Drivers send GPS updates:
- **Idle / Online:** Every 20-30 seconds or upon significant displacement (>50 meters).
- **Active Trip:** Interpolated every 3-5 seconds to provide smooth heading updates without draining battery or inflating database costs.
