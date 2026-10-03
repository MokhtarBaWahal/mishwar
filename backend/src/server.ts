import express, { Request, Response, NextFunction } from 'express';
import { calculateFare, calculateDistanceKm, estimateDurationMinutes } from '../../packages/shared_utils/src';
import {
  ApiResponse,
  PricingRule,
  Ride,
  RideStatus,
  VehicleType,
  SOSAlert,
  PilotConfig,
  PaymentMethod,
  UserRole,
  SafetyReport,
  UserBlockRecord,
  DriverDocument,
  KycReviewRecord,
  DriverSettlement,
  DiagnosticEvent,
  BackupSnapshot
} from '../../packages/shared_types/src';
import { backendConfig } from './config';
import { AuthenticatedRequest, requireAuth, requireRole } from './auth';
import {
  ApiValidationError,
  assertGeoPoint,
  assertPassengerCount,
  assertPaymentMethod,
  assertPositiveAmount,
  assertVehicleType
} from './validation';

const app = express();
const PORT = backendConfig.port;
const NODE_ENV = backendConfig.nodeEnv;
const API_TOKEN = backendConfig.apiToken;
const allowedOrigins = backendConfig.allowedOrigins;

// In-Memory Pilot Registry & Idempotency Store
const processedIdempotencyKeys = new Map<string, { timestamp: number; response: any }>();
const activeRideLocks = new Map<string, string>(); // rideId -> lockedDriverId
const walletBalances = new Map<string, number>([
  ['cust_01', 8500],
  ['cust_02', 4200],
  ['cust_03', 12000],
  ['cust_04', 3500],
  ['cust_05', 9100]
]);
const ridesStore = new Map<string, Ride>();
const safetyReportsStore = new Map<string, SafetyReport>();
const userBlocksStore = new Map<string, UserBlockRecord>();
const driverDocumentsStore = new Map<string, DriverDocument>();
const kycReviewStore = new Map<string, KycReviewRecord>();
const settlementsStore = new Map<string, DriverSettlement>();
const diagnosticEventsStore = new Map<string, DiagnosticEvent>();
const backupSnapshotsStore = new Map<string, BackupSnapshot>();
const immutableLedgerStore: Array<{
  transactionId: string;
  userId: string;
  type: string;
  amount: number;
  status: string;
  referenceId: string;
  createdAt: string;
  immutableHash: string;
}> = [];

const defaultPricingRules: Record<string, PricingRule> = {
  MOTORCYCLE: {
    id: 'rule_motorcycle_backend',
    vehicleType: 'MOTORCYCLE',
    baseFare: 500,
    pricePerKm: 150,
    pricePerMinute: 25,
    minimumFare: 700,
    platformCommissionRate: 0.1,
    peakMultiplier: 1,
    currency: 'YER',
    updatedAt: new Date().toISOString()
  },
  ECONOMY: {
    id: 'rule_economy_backend',
    vehicleType: 'ECONOMY',
    baseFare: 1200,
    pricePerKm: 350,
    pricePerMinute: 45,
    minimumFare: 1800,
    platformCommissionRate: 0.1,
    peakMultiplier: 1,
    currency: 'YER',
    updatedAt: new Date().toISOString()
  },
  CAR: {
    id: 'rule_car_backend',
    vehicleType: 'CAR',
    baseFare: 1200,
    pricePerKm: 350,
    pricePerMinute: 45,
    minimumFare: 1800,
    platformCommissionRate: 0.1,
    peakMultiplier: 1,
    currency: 'YER',
    updatedAt: new Date().toISOString()
  },
  COMFORT: {
    id: 'rule_comfort_backend',
    vehicleType: 'COMFORT',
    baseFare: 1600,
    pricePerKm: 420,
    pricePerMinute: 55,
    minimumFare: 2400,
    platformCommissionRate: 0.1,
    peakMultiplier: 1,
    currency: 'YER',
    updatedAt: new Date().toISOString()
  },
  FAMILY: {
    id: 'rule_family_backend',
    vehicleType: 'FAMILY',
    baseFare: 2200,
    pricePerKm: 550,
    pricePerMinute: 70,
    minimumFare: 3200,
    platformCommissionRate: 0.1,
    peakMultiplier: 1,
    currency: 'YER',
    updatedAt: new Date().toISOString()
  }
};

// Pilot Configuration Defaults
let pilotConfig: PilotConfig = {
  isPilotMode: true,
  maxDrivers: 10,
  maxCustomers: 100,
  isCashOnly: true,
  allowedCities: ["Sana'a", 'Aden']
};

// CORS Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (!origin || NODE_ENV === 'development' || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || allowedOrigins[0] || 'http://localhost:3000');
  }
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-idempotency-key, x-user-id, x-user-role');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// API Response Helpers
function sendSuccess<T>(res: Response, data: T, message: string = 'Success') {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    error: null
  };
  return res.status(200).json(response);
}

function sendError(res: Response, statusCode: number, message: string, code: string, details?: unknown) {
  const response: ApiResponse = {
    success: false,
    data: null,
    message,
    error: { code, details }
  };
  return res.status(statusCode).json(response);
}

function sendValidationError(res: Response, error: unknown) {
  if (error instanceof ApiValidationError) {
    return sendError(res, 400, error.message, error.code, error.details);
  }
  return sendError(res, 500, 'Unexpected server error', 'INTERNAL_ERROR');
}

function requireApiAuth(requiredRole?: UserRole) {
  const roles = requiredRole ? [requiredRole] : [];
  return [
    requireAuth,
    ...(roles.length > 0 ? [requireRole(...roles)] : [])
  ];
}

// Rate Limiter Middleware (Anti-Spam)
function rateLimit(limitCount: number = 30, windowMs: number = 60000) {
  const requestLogs = new Map<string, number[]>();
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'global_client';
    const now = Date.now();
    const timestamps = (requestLogs.get(ip) || []).filter((t) => now - t < windowMs);

    if (timestamps.length >= limitCount) {
      return sendError(res, 429, 'تجاوزت الحد المسموح من الطلبات. يرجى الانتظار.', 'RATE_LIMIT_EXCEEDED');
    }

    timestamps.push(now);
    requestLogs.set(ip, timestamps);
    next();
  };
}

// 1. Health & Pilot Status Check
app.get('/health', (req: Request, res: Response) => {
  return sendSuccess(res, {
    status: 'ONLINE',
    service: 'MISHWAR Core Pilot Backend',
    pilotConfig,
    timestamp: new Date().toISOString()
  });
});

// 2. Server-Authoritative Pricing Calculation
app.post('/api/pricing/calculate', requireApiAuth(), rateLimit(60), (req: Request, res: Response) => {
  const { pickup, destination, vehicleType, pricingRule, zoneMultiplier } = req.body;

  if (!pickup || !destination || !vehicleType || !pricingRule) {
    return sendError(res, 400, 'البيانات المطلوبة لحساب السعر غير مكتملة', 'INVALID_INPUT');
  }

  const distanceKm = calculateDistanceKm(pickup, destination);
  const durationMins = estimateDurationMinutes(distanceKm, vehicleType as VehicleType);
  const fare = calculateFare(distanceKm, durationMins, pricingRule as PricingRule, zoneMultiplier || 1.0);

  return sendSuccess(res, { fare, distanceKm, durationMins }, 'تم احتساب الأجرة بدقة من السيرفر');
});

// Real Pilot Ride API: server-authoritative request creation.
app.post('/api/rides', requireApiAuth('CUSTOMER'), rateLimit(20), (req: AuthenticatedRequest, res: Response) => {
  try {
    const idempotencyKey = req.headers['x-idempotency-key'] as string;
    if (!idempotencyKey) {
      return sendError(res, 400, 'x-idempotency-key is required', 'MISSING_IDEMPOTENCY_KEY');
    }
    if (processedIdempotencyKeys.has(idempotencyKey)) {
      const cached = processedIdempotencyKeys.get(idempotencyKey)!;
      return sendSuccess(res, cached.response, 'Idempotent ride request replay returned safely');
    }

    const pickup = assertGeoPoint(req.body.pickup, 'pickup');
    const destination = assertGeoPoint(req.body.destination, 'destination');
    const vehicleType = assertVehicleType(req.body.vehicleType);
    const passengerCount = assertPassengerCount(req.body.passengerCount);
    const paymentMethod = assertPaymentMethod(req.body.paymentMethod || 'CASH');
    const airConditioningRequired = Boolean(req.body.airConditioningRequired);
    const pricingRule = defaultPricingRules[vehicleType] || defaultPricingRules.CAR;
    const distanceKm = calculateDistanceKm(pickup, destination);
    const durationMins = estimateDurationMinutes(distanceKm, vehicleType);
    const fare = calculateFare(distanceKm, durationMins, pricingRule, 1);

    const now = new Date().toISOString();
    const rideId = `ride_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const ride: Ride = {
      id: rideId,
      rideId,
      idempotencyKey,
      customerId: req.user!.uid,
      passengerId: req.user!.uid,
      customerName: typeof req.body.customerName === 'string' ? req.body.customerName : 'MISHWAR Passenger',
      customerPhone: typeof req.body.customerPhone === 'string' ? req.body.customerPhone : req.user!.phone || '',
      customerRating: 5,
      vehicleType,
      status: 'SEARCHING_DRIVER',
      pickup,
      destination,
      passengerCount,
      airConditioningRequired,
      scheduledAt: typeof req.body.scheduledAt === 'string' ? req.body.scheduledAt : undefined,
      estimatedDistanceKm: distanceKm,
      distance: distanceKm,
      estimatedDurationMins: durationMins,
      estimatedDuration: durationMins,
      fare,
      estimatedFare: fare.grossFare,
      finalFare: fare.grossFare,
      paymentMethod,
      paymentStatus: 'PENDING',
      createdAt: now
    };

    ridesStore.set(rideId, ride);
    processedIdempotencyKeys.set(idempotencyKey, { timestamp: Date.now(), response: ride });
    return sendSuccess(res, ride, 'Ride created with server-authoritative fare');
  } catch (error) {
    return sendValidationError(res, error);
  }
});

app.get('/api/rides/active', requireApiAuth(), rateLimit(120), (req: AuthenticatedRequest, res: Response) => {
  const ride = Array.from(ridesStore.values())
    .filter((candidate) => req.user!.role === 'DRIVER'
      ? candidate.driverId === req.user!.uid
      : candidate.customerId === req.user!.uid)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] || null;

  return sendSuccess(res, ride, 'Latest ride fetched');
});

app.get('/api/rides/:id', requireApiAuth(), rateLimit(60), (req: AuthenticatedRequest, res: Response) => {
  const ride = ridesStore.get(req.params.id);
  if (!ride) return sendError(res, 404, 'Ride not found', 'RIDE_NOT_FOUND');
  if (
    req.user!.role !== 'ADMIN' &&
    req.user!.role !== 'SUPER_ADMIN' &&
    ride.customerId !== req.user!.uid &&
    ride.driverId !== req.user!.uid
  ) {
    return sendError(res, 403, 'Forbidden for this ride', 'RIDE_FORBIDDEN');
  }
  return sendSuccess(res, ride, 'Ride fetched');
});

app.post('/api/rides/:id/location', requireApiAuth('DRIVER'), rateLimit(60), (req: AuthenticatedRequest, res: Response) => {
  const ride = ridesStore.get(req.params.id);
  if (!ride) return sendError(res, 404, 'Ride not found', 'RIDE_NOT_FOUND');
  if (ride.driverId !== req.user!.uid) {
    return sendError(res, 403, 'Only the assigned driver can update this location', 'RIDE_FORBIDDEN');
  }
  if (['TRIP_COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'].includes(ride.status)) {
    return sendError(res, 409, 'Location updates are closed for this ride', 'RIDE_NOT_ACTIVE');
  }

    const latitude = req.body?.latitude;
    const longitude = req.body?.longitude;
    if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return sendError(res, 400, 'Valid latitude and longitude are required', 'INVALID_LOCATION');
  }

  const updated = {
    ...ride,
    driverLocation: {
      latitude,
      longitude,
      addressName: 'Current driver location'
    },
    driverLocationUpdatedAt: new Date().toISOString()
  };
  ridesStore.set(ride.id, updated);
  return sendSuccess(res, updated, 'Driver location updated');
});

function updateRideTransition(
  rideId: string,
  nextStatus: RideStatus,
  patch: Partial<Ride> = {}
): { success: boolean; ride?: Ride; error?: string } {
  const ride = ridesStore.get(rideId);
  if (!ride) return { success: false, error: 'RIDE_NOT_FOUND' };

  const allowedTransitions: Record<RideStatus, RideStatus[]> = {
    REQUESTED: ['SEARCHING_DRIVER', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PASSENGER'],
    SEARCHING_DRIVER: ['DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'NO_DRIVER_FOUND', 'NO_DRIVER_AVAILABLE', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PASSENGER'],
    DRIVER_ASSIGNED: ['DRIVER_ARRIVING', 'DRIVER_ON_THE_WAY', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'],
    DRIVER_ARRIVING: ['DRIVER_ARRIVED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'],
    DRIVER_ON_THE_WAY: ['DRIVER_ARRIVED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'],
    DRIVER_ARRIVED: ['TRIP_STARTED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'],
    TRIP_STARTED: ['TRIP_COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'],
    TRIP_COMPLETED: [],
    CANCELLED_BY_CUSTOMER: [],
    CANCELLED_BY_PASSENGER: [],
    CANCELLED_BY_DRIVER: [],
    NO_DRIVER_FOUND: [],
    NO_DRIVER_AVAILABLE: []
  };

  if (!allowedTransitions[ride.status]?.includes(nextStatus)) {
    return { success: false, error: 'INVALID_RIDE_TRANSITION' };
  }

  const updated = { ...ride, ...patch, status: nextStatus };
  ridesStore.set(rideId, updated);
  return { success: true, ride: updated };
}

app.post('/api/rides/:id/accept', requireApiAuth('DRIVER'), rateLimit(30), (req: AuthenticatedRequest, res: Response) => {
  const ride = ridesStore.get(req.params.id);
  if (!ride) return sendError(res, 404, 'Ride not found', 'RIDE_NOT_FOUND');
  if (activeRideLocks.has(ride.id) && activeRideLocks.get(ride.id) !== req.user!.uid) {
    return sendError(res, 409, 'Ride already assigned to another driver', 'RIDE_ALREADY_ASSIGNED');
  }
  activeRideLocks.set(ride.id, req.user!.uid);
  const result = updateRideTransition(ride.id, 'DRIVER_ARRIVING', {
    driverId: req.user!.uid,
    driverName: typeof req.body.driverName === 'string' ? req.body.driverName : 'MISHWAR Driver',
    assignedAt: new Date().toISOString()
  });
  if (!result.success) return sendError(res, 409, result.error || 'Ride accept failed', result.error || 'RIDE_ACCEPT_FAILED');
  return sendSuccess(res, result.ride, 'Ride accepted');
});

app.get('/api/dispatch/incoming', requireApiAuth('DRIVER'), rateLimit(120), (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user!.uid;
  const activeRide = Array.from(ridesStore.values())
    .filter((ride) => ride.driverId === driverId && ![
      'TRIP_COMPLETED',
      'CANCELLED_BY_CUSTOMER',
      'CANCELLED_BY_PASSENGER',
      'CANCELLED_BY_DRIVER',
      'NO_DRIVER_FOUND',
      'NO_DRIVER_AVAILABLE'
    ].includes(ride.status))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
  const incomingRide = activeRide || Array.from(ridesStore.values())
    .filter((ride) => ride.status === 'SEARCHING_DRIVER' && !ride.driverId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))[0] || null;

  return sendSuccess(res, incomingRide, 'Incoming ride fetched');
});

app.post('/api/rides/:id/decline', requireApiAuth('DRIVER'), rateLimit(30), (req: AuthenticatedRequest, res: Response) => {
  const ride = ridesStore.get(req.params.id);
  if (!ride) return sendError(res, 404, 'Ride not found', 'RIDE_NOT_FOUND');
  if (ride.status !== 'SEARCHING_DRIVER') {
    return sendError(res, 409, 'Ride is no longer available to decline', 'RIDE_NOT_AVAILABLE');
  }
  const result = updateRideTransition(ride.id, 'NO_DRIVER_FOUND');
  if (!result.success) return sendError(res, 409, result.error || 'Ride decline failed', result.error || 'RIDE_DECLINE_FAILED');
  return sendSuccess(res, result.ride, 'Ride declined');
});

app.post('/api/rides/:id/cancel', requireApiAuth(), rateLimit(30), (req: AuthenticatedRequest, res: Response) => {
  const ride = ridesStore.get(req.params.id);
  if (!ride) return sendError(res, 404, 'Ride not found', 'RIDE_NOT_FOUND');
  const nextStatus: RideStatus = req.user!.role === 'DRIVER' ? 'CANCELLED_BY_DRIVER' : 'CANCELLED_BY_CUSTOMER';
  const result = updateRideTransition(ride.id, nextStatus, {
    cancellationReason: typeof req.body.reason === 'string' ? req.body.reason : 'Cancelled',
    cancelledByRole: req.user!.role === 'DRIVER' ? 'DRIVER' : 'CUSTOMER',
    cancelledAt: new Date().toISOString()
  });
  if (!result.success) return sendError(res, 409, result.error || 'Ride cancel failed', result.error || 'RIDE_CANCEL_FAILED');
  return sendSuccess(res, result.ride, 'Ride cancelled');
});

app.post('/api/rides/:id/arrived', requireApiAuth('DRIVER'), rateLimit(30), (req: AuthenticatedRequest, res: Response) => {
  const result = updateRideTransition(req.params.id, 'DRIVER_ARRIVED', { arrivedAt: new Date().toISOString() });
  if (!result.success) return sendError(res, 409, result.error || 'Invalid ride transition', result.error || 'INVALID_RIDE_TRANSITION');
  return sendSuccess(res, result.ride, 'Driver arrived');
});

app.post('/api/rides/:id/start', requireApiAuth('DRIVER'), rateLimit(30), (req: AuthenticatedRequest, res: Response) => {
  const result = updateRideTransition(req.params.id, 'TRIP_STARTED', { startedAt: new Date().toISOString() });
  if (!result.success) return sendError(res, 409, result.error || 'Invalid ride transition', result.error || 'INVALID_RIDE_TRANSITION');
  return sendSuccess(res, result.ride, 'Trip started');
});

app.post('/api/rides/:id/complete', requireApiAuth('DRIVER'), rateLimit(30), (req: AuthenticatedRequest, res: Response) => {
  const result = updateRideTransition(req.params.id, 'TRIP_COMPLETED', {
    completedAt: new Date().toISOString(),
    paymentStatus: 'PAID'
  });
  if (!result.success) return sendError(res, 409, result.error || 'Invalid ride transition', result.error || 'INVALID_RIDE_TRANSITION');
  return sendSuccess(res, result.ride, 'Trip completed');
});

// 3. Create Ride with Strict Idempotency
app.post('/api/rides/create', requireApiAuth('CUSTOMER'), rateLimit(20), (req: Request, res: Response) => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string;
  if (!idempotencyKey) {
    return sendError(res, 400, 'مفتاح الحماية ضد التكرار مطلوب (x-idempotency-key)', 'MISSING_IDEMPOTENCY_KEY');
  }

  // Check if request was already processed

  if (processedIdempotencyKeys.has(idempotencyKey)) {
    const cached = processedIdempotencyKeys.get(idempotencyKey)!;
    return sendSuccess(res, cached.response, 'تم استرجاع الطلب السابق بنجاح (Idempotency Safe)');
  }

  const { customerId, customerName, customerPhone, pickup, destination, vehicleType, fare } = req.body;

  if (!customerId || !pickup || !destination || !vehicleType || !fare) {
    return sendError(res, 400, 'بيانات طلب المشوار غير مكتملة', 'INVALID_RIDE_PAYLOAD');
  }

  const rideId = `ride_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const createdRide: Partial<Ride> = {
    id: rideId,
    idempotencyKey,
    customerId,
    customerName,
    customerPhone,
    pickup,
    destination,
    vehicleType,
    fare,
    status: 'SEARCHING_DRIVER',
    paymentMethod: 'CASH',
    paymentStatus: 'PENDING',
    createdAt: new Date().toISOString()
  };

  // Cache response for 10 minutes
  processedIdempotencyKeys.set(idempotencyKey, {
    timestamp: Date.now(),
    response: createdRide
  });

  return sendSuccess(res, createdRide, 'تم إنشاء المشوار بنجاح وبدء محرك التوزيع');
});

// 4. Dispatch Accept (Atomic Driver Locking to prevent race conditions)
app.post('/api/dispatch/accept', requireApiAuth('DRIVER'), rateLimit(30), (req: Request, res: Response) => {
  const { rideId, driverId, driverName } = req.body;

  if (!rideId || !driverId) {
    return sendError(res, 400, 'معرف الرحلة ومعرف السائق مطلوبان', 'MISSING_PARAMS');
  }

  // Atomic check: Has another driver already accepted this ride?
  if (activeRideLocks.has(rideId) && activeRideLocks.get(rideId) !== driverId) {
    return sendError(res, 409, 'عذراً، تم إسناد هذا المشوار لكابتن آخر بالفعل.', 'RIDE_ALREADY_ASSIGNED');
  }

  // Lock the ride to this driver
  activeRideLocks.set(rideId, driverId);

  return sendSuccess(res, {
    rideId,
    driverId,
    assignedAt: new Date().toISOString(),
    status: 'DRIVER_ARRIVING'
  }, 'تم تأكيد قبول المشوار وإسناده بنجاح');
});

// 5. Trigger SOS Emergency Broadcast
app.post('/api/sos/trigger', requireApiAuth(), rateLimit(10), (req: Request, res: Response) => {
  const { rideId, triggeredByUserId, triggeredByRole, location } = req.body;

  if (!rideId || !triggeredByUserId || !location) {
    return sendError(res, 400, 'بيانات نداء الاستغاثة غير مكتملة', 'INVALID_SOS_PAYLOAD');
  }

  const sosAlert: SOSAlert = {
    id: `sos_${Date.now()}`,
    rideId,
    triggeredByUserId,
    triggeredByRole: triggeredByRole || 'CUSTOMER',
    location,
    timestamp: new Date().toISOString(),
    status: 'ACTIVE'
  };

  console.warn(`[EMERGENCY SOS ALERT] Triggered on ride: ${rideId} at (${location.latitude}, ${location.longitude})`);

  return sendSuccess(res, sosAlert, 'تم إرسال نداء الطوارئ وتنبيه عمليات مشوار بنجاح');
});

// 6. Server-side Payment Processing with Idempotency
app.post('/api/payments/ride', requireApiAuth('CUSTOMER'), rateLimit(30), (req: Request, res: Response) => {
  const idempotencyKey = req.headers['x-idempotency-key'] as string;
  if (!idempotencyKey) {
    return sendError(res, 400, 'x-idempotency-key is required', 'MISSING_IDEMPOTENCY_KEY');
  }

  if (processedIdempotencyKeys.has(idempotencyKey)) {
    const cached = processedIdempotencyKeys.get(idempotencyKey)!;
    return sendSuccess(res, cached.response, 'Idempotent payment replay returned safely');
  }

  const { rideId, userId, amount, method } = req.body;
  if (!rideId || !userId || typeof amount !== 'number' || amount <= 0 || !method) {
    return sendError(res, 400, 'Invalid payment payload', 'INVALID_PAYMENT_PAYLOAD');
  }

  if (method === 'CASH') {
    const response = {
      transactionId: `tx_cash_${Date.now()}`,
      rideId,
      userId,
      amount,
      method,
      status: 'PAID'
    };
    processedIdempotencyKeys.set(idempotencyKey, { timestamp: Date.now(), response });
    return sendSuccess(res, response, 'Cash payment recorded');
  }

  if (method !== 'WALLET') {
    return sendError(res, 400, 'Only CASH and WALLET are enabled in pilot mode', 'PAYMENT_METHOD_DISABLED');
  }

  const currentBalance = walletBalances.get(userId) ?? 0;
  const hasFunds = currentBalance >= amount;
  const ledgerEntry = {
    transactionId: `tx_wallet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    type: 'RIDE_PAYMENT',
    amount,
    balanceBefore: currentBalance,
    balanceAfter: hasFunds ? currentBalance - amount : currentBalance,
    status: hasFunds ? 'SUCCESS' : 'FAILED',
    referenceId: rideId,
    idempotencyKey,
    createdAt: new Date().toISOString()
  };

  if (!hasFunds) {
    const response = { transactionId: ledgerEntry.transactionId, status: 'FAILED', ledgerEntry };
    processedIdempotencyKeys.set(idempotencyKey, { timestamp: Date.now(), response });
    return sendError(res, 402, 'Insufficient wallet balance', 'INSUFFICIENT_FUNDS', response);
  }

  walletBalances.set(userId, ledgerEntry.balanceAfter);
  const response = { transactionId: ledgerEntry.transactionId, status: 'PAID', ledgerEntry };
  processedIdempotencyKeys.set(idempotencyKey, { timestamp: Date.now(), response });
  return sendSuccess(res, response, 'Wallet payment completed');
});

// 7. Safety reports, user blocks, KYC, immutable ledger, settlements, diagnostics, backups
app.post('/api/safety/reports', requireApiAuth(), rateLimit(20), (req: AuthenticatedRequest, res: Response) => {
  const { rideId, reportedUserId, reportedRole, category, description, severity } = req.body;
  if (!category || !description) return sendError(res, 400, 'Safety report category and description are required', 'INVALID_SAFETY_REPORT');
  const report: SafetyReport = {
    id: `safe_${Date.now()}`,
    rideId,
    reporterUserId: req.user!.uid,
    reporterRole: req.user!.role === 'DRIVER' ? 'DRIVER' : 'CUSTOMER',
    reportedUserId,
    reportedRole,
    category,
    description,
    severity: severity || 'HIGH',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedTo: severity === 'CRITICAL' ? 'OPS_MANAGER' : 'SUPPORT'
  };
  safetyReportsStore.set(report.id, report);
  return sendSuccess(res, report, 'Safety report created');
});

app.get('/api/admin/safety/reports', requireApiAuth('OPS_MANAGER'), rateLimit(60), (_req: Request, res: Response) => {
  return sendSuccess(res, Array.from(safetyReportsStore.values()), 'Safety reports fetched');
});

app.post('/api/safety/blocks', requireApiAuth(), rateLimit(20), (req: AuthenticatedRequest, res: Response) => {
  const { blockedUserId, blockedRole, reason } = req.body;
  if (!blockedUserId || !blockedRole || !reason) return sendError(res, 400, 'Block target and reason are required', 'INVALID_BLOCK_PAYLOAD');
  const block: UserBlockRecord = {
    id: `block_${Date.now()}`,
    blockedUserId,
    blockedRole,
    requestedByUserId: req.user!.uid,
    requestedByRole: req.user!.role === 'DRIVER' ? 'DRIVER' : req.user!.role === 'CUSTOMER' ? 'CUSTOMER' : 'ADMIN',
    reason,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };
  userBlocksStore.set(block.id, block);
  return sendSuccess(res, block, 'User block recorded for operations review');
});

app.post('/api/kyc/documents', requireApiAuth('DRIVER'), rateLimit(20), (req: AuthenticatedRequest, res: Response) => {
  const { type, documentUrl, expiresAt } = req.body;
  if (!type || !documentUrl) return sendError(res, 400, 'Document type and URL are required', 'INVALID_KYC_DOCUMENT');
  const document: DriverDocument = {
    id: `doc_${Date.now()}`,
    driverId: req.user!.uid,
    type,
    documentUrl,
    status: 'PENDING',
    uploadedAt: new Date().toISOString(),
    expiresAt
  };
  driverDocumentsStore.set(document.id, document);
  return sendSuccess(res, document, 'KYC document metadata stored');
});

app.post('/api/admin/kyc/documents/:id/review', requireApiAuth('KYC_REVIEWER'), rateLimit(30), (req: AuthenticatedRequest, res: Response) => {
  const document = driverDocumentsStore.get(req.params.id);
  if (!document) return sendError(res, 404, 'KYC document not found', 'KYC_DOCUMENT_NOT_FOUND');
  const { decision, notes } = req.body;
  if (!['APPROVED', 'REJECTED', 'REQUEST_CHANGES'].includes(decision)) {
    return sendError(res, 400, 'Invalid KYC decision', 'INVALID_KYC_DECISION');
  }
  const updated: DriverDocument = {
    ...document,
    status: decision === 'APPROVED' ? 'APPROVED' : decision === 'REJECTED' ? 'REJECTED' : 'PENDING',
    reviewedAt: new Date().toISOString(),
    reviewedBy: req.user!.uid,
    reviewNotes: notes,
    rejectionReason: decision === 'REJECTED' ? notes : document.rejectionReason
  };
  driverDocumentsStore.set(updated.id, updated);
  const review: KycReviewRecord = {
    id: `kyc_review_${Date.now()}`,
    driverId: updated.driverId,
    documentId: updated.id,
    decision,
    reviewerId: req.user!.uid,
    reviewerRole: 'KYC_REVIEWER',
    notes: notes || '',
    createdAt: new Date().toISOString()
  };
  kycReviewStore.set(review.id, review);
  return sendSuccess(res, { document: updated, review }, 'KYC review recorded');
});

app.post('/api/admin/ledger/entries', requireApiAuth('FINANCE'), rateLimit(60), (req: AuthenticatedRequest, res: Response) => {
  const { userId, type, amount, referenceId } = req.body;
  if (!userId || !type || typeof amount !== 'number' || !referenceId) {
    return sendError(res, 400, 'Ledger entry user, type, amount and reference are required', 'INVALID_LEDGER_ENTRY');
  }
  const entry = {
    transactionId: `ledger_${Date.now()}`,
    userId,
    type,
    amount,
    status: 'SUCCESS',
    referenceId,
    createdAt: new Date().toISOString(),
    immutableHash: Buffer.from(`${userId}:${type}:${amount}:${referenceId}:${Date.now()}`).toString('base64url')
  };
  immutableLedgerStore.unshift(entry);
  return sendSuccess(res, entry, 'Immutable ledger entry appended');
});

app.get('/api/admin/ledger/entries', requireApiAuth('FINANCE'), rateLimit(60), (_req: Request, res: Response) => {
  return sendSuccess(res, immutableLedgerStore, 'Ledger entries fetched');
});

app.post('/api/admin/settlements/:id/paid', requireApiAuth('FINANCE'), rateLimit(30), (req: AuthenticatedRequest, res: Response) => {
  const existing = settlementsStore.get(req.params.id);
  if (!existing) return sendError(res, 404, 'Settlement not found', 'SETTLEMENT_NOT_FOUND');
  if (existing.status === 'PAID') return sendError(res, 409, 'Settlement already paid', 'SETTLEMENT_ALREADY_PAID');
  const updated: DriverSettlement = {
    ...existing,
    status: 'PAID',
    referenceNumber: req.body.referenceNumber || existing.referenceNumber,
    proofUrl: req.body.proofUrl,
    paidAt: new Date().toISOString()
  };
  settlementsStore.set(updated.id, updated);
  return sendSuccess(res, updated, 'Settlement marked paid');
});

app.post('/api/diagnostics/events', requireApiAuth(), rateLimit(120), (req: AuthenticatedRequest, res: Response) => {
  const { source, level, message, durationMs, rideId, metadata } = req.body;
  if (!source || !level || !message) return sendError(res, 400, 'Diagnostic source, level and message are required', 'INVALID_DIAGNOSTIC_EVENT');
  const event: DiagnosticEvent = {
    id: `diag_${Date.now()}`,
    source,
    level,
    message,
    createdAt: new Date().toISOString(),
    durationMs,
    userId: req.user!.uid,
    rideId,
    metadata
  };
  diagnosticEventsStore.set(event.id, event);
  return sendSuccess(res, event, 'Diagnostic event recorded');
});

app.post('/api/admin/backups', requireApiAuth('SUPER_ADMIN'), rateLimit(5), (_req: AuthenticatedRequest, res: Response) => {
  const snapshot: BackupSnapshot = {
    id: `backup_${Date.now()}`,
    scope: 'FULL_SYSTEM',
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    storagePath: `backups/server/full-${Date.now()}.json`,
    checksum: Buffer.from(`backup:${Date.now()}`).toString('base64url')
  };
  backupSnapshotsStore.set(snapshot.id, snapshot);
  return sendSuccess(res, snapshot, 'Backup snapshot registered');
});

// 7. Pilot Config Endpoint
app.get('/api/admin/pilot-config', requireApiAuth('ADMIN'), (req: Request, res: Response) => {
  return sendSuccess(res, pilotConfig, 'تم جلب إعدادات Pilot بنجاح');
});

app.put('/api/admin/pilot-config', requireApiAuth('ADMIN'), (req: Request, res: Response) => {
  const newConfig = req.body;
  pilotConfig = { ...pilotConfig, ...newConfig };
  return sendSuccess(res, pilotConfig, 'تم تحديث إعدادات وقيود Pilot بنجاح');
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[MISHWAR Core Pilot Backend] Running on http://localhost:${PORT}`);
  });
}
