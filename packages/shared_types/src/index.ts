/**
 * MISHWAR (مشوار) - Shared Core Types & Enums
 * Production-ready types shared across Customer App, Driver App, Admin Dashboard, and Backend.
 */

export type UserRole = 
  | 'CUSTOMER' 
  | 'DRIVER' 
  | 'ADMIN' 
  | 'DISPATCHER' 
  | 'SUPPORT' 
  | 'OPS_MANAGER'
  | 'FINANCE'
  | 'KYC_REVIEWER'
  | 'SUPER_ADMIN';

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'OPS_MANAGER'
  | 'SUPPORT'
  | 'FINANCE'
  | 'KYC_REVIEWER';

export type VehicleType = 
  | 'MOTORCYCLE' 
  | 'ECONOMY' 
  | 'COMFORT' 
  | 'FAMILY' 
  | 'CAR';

export type RideStatus =
  | 'REQUESTED'
  | 'SEARCHING_DRIVER'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVING'
  | 'DRIVER_ON_THE_WAY'
  | 'DRIVER_ARRIVED'
  | 'TRIP_STARTED'
  | 'TRIP_COMPLETED'
  | 'CANCELLED_BY_CUSTOMER'
  | 'CANCELLED_BY_DRIVER'
  | 'CANCELLED_BY_PASSENGER'
  | 'NO_DRIVER_FOUND'
  | 'NO_DRIVER_AVAILABLE';

export type DriverStatus = 
  | 'OFFLINE' 
  | 'ONLINE' 
  | 'IN_RIDE' 
  | 'PENDING_APPROVAL' 
  | 'SUSPENDED';

export type PaymentMethod = 'CASH' | 'WALLET' | 'CARD';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
export type RideOfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface GeoPoint {
  latitude: number;
  longitude: number;
  addressName: string;
  landmark?: string;
}

export interface FavoriteLocation {
  id: string;
  title: string;
  icon: 'HOME' | 'WORK' | 'UNIVERSITY' | 'MALL' | 'STAR';
  location: GeoPoint;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'RIDE_UPDATE' | 'PAYMENT' | 'SECURITY' | 'PROMO';
  timestamp: string;
  isRead: boolean;
  rideId?: string;
}

export interface WalletLedgerEntry {
  transactionId: string;
  userId: string;
  type:
    | 'DEBIT'
    | 'CREDIT'
    | 'REFUND'
    | 'COMMISSION_DEDUCTION'
    | 'RIDE_PAYMENT'
    | 'TOPUP'
    | 'DRIVER_PAYOUT'
    | 'SETTLEMENT_CLOSE'
    | 'CASH_COLLECTION'
    | 'ADJUSTMENT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';
  createdAt: string;
  referenceId: string;
  description?: string;
  idempotencyKey?: string;
  immutableHash?: string;
  reversalOfTransactionId?: string;
  closedAt?: string;
}

export interface PaymentTransaction {
  id: string;
  rideId?: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  type: 'RIDE_PAYMENT' | 'WALLET_TOPUP' | 'DRIVER_PAYOUT' | 'COMMISSION_DEDUCTION';
  timestamp: string;
  referenceNumber: string;
}

export interface PaymentRecord {
  paymentId: string;
  rideId: string;
  passengerId: string;
  driverId?: string;
  amount: number;
  platformCommission: number;
  driverNet: number;
  method: PaymentMethod;
  status: PaymentStatus;
  idempotencyKey: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  ratingAverage: number;
  ratingCount: number;
  walletBalance: number; // in YER (Yemeni Rial)
  favoriteLocations?: FavoriteLocation[];
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  driverId: string;
  type: VehicleType;
  vehicleType?: VehicleType; // Item 6 alias
  make: string;      // e.g. "Toyota", "Haojue"
  model: string;     // e.g. "Yaris", "HJ125"
  year: number;
  color: string;
  plateNumber: string; // e.g. "صنعاء 14528/أ"
  isVerified: boolean;
  capacity: number;   // e.g. 1 for moto, 4 for car, 6 for family
  hasAC: boolean;     // e.g. true for cars with AC, false for moto
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export interface VehicleCategoryConfig {
  id: string;
  name: string;
  type: VehicleType;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  capacity: number;
  baseFare: number;
  pricePerKm: number;
  pricePerMinute: number;
  minimumFare: number;
  supportsAC: boolean;
  iconName: string;
  image?: string;
  badge?: string;
}

export interface DriverDocument {
  id: string;
  driverId: string;
  type: 'NATIONAL_ID' | 'DRIVING_LICENSE' | 'VEHICLE_REGISTRATION' | 'VEHICLE_PHOTOS' | 'INSURANCE' | 'BACKGROUND_CHECK';
  documentUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  uploadedAt: string;
  expiresAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface KycReviewRecord {
  id: string;
  driverId: string;
  documentId: string;
  decision: 'APPROVED' | 'REJECTED' | 'REQUEST_CHANGES';
  reviewerId: string;
  reviewerRole: AdminRole;
  notes: string;
  createdAt: string;
}

export interface DriverProfile extends UserProfile {
  driverStatus: DriverStatus;
  vehicle?: Vehicle;
  currentLocation?: GeoPoint;
  lastLocationUpdate?: string;
  todayEarnings: number;
  todayTripsCount: number;
  isAcceptingRides: boolean;
}

export interface PricingRule {
  id: string;
  vehicleType: VehicleType;
  baseFare: number;          // YER
  pricePerKm: number;        // YER per km
  pricePerMinute: number;    // YER per minute
  minimumFare: number;       // YER
  platformCommissionRate: number; // e.g. 0.10 for 10%
  peakMultiplier: number;    // default 1.0, e.g. 1.25 during rush hours
  acSurcharge?: number;      // Extensible optional AC surcharge
  extraPassengerSurcharge?: number; // Extensible optional extra passenger surcharge
  currency: string;          // "YER"
  updatedAt: string;
}

export interface Zone {
  id: string;
  nameAr: string;
  nameEn: string;
  city: string;              // "Sana'a", "Aden", "Taiz"
  center: GeoPoint;
  radiusKm: number;
  isActive: boolean;
  surgeMultiplier: number;
}

export interface FareCalculation {
  baseFare: number;
  distanceKm: number;
  distanceFare: number;
  durationMinutes: number;
  timeFare: number;
  surgeMultiplier: number;
  grossFare: number;          // Total price customer pays
  platformCommission: number; // Platform cut
  driverNetEarnings: number;  // Driver payout
  currency: string;
}

export interface Ride {
  id: string;
  rideId?: string; // Item 8 alias
  idempotencyKey?: string;
  customerId: string;
  passengerId?: string; // Item 8 alias
  customerName: string;
  customerPhone: string;
  customerRating: number;
  customerAvatar?: string;
  
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverRating?: number;
  driverAvatar?: string;
  vehicle?: Vehicle;
  driverLocation?: GeoPoint;
  driverLocationUpdatedAt?: string;
  
  vehicleType: VehicleType;
  status: RideStatus;
  
  pickup: GeoPoint;
  destination: GeoPoint;
  
  passengerCount: number;             // Number of passengers (1..capacity)
  airConditioningRequired: boolean;   // AC requested true/false
  scheduledAt?: string;               // Optional scheduled ride timestamp
  
  estimatedDistanceKm: number;
  distance?: number; // Item 8 alias
  estimatedDurationMins: number;
  estimatedDuration?: number; // Item 8 alias
  actualDistanceKm?: number;
  actualDurationMins?: number;
  
  fare: FareCalculation;
  estimatedFare?: number; // Item 8 alias
  finalFare?: number;     // Item 8 alias
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  
  cancellationReason?: string;
  cancelledByRole?: 'CUSTOMER' | 'DRIVER' | 'ADMIN';
  
  createdAt: string;
  assignedAt?: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface RideEvent {
  id: string;
  rideId: string;
  status: RideStatus;
  timestamp: string;
  location?: GeoPoint;
  note?: string;
  actorRole?: UserRole | 'SYSTEM';
  actorId?: string;
  metadata?: Record<string, unknown>;
}

export interface RideOffer {
  id: string;
  rideId: string;
  driverId: string;
  status: RideOfferStatus;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
}

export interface DriverLiveLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  updatedAt: string;
}

export interface DispatchCandidateScore {
  driverId: string;
  driverName: string;
  distanceKm: number;
  etaMinutes: number;
  ratingScore: number;
  acceptanceScore: number;
  vehicleScore: number;
  freshnessPenalty: number;
  balanceScore: number;
  totalScore: number;
  reasons: string[];
}

export interface ChatMessage {
  id: string;
  rideId: string;
  senderId: string;
  senderRole: 'CUSTOMER' | 'DRIVER';
  text: string;
  timestamp: string;
}

export interface RatingReview {
  id: string;
  rideId: string;
  fromUserId: string;
  toUserId: string;
  targetRole: 'DRIVER' | 'CUSTOMER';
  stars: number; // 1 to 5
  comment?: string;
  tags?: string[];
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  rideId?: string;
  category: 'BILLING' | 'DRIVER_BEHAVIOR' | 'VEHICLE_ISSUE' | 'LOST_ITEM' | 'GENERAL';
  subject: string;
  description: string;
  status: TicketStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
  slaDueAt?: string;
  escalatedTo?: AdminRole;
  resolutionNotes?: string;
}

export interface SOSAlert {
  id: string;
  rideId: string;
  triggeredByUserId: string;
  triggeredByRole: 'CUSTOMER' | 'DRIVER';
  location: GeoPoint;
  timestamp: string;
  status: 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED';
  resolvedAt?: string;
  notes?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sharedTrackingUrl?: string;
  operatorId?: string;
  contactedEmergency?: boolean;
}

export interface SafetyReport {
  id: string;
  rideId?: string;
  reporterUserId: string;
  reporterRole: 'CUSTOMER' | 'DRIVER';
  reportedUserId?: string;
  reportedRole?: 'CUSTOMER' | 'DRIVER';
  category: 'SOS' | 'HARASSMENT' | 'UNSAFE_DRIVING' | 'PAYMENT_DISPUTE' | 'NO_SHOW' | 'OTHER';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  assignedTo?: AdminRole;
  adminNotes?: string;
}

export interface UserBlockRecord {
  id: string;
  blockedUserId: string;
  blockedRole: 'CUSTOMER' | 'DRIVER';
  requestedByUserId: string;
  requestedByRole: 'CUSTOMER' | 'DRIVER' | 'ADMIN';
  reason: string;
  status: 'ACTIVE' | 'REVIEWED' | 'REVOKED';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface DriverSettlement {
  id: string;
  driverId: string;
  driverName: string;
  date: string;
  grossCollected: number;
  platformCommission: number;
  driverNet: number;
  cashCollected: number;
  walletCollected: number;
  status: 'DRAFT' | 'LOCKED' | 'PAID' | 'REVERSED';
  referenceNumber: string;
  proofUrl?: string;
  closedAt?: string;
  paidAt?: string;
  lockedBy?: string;
  notes?: string;
}

export interface DiagnosticEvent {
  id: string;
  source: 'FRONTEND' | 'BACKEND' | 'PAYMENT' | 'RIDE' | 'AUTH' | 'GPS' | 'NOTIFICATION';
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  createdAt: string;
  durationMs?: number;
  userId?: string;
  rideId?: string;
  metadata?: Record<string, unknown>;
}

export interface BackupSnapshot {
  id: string;
  scope: 'DATABASE' | 'LEDGER' | 'CONFIG' | 'FULL_SYSTEM';
  status: 'SCHEDULED' | 'COMPLETED' | 'FAILED' | 'RESTORE_TESTED';
  createdAt: string;
  completedAt?: string;
  restoreTestedAt?: string;
  storagePath: string;
  checksum: string;
  notes?: string;
}

export interface AuditActor {
  id: string;
  role: UserRole | 'SYSTEM';
  emailOrPhone?: string;
  name?: string;
}

export interface AuditTarget {
  type: 'DRIVER' | 'CUSTOMER' | 'RIDE' | 'PRICING' | 'ZONE' | 'SYSTEM' | 'WALLET' | 'AUTH' | 'CONFIG';
  id: string;
}

export interface AuditLog {
  id: string;
  actor?: AuditActor;
  action: string;
  target?: AuditTarget;
  timestamp: string;
  metadata?: Record<string, unknown>;
  // Backwards compatibility fields
  adminId?: string;
  adminEmail?: string;
  targetType?: 'DRIVER' | 'CUSTOMER' | 'RIDE' | 'PRICING' | 'ZONE' | 'SYSTEM' | 'WALLET' | 'AUTH' | 'CONFIG' | string;
  targetId?: string;
  details?: Record<string, unknown>;
}

export interface TestResult {
  name: string;
  category: 'PRICING' | 'STATE_MACHINE' | 'DISPATCH' | 'PAYMENT' | 'RATING' | 'AUTH' | 'GEO' | 'SECURITY' | 'ISOLATION' | 'LEDGER' | 'SCENARIO';
  status: 'PASS' | 'FAIL' | 'WARNING';
  passed: boolean;
  expected: string;
  actual: string;
  durationMs: number;
  timestamp: string;
  errorMessage?: string;
  message?: string;
}

export interface City {
  id: string;
  nameAr: string;
  nameEn: string;
  countryCode: string; // "YE"
  center: GeoPoint;
  isActive: boolean;
}

export interface FeatureFlags {
  enableWallet: boolean;
  enableCard: boolean;
  enableDelivery: boolean;
  enableCorporate: boolean;
  enablePromo: boolean;
  enableSOS: boolean;
  enableChat: boolean;
}

export interface PilotConfig {
  isPilotMode: boolean;
  maxDrivers: number;
  maxCustomers: number;
  isCashOnly: boolean;
  allowedCities: string[];
}

export interface PlatformSettings {
  id: string;
  platformNameAr: string;
  platformNameEn: string;
  currency: string;
  defaultCommissionRate: number;
  supportPhone: string;
  supportEmail: string;
  featureFlags: FeatureFlags;
  pilotConfig: PilotConfig;
  operations?: {
    maintenanceMode: boolean;
    maintenanceMessageAr: string;
    forceUpdateRequired: boolean;
    minimumSupportedWebVersion: string;
    minimumSupportedPassengerVersion: string;
    minimumSupportedDriverVersion: string;
    dailyRideLimit: number;
    verifiedDriversOnly: boolean;
  };
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
  error?: {
    code: string;
    details?: unknown;
  } | null;
}
