# MISHWAR (مشوار) - Production Database & Firestore Data Models

This document defines the complete canonical schemas for the 13 collections designed for persistent storage in Google Cloud Firestore / Cloud SQL.

---

## Collections & Schemas

### 1. `users`
Represents system authentication accounts and unified identity records.
```typescript
interface UserDocument {
  id: string; // Auth UID
  fullName: string;
  phoneNumber: string; // E.164 formatted, e.g., +967 771 234 567
  email?: string;
  avatarUrl?: string;
  role: 'CUSTOMER' | 'DRIVER' | 'ADMIN' | 'DISPATCHER' | 'SUPPORT' | 'SUPER_ADMIN';
  isActive: boolean;
  isPhoneVerified: boolean;
  fcmTokens: string[]; // For push notifications
  preferredLanguage: 'ar' | 'en';
  createdAt: string; // ISO 8601
  updatedAt: string;
}
```

---

### 2. `drivers`
Extended driver operations, KYC verification, and live shift status.
```typescript
interface DriverDocument {
  id: string; // References users.id
  fullName: string;
  phoneNumber: string;
  driverStatus: 'OFFLINE' | 'ONLINE' | 'IN_RIDE' | 'PENDING_APPROVAL' | 'SUSPENDED';
  isAcceptingRides: boolean;
  vehicleId: string; // References vehicles.id
  currentLocation?: {
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
    updatedAt: string;
  };
  ratingAverage: number; // e.g. 4.95
  ratingCount: number;
  todayEarnings: number; // in YER
  todayTripsCount: number;
  lifetimeEarnings: number;
  lifetimeTripsCount: number;
  documents: {
    nationalIdUrl?: string;
    driverLicenseUrl?: string;
    vehicleRegistrationUrl?: string;
    policeClearanceUrl?: string;
    verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    verifiedAt?: string;
    verifiedBy?: string;
  };
  payoutAccount?: {
    bankName: 'KURAIMI' | 'CAC_BANK' | 'YEMEN_KUWAIT_BANK' | 'OTHER';
    accountNumber: string;
    accountHolderName: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

---

### 3. `passengers`
Passenger preferences, saved locations, and emergency contacts.
```typescript
interface PassengerDocument {
  id: string; // References users.id
  fullName: string;
  phoneNumber: string;
  ratingAverage: number; // e.g. 4.90
  ratingCount: number;
  totalRidesCount: number;
  walletBalance: number; // in YER (derived via wallets collection)
  savedLocations: Array<{
    id: string;
    title: string;
    tag: 'HOME' | 'WORK' | 'UNIVERSITY' | 'MALL' | 'STAR';
    latitude: number;
    longitude: number;
    addressName: string;
  }>;
  emergencyContacts: Array<{
    name: string;
    phoneNumber: string;
    relationship: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
```

---

### 4. `vehicles`
Fleet metadata and vehicle inspection records.
```typescript
interface VehicleDocument {
  id: string;
  driverId: string; // References drivers.id
  type: 'MOTORCYCLE' | 'ECONOMY' | 'COMFORT' | 'FAMILY' | 'CAR';
  make: string; // e.g., 'Toyota', 'Haojue'
  model: string; // e.g., 'Yaris', 'HJ125-8E'
  year: number; // e.g., 2022
  color: string;
  plateNumber: string; // e.g., 'صنعاء 12948/أ' or 'صنعاء 84210/د'
  capacity: number; // 1 for motorcycle, 4 for car, 7 for family XL
  isAirConditioned: boolean;
  isVerified: boolean;
  inspectionExpiryDate: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### 5. `rides`
Core ride dispatch, telemetry, routes, and lifecycle state.
```typescript
interface RideDocument {
  id: string;
  idempotencyKey: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerRating: number;
  
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverRating?: number;
  vehicleType: 'MOTORCYCLE' | 'ECONOMY' | 'COMFORT' | 'FAMILY' | 'CAR';
  vehiclePlateNumber?: string;

  status:
    | 'REQUESTED'
    | 'SEARCHING_DRIVER'
    | 'DRIVER_ASSIGNED'
    | 'DRIVER_ARRIVING'
    | 'DRIVER_ARRIVED'
    | 'TRIP_STARTED'
    | 'TRIP_COMPLETED'
    | 'CANCELLED_BY_CUSTOMER'
    | 'CANCELLED_BY_DRIVER'
    | 'NO_DRIVER_AVAILABLE';

  pickup: {
    latitude: number;
    longitude: number;
    addressName: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    addressName: string;
  };

  estimatedDistanceKm: number;
  estimatedDurationMins: number;
  actualDistanceKm?: number;
  actualDurationMins?: number;

  fare: {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    surgeMultiplier: number;
    grossFare: number;
    platformCommission: number;
    driverNetEarnings: number;
    currency: 'YER';
  };

  paymentMethod: 'CASH' | 'WALLET' | 'CARD';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  
  cancellationReason?: string;
  cancelledByRole?: 'CUSTOMER' | 'DRIVER' | 'ADMIN';

  timestamps: {
    requestedAt: string;
    assignedAt?: string;
    arrivedAt?: string;
    startedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
  };
}
```

---

### 6. `payments`
Transaction records for cash reconciliations and digital charges.
```typescript
interface PaymentDocument {
  id: string;
  rideId: string;
  payerId: string;
  payeeId?: string; // Driver ID
  amount: number;
  currency: 'YER';
  method: 'CASH' | 'WALLET' | 'CARD';
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  referenceNumber: string; // e.g., 'MISH-918231'
  idempotencyKey: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### 7. `wallets`
Stored-value digital balances for passengers and drivers.
```typescript
interface WalletDocument {
  userId: string; // Unique primary key (user ID)
  balance: number; // in YER (Current confirmed balance)
  pendingCredits: number;
  pendingDebits: number;
  currency: 'YER';
  isFrozen: boolean;
  frozenReason?: string;
  lastLedgerSequence: number;
  updatedAt: string;
}
```

---

### 8. `walletTransactions` (Wallet Ledger)
Immutable double-entry ledger for every balance mutation. Direct edits prohibited.
```typescript
interface WalletTransactionDocument {
  transactionId: string; // Unique UUID
  userId: string;
  type: 'TOPUP' | 'RIDE_PAYMENT' | 'REFUND' | 'COMMISSION_DEDUCTION' | 'DRIVER_PAYOUT' | 'ADJUSTMENT';
  amount: number; // Always positive
  balanceBefore: number;
  balanceAfter: number;
  status: 'SUCCESS' | 'FAILED' | 'REVERSED';
  referenceId: string; // Ride ID, Bank Ref, or Kuraimi Voucher
  description: string;
  idempotencyKey?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
```

---

### 9. `ratings`
Passenger-to-driver and driver-to-passenger reviews.
```typescript
interface RatingDocument {
  id: string;
  rideId: string;
  fromUserId: string;
  toUserId: string;
  targetRole: 'DRIVER' | 'CUSTOMER';
  stars: number; // 1 to 5
  comment?: string;
  tags?: string[]; // e.g. ['قيادة آمنة', 'مركبة نظيفة', 'التزام بالموعد']
  createdAt: string;
}
```

---

### 10. `notifications`
Direct in-app and push notification event records.
```typescript
interface NotificationDocument {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'RIDE_UPDATE' | 'PAYMENT' | 'SECURITY' | 'PROMO' | 'SYSTEM';
  rideId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}
```

---

### 11. `auditLogs`
Compliance, security, and administrative action logs.
```typescript
interface AuditLogDocument {
  id: string;
  actor: {
    id: string;
    role: 'ADMIN' | 'SUPER_ADMIN' | 'DISPATCHER' | 'CUSTOMER' | 'DRIVER' | 'SYSTEM';
    emailOrPhone?: string;
    name?: string;
  };
  action:
    | 'LOGIN'
    | 'LOGOUT'
    | 'RIDE_CREATION'
    | 'RIDE_CANCELLATION'
    | 'DRIVER_ASSIGNMENT'
    | 'PAYMENT_PROCESSED'
    | 'WALLET_TRANSACTION'
    | 'DRIVER_APPROVAL'
    | 'DRIVER_SUSPENSION'
    | 'PRICING_RULE_CHANGE'
    | 'CONFIG_CHANGE';
  target: {
    type: 'DRIVER' | 'CUSTOMER' | 'RIDE' | 'PRICING' | 'ZONE' | 'SYSTEM' | 'WALLET' | 'AUTH' | 'CONFIG';
    id: string;
  };
  timestamp: string; // ISO 8601
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}
```

---

### 12. `pricingRules`
Tariff configuration per city and vehicle type.
```typescript
interface PricingRuleDocument {
  id: string;
  cityId: string; // e.g., 'city_sanaa'
  vehicleType: 'MOTORCYCLE' | 'ECONOMY' | 'COMFORT' | 'FAMILY' | 'CAR';
  baseFare: number; // in YER (e.g. 1,200 for Car, 500 for Motorcycle)
  pricePerKm: number; // in YER (e.g. 350 for Car, 150 for Motorcycle)
  pricePerMinute: number; // in YER (e.g. 45 for Car, 25 for Motorcycle)
  minimumFare: number; // in YER (Strict clamp: 1,800 for Car, 700 for Motorcycle)
  platformCommissionRate: number; // 0.10 for 10%
  peakMultiplier: number; // Default 1.0
  currency: 'YER';
  updatedAt: string;
  updatedBy: string;
}
```

---

### 13. `settings`
Global platform flags, pilot constraints, and operational switches.
```typescript
interface SettingsDocument {
  id: 'global_settings';
  platformNameAr: string;
  platformNameEn: string;
  currency: 'YER';
  defaultCommissionRate: number; // 0.10
  supportPhone: string;
  supportEmail: string;
  featureFlags: {
    enableWallet: boolean;
    enableCard: boolean;
    enableDelivery: boolean;
    enableCorporate: boolean;
    enablePromo: boolean;
    enableSOS: boolean;
    enableChat: boolean;
  };
  pilotConfig: {
    isPilotMode: boolean;
    maxDrivers: number;
    maxCustomers: number;
    isCashOnly: boolean;
    allowedCities: string[];
  };
  updatedAt: string;
  updatedBy: string;
}
```
