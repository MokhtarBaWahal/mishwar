import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  AppNotification,
  AuditLog,
  BackupSnapshot,
  ChatMessage,
  City,
  DiagnosticEvent,
  DriverDocument,
  DriverProfile,
  DriverSettlement,
  FareCalculation,
  FavoriteLocation,
  FeatureFlags,
  GeoPoint,
  KycReviewRecord,
  PaymentMethod,
  PaymentTransaction,
  PilotConfig,
  PlatformSettings,
  PricingRule,
  Ride,
  RideEvent,
  RideStatus,
  SafetyReport,
  SOSAlert,
  SupportTicket,
  UserBlockRecord,
  UserProfile,
  UserRole,
  VehicleCategoryConfig,
  VehicleType,
  Zone
} from '../../packages/shared_types/src';
import {
  calculateDistanceKm,
  calculateFare,
  estimateDurationMinutes,
  generateId,
  isValidStateTransition
} from '../../packages/shared_utils/src';
import {
  INITIAL_PRICING_RULES,
  INITIAL_ZONES,
  MOCK_AUDIT_LOGS,
  MOCK_CUSTOMERS,
  MOCK_DRIVERS,
  MOCK_RIDES,
  MOCK_SUPPORT_TICKETS,
  POPULAR_LOCATIONS
} from '../data/mockData';
import { mapService } from '../services/mapService';
import { googleMapsService } from '../services/googleMapsService';
import { gpsService } from '../services/gpsService';
import { firestoreService } from '../services/firebase/firestoreService';
import { notificationService } from '../services/notificationService';
import { paymentService } from '../services/paymentService';
import { ratingService } from '../services/ratingService';
import { passengerService } from '../services/passengerService';
import { driverService } from '../services/driverService';
import { dynamicPricingService } from '../services/dynamicPricingService';
import { pricingService } from '../services/pricingService';
import { authService, DEMO_ACCOUNTS, DemoAccount } from '../services/authService';
import { runUnitTests, TestResult } from '../tests/mishwar.test';
import { appConfig } from '../config/appConfig';

export const INITIAL_CITIES: City[] = [
  {
    id: 'city_sanaa',
    nameAr: 'صنعاء (العاصمة)',
    nameEn: 'Sana\'a',
    countryCode: 'YE',
    center: { latitude: 15.3694, longitude: 44.1910, addressName: 'ميدان التحرير، صنعاء' },
    isActive: true
  },
  {
    id: 'city_aden',
    nameAr: 'عدن (العاصمة الاقتصادية)',
    nameEn: 'Aden',
    countryCode: 'YE',
    center: { latitude: 12.7794, longitude: 45.0367, addressName: 'جولة كالتكس، المنصورة، عدن' },
    isActive: true
  },
  {
    id: 'city_taiz',
    nameAr: 'تعز',
    nameEn: 'Taiz',
    countryCode: 'YE',
    center: { latitude: 13.5789, longitude: 44.0178, addressName: 'جولة الحوض، تعز' },
    isActive: false
  }
];

export const INITIAL_PLATFORM_SETTINGS: PlatformSettings = {
  id: 'settings_main',
  platformNameAr: 'مشوار للنقل الذكي',
  platformNameEn: 'MISHWAR Smart Mobility',
  currency: 'YER',
  defaultCommissionRate: 0.10, // 10%
  supportPhone: '+967 1 400 000',
  supportEmail: 'support@mishwar-ye.com',
  featureFlags: {
    enableWallet: false,
    enableCard: false,
    enableDelivery: false,
    enableCorporate: false,
    enablePromo: false,
    enableSOS: true,
    enableChat: true
  },
  pilotConfig: {
    isPilotMode: true,
    maxDrivers: 10,
    maxCustomers: 100,
    isCashOnly: true,
    allowedCities: ['city_sanaa', 'city_aden']
  },
  operations: {
    maintenanceMode: false,
    maintenanceMessageAr: 'التطبيق تحت الصيانة مؤقتًا. سنعود خلال دقائق.',
    forceUpdateRequired: false,
    minimumSupportedWebVersion: '1.0.0',
    minimumSupportedPassengerVersion: '1.0.0',
    minimumSupportedDriverVersion: '1.0.0',
    dailyRideLimit: 250,
    verifiedDriversOnly: true
  },
  updatedAt: new Date().toISOString()
};

interface MishwarContextType {
  // App view & localization
  currentView: 'CUSTOMER' | 'DRIVER' | 'ADMIN' | 'SIMULATOR';
  setCurrentView: (view: 'CUSTOMER' | 'DRIVER' | 'ADMIN' | 'SIMULATOR') => void;
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;

  // Operating Mode
  appMode: 'DEMO' | 'PILOT';
  setAppMode: (mode: 'DEMO' | 'PILOT') => void;

  // Multi-City & Settings
  cities: City[];
  selectedCity: City;
  setSelectedCity: (c: City) => void;
  platformSettings: PlatformSettings;
  updatePlatformSettings: (settings: PlatformSettings) => void;

  // Data Collections
  customers: UserProfile[];
  drivers: DriverProfile[];
  rides: Ride[];
  rideEvents: RideEvent[];
  pricingRules: Record<string, PricingRule>;
  zones: Zone[];
  supportTickets: SupportTicket[];
  auditLogs: AuditLog[];
  sosAlerts: SOSAlert[];
  safetyReports: SafetyReport[];
  userBlocks: UserBlockRecord[];
  driverDocuments: DriverDocument[];
  kycReviewRecords: KycReviewRecord[];
  driverSettlements: DriverSettlement[];
  diagnosticEvents: DiagnosticEvent[];
  backupSnapshots: BackupSnapshot[];
  notifications: AppNotification[];
  unreadNotifCount: number;
  favoriteLocations: FavoriteLocation[];

  // Current Logged-in Entities
  currentCustomer: UserProfile;
  setCurrentCustomer: (c: UserProfile) => void;
  currentDriver: DriverProfile;
  setCurrentDriver: (d: DriverProfile) => void;
  demoAccounts: DemoAccount[];
  switchDemoAccount: (role: 'CUSTOMER' | 'DRIVER' | 'ADMIN', id?: string) => void;

  // Active Ride Workflow
  activeRide: Ride | null;
  activeRouteGeometry: { points: { lat: number; lng: number }[]; distanceKm: number; durationMins: number } | null;
  activeDriverPosition: { lat: number; lng: number; bearing: number } | null;
  chatMessages: ChatMessage[];

  // Incoming Request for Current Driver
  incomingRequest: Ride | null;
  incomingTimeoutSecs: number;

  // Vehicle Categories from Configuration
  vehicleCategories: VehicleCategoryConfig[];

  // Actions
  estimateRideFare: (
    pickup: GeoPoint,
    destination: GeoPoint,
    vehicleType: VehicleType,
    options?: { passengerCount?: number; airConditioningRequired?: boolean }
  ) => FareCalculation;
  getRideTimeline: (rideId: string) => RideEvent[];
  requestRide: (
    pickup: GeoPoint,
    destination: GeoPoint,
    vehicleType: VehicleType,
    options?: {
      passengerCount?: number;
      airConditioningRequired?: boolean;
      scheduledAt?: string;
      paymentMethod?: PaymentMethod;
    }
  ) => Promise<Ride>;
  acceptIncomingRide: () => void;
  declineIncomingRide: () => void;
  cancelActiveRide: (reason: string, cancelledByRole: 'CUSTOMER' | 'DRIVER' | 'ADMIN') => void;
  driverArrived: () => void;
  startTrip: () => void;
  completeTrip: () => void;
  rateRide: (stars: number, comment?: string) => void;
  sendChatMessage: (text: string, senderRole: 'CUSTOMER' | 'DRIVER') => void;
  triggerSOS: (role: 'CUSTOMER' | 'DRIVER') => void;
  resolveSOS: (alertId: string) => void;
  shareActiveRide: () => string | null;
  createSafetyReport: (params: {
    reporterRole: 'CUSTOMER' | 'DRIVER';
    category: SafetyReport['category'];
    description: string;
    severity?: SafetyReport['severity'];
  }) => void;
  blockRideUser: (targetRole: 'CUSTOMER' | 'DRIVER', reason: string) => void;
  topUpWallet: (amount: number, provider?: 'KURAIMI' | 'FLOOSAK' | 'JAIB' | 'CASH') => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addFavoriteLocation: (fav: FavoriteLocation) => void;

  // Tests & Diagnostic System
  systemTestResults: TestResult[] | null;
  isTesting: boolean;
  runSystemTestsSuite: () => Promise<TestResult[]>;

  // Real Hardware GPS & Auth Actions
  getCurrentDeviceLocation: () => Promise<{ success: boolean; location?: GeoPoint; error?: string }>;
  loginWithPhone: (phone: string, otp: string, role: UserRole, fullName?: string) => Promise<{ success: boolean; message: string }>;
  registerDriverOnboarding: (data: {
    fullName: string;
    phoneNumber: string;
    vehicleType: VehicleType;
    make: string;
    model: string;
    plateNumber: string;
    color: string;
  }) => Promise<{ success: boolean; message: string }>;

  // Driver state actions
  toggleDriverOnline: (driverId: string) => void;
  updateDriverStatus: (driverId: string, status: DriverProfile['driverStatus']) => void;

  // Admin actions
  updatePricingRule: (rule: PricingRule) => void;
  updateZone: (zone: Zone) => void;
  updateTicketStatus: (ticketId: string, status: SupportTicket['status'], adminNotes?: string) => void;
  reviewKycDocument: (documentId: string, decision: 'APPROVED' | 'REJECTED' | 'REQUEST_CHANGES', notes: string) => void;
  markSettlementPaid: (settlementId: string, referenceNumber: string, proofUrl?: string) => void;
  recordDiagnosticEvent: (event: Omit<DiagnosticEvent, 'id' | 'createdAt'>) => void;
  createBackupSnapshot: (scope: BackupSnapshot['scope']) => void;
  resetDemoData: () => void;
}

const MishwarContext = createContext<MishwarContextType | undefined>(undefined);

const STORAGE_KEY = 'mishwar:persistent-state:v1';

type PersistedMishwarState = {
  customers: UserProfile[];
  drivers: DriverProfile[];
  rides: Ride[];
  rideEvents: RideEvent[];
  pricingRules: Record<string, PricingRule>;
  zones: Zone[];
  supportTickets: SupportTicket[];
  auditLogs: AuditLog[];
  sosAlerts: SOSAlert[];
  safetyReports: SafetyReport[];
  userBlocks: UserBlockRecord[];
  driverDocuments: DriverDocument[];
  kycReviewRecords: KycReviewRecord[];
  driverSettlements: DriverSettlement[];
  diagnosticEvents: DiagnosticEvent[];
  backupSnapshots: BackupSnapshot[];
  currentCustomerId: string;
  currentDriverId: string;
  platformSettings: PlatformSettings;
  selectedCityId: string;
};

const readPersistedState = (): Partial<PersistedMishwarState> => {
  if (typeof window === 'undefined' || !appConfig.flags.allowLocalPersistence) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<PersistedMishwarState>) : {};
  } catch (error) {
    console.warn('[MISHWAR] Could not read persisted app state:', error);
    return {};
  }
};

const writePersistedState = (state: PersistedMishwarState): void => {
  if (typeof window === 'undefined' || !appConfig.flags.allowLocalPersistence) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('[MISHWAR] Could not persist app state:', error);
  }
};

export const MishwarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const persistedState = useMemo(() => readPersistedState(), []);
  const [currentView, setCurrentView] = useState<'CUSTOMER' | 'DRIVER' | 'ADMIN' | 'SIMULATOR'>('SIMULATOR');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [appMode, setAppMode] = useState<'DEMO' | 'PILOT'>(appConfig.mode === 'demo' ? 'DEMO' : 'PILOT');

  // Multi-City & Global Settings
  const [cities, setCities] = useState<City[]>(INITIAL_CITIES);
  const [selectedCity, setSelectedCity] = useState<City>(
    () => INITIAL_CITIES.find((city) => city.id === persistedState.selectedCityId) || INITIAL_CITIES[0]
  );
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(
    () => persistedState.platformSettings || INITIAL_PLATFORM_SETTINGS
  );

  // Core Collections
  const [customers, setCustomers] = useState<UserProfile[]>(() => persistedState.customers || MOCK_CUSTOMERS);
  const [drivers, setDrivers] = useState<DriverProfile[]>(() => persistedState.drivers || MOCK_DRIVERS);
  const [rides, setRides] = useState<Ride[]>(() => persistedState.rides || MOCK_RIDES);
  const [rideEvents, setRideEvents] = useState<RideEvent[]>(() => persistedState.rideEvents || []);
  const [pricingRules, setPricingRules] = useState<Record<string, PricingRule>>(
    () => persistedState.pricingRules || INITIAL_PRICING_RULES
  );
  const [zones, setZones] = useState<Zone[]>(() => persistedState.zones || INITIAL_ZONES);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(
    () => persistedState.supportTickets || MOCK_SUPPORT_TICKETS
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => persistedState.auditLogs || MOCK_AUDIT_LOGS);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>(() => persistedState.sosAlerts || []);
  const [safetyReports, setSafetyReports] = useState<SafetyReport[]>(() => persistedState.safetyReports || []);
  const [userBlocks, setUserBlocks] = useState<UserBlockRecord[]>(() => persistedState.userBlocks || []);
  const [driverDocuments, setDriverDocuments] = useState<DriverDocument[]>(() => persistedState.driverDocuments || []);
  const [kycReviewRecords, setKycReviewRecords] = useState<KycReviewRecord[]>(() => persistedState.kycReviewRecords || []);
  const [driverSettlements, setDriverSettlements] = useState<DriverSettlement[]>(() => persistedState.driverSettlements || []);
  const [diagnosticEvents, setDiagnosticEvents] = useState<DiagnosticEvent[]>(
    () =>
      persistedState.diagnosticEvents || [
        {
          id: 'diag_seed_backend_health',
          source: 'BACKEND',
          level: 'INFO',
          message: 'Health endpoint responding and pilot backend online',
          createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
          durationMs: 42
        },
        {
          id: 'diag_seed_payment_retry',
          source: 'PAYMENT',
          level: 'WARNING',
          message: 'Wallet payment fallback path exercised in demo mode',
          createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
          durationMs: 310
        }
      ]
  );
  const [backupSnapshots, setBackupSnapshots] = useState<BackupSnapshot[]>(
    () =>
      persistedState.backupSnapshots || [
        {
          id: 'backup_seed_daily_full',
          scope: 'FULL_SYSTEM',
          status: 'RESTORE_TESTED',
          createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
          completedAt: new Date(Date.now() - 24 * 3600000 + 90000).toISOString(),
          restoreTestedAt: new Date(Date.now() - 23 * 3600000).toISOString(),
          storagePath: 'backups/demo/full-system/latest.json',
          checksum: 'sha256-demo-restore-tested'
        }
      ]
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(notificationService.getUserNotifications('cust_01'));
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(notificationService.getUnreadCount('cust_01'));
  const [favoriteLocations, setFavoriteLocations] = useState<FavoriteLocation[]>(passengerService.getFavoriteLocations('cust_01'));
  const [demoAccounts] = useState<DemoAccount[]>(appConfig.flags.allowDemoAccounts ? DEMO_ACCOUNTS : []);
  const [systemTestResults, setSystemTestResults] = useState<TestResult[] | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Selected entities
  const [currentCustomer, setCurrentCustomer] = useState<UserProfile>(
    () => (persistedState.customers || MOCK_CUSTOMERS).find((c) => c.id === persistedState.currentCustomerId) || (persistedState.customers || MOCK_CUSTOMERS)[0]
  );
  const [currentDriver, setCurrentDriver] = useState<DriverProfile>(
    () => (persistedState.drivers || MOCK_DRIVERS).find((d) => d.id === persistedState.currentDriverId) || (persistedState.drivers || MOCK_DRIVERS)[0]
  );

  // Active Ride State
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [activeRouteGeometry, setActiveRouteGeometry] = useState<{ points: { lat: number; lng: number }[]; distanceKm: number; durationMins: number } | null>(null);
  const [activeDriverPosition, setActiveDriverPosition] = useState<{ lat: number; lng: number; bearing: number } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Incoming dispatch request to driver
  const [incomingRequest, setIncomingRequest] = useState<Ride | null>(null);
  const [incomingTimeoutSecs, setIncomingTimeoutSecs] = useState<number>(15);

  // Sync driver position with current driver initial location
  useEffect(() => {
    if (currentDriver.currentLocation) {
      setActiveDriverPosition({
        lat: currentDriver.currentLocation.latitude,
        lng: currentDriver.currentLocation.longitude,
        bearing: 0
      });
    }
  }, [currentDriver.id]);

  useEffect(() => {
    writePersistedState({
      customers,
      drivers,
      rides,
      rideEvents,
      pricingRules,
      zones,
      supportTickets,
      auditLogs,
      sosAlerts,
      safetyReports,
      userBlocks,
      driverDocuments,
      kycReviewRecords,
      driverSettlements,
      diagnosticEvents,
      backupSnapshots,
      currentCustomerId: currentCustomer.id,
      currentDriverId: currentDriver.id,
      platformSettings,
      selectedCityId: selectedCity.id
    });
  }, [
    customers,
    drivers,
    rides,
    rideEvents,
    pricingRules,
    zones,
    supportTickets,
    auditLogs,
    sosAlerts,
    safetyReports,
    userBlocks,
    driverDocuments,
    kycReviewRecords,
    driverSettlements,
    diagnosticEvents,
    backupSnapshots,
    currentCustomer.id,
    currentDriver.id,
    platformSettings,
    selectedCity.id
  ]);

  // Countdown timer for incoming request
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (incomingRequest && incomingTimeoutSecs > 0) {
      timer = setInterval(() => {
        setIncomingTimeoutSecs((prev) => {
          if (prev <= 1) {
            declineIncomingRide();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [incomingRequest, incomingTimeoutSecs]);

  // Smooth Driver Movement Simulation along route
  useEffect(() => {
    if (!activeRide) return;

    let animInterval: NodeJS.Timeout;
    let fraction = 0;

    if (activeRide.status === 'DRIVER_ARRIVING' && activeRide.pickup && activeDriverPosition) {
      const startPos: GeoPoint = {
        latitude: activeDriverPosition.lat,
        longitude: activeDriverPosition.lng,
        addressName: 'Driver Start'
      };
      
      animInterval = setInterval(() => {
        fraction += 0.05;
        if (fraction >= 1) {
          clearInterval(animInterval);
          driverArrived();
        } else {
          const next = mapService.interpolatePosition(startPos, activeRide.pickup, fraction);
          setActiveDriverPosition(next);
        }
      }, 700);
    } else if (activeRide.status === 'TRIP_STARTED' && activeRide.pickup && activeRide.destination) {
      animInterval = setInterval(() => {
        fraction += 0.035;
        if (fraction >= 1) {
          clearInterval(animInterval);
          completeTrip();
        } else {
          const next = mapService.interpolatePosition(activeRide.pickup, activeRide.destination, fraction);
          setActiveDriverPosition(next);
        }
      }, 700);
    }

    return () => clearInterval(animInterval);
  }, [activeRide?.status]);

  // Real Device GPS Request
  const getCurrentDeviceLocation = async (): Promise<{ success: boolean; location?: GeoPoint; error?: string }> => {
    return await gpsService.getCurrentPosition();
  };

  // Real Phone Authentication with OTP
  const loginWithPhone = async (
    phone: string,
    otp: string,
    role: UserRole,
    fullName?: string
  ): Promise<{ success: boolean; message: string }> => {
    const res = await authService.verifyOTP(phone, otp, role);
    if (res.success && res.user) {
      if (role === 'DRIVER') {
        setCurrentDriver(res.user as DriverProfile);
      } else {
        setCurrentCustomer(res.user);
      }
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message };
  };

  // Driver KYC Onboarding
  const registerDriverOnboarding = async (data: {
    fullName: string;
    phoneNumber: string;
    vehicleType: VehicleType;
    make: string;
    model: string;
    plateNumber: string;
    color: string;
  }): Promise<{ success: boolean; message: string }> => {
    // Check pilot limit
    if (platformSettings.pilotConfig.isPilotMode && drivers.length >= platformSettings.pilotConfig.maxDrivers) {
      return {
        success: false,
        message: `تم الوصول للحد الأقصى المسموح به في مرحلة الإطلاق التجريبي (${platformSettings.pilotConfig.maxDrivers} كباتن).`
      };
    }

    const newDriverId = generateId('driver');
    const newDriver: DriverProfile = {
      id: newDriverId,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      role: 'DRIVER',
      isActive: true,
      ratingAverage: 5.0,
      ratingCount: 0,
      walletBalance: 0,
      driverStatus: 'PENDING_APPROVAL',
      isAcceptingRides: false,
      todayEarnings: 0,
      todayTripsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      vehicle: {
        id: generateId('veh'),
        driverId: newDriverId,
        type: data.vehicleType,
        vehicleType: data.vehicleType,
        make: data.make,
        model: data.model,
        year: 2022,
        color: data.color,
        plateNumber: data.plateNumber,
        isVerified: false,
        capacity: data.vehicleType === 'MOTORCYCLE' ? 1 : 4,
        hasAC: data.vehicleType !== 'MOTORCYCLE',
        status: 'ACTIVE'
      },
      currentLocation: selectedCity.center
    };

    setDrivers((prev) => [newDriver, ...prev]);
    setCurrentDriver(newDriver);
    setDriverDocuments((prev) => [
      {
        id: generateId('doc'),
        driverId: newDriverId,
        type: 'NATIONAL_ID',
        documentUrl: `kyc/${newDriverId}/national-id-placeholder.jpg`,
        status: 'PENDING',
        uploadedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 86400000).toISOString()
      },
      {
        id: generateId('doc'),
        driverId: newDriverId,
        type: 'DRIVING_LICENSE',
        documentUrl: `kyc/${newDriverId}/license-placeholder.jpg`,
        status: 'PENDING',
        uploadedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 86400000).toISOString()
      },
      {
        id: generateId('doc'),
        driverId: newDriverId,
        type: 'VEHICLE_REGISTRATION',
        documentUrl: `kyc/${newDriverId}/vehicle-registration-placeholder.jpg`,
        status: 'PENDING',
        uploadedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 86400000).toISOString()
      },
      ...prev
    ]);

    // Add Audit Log
    const audit: AuditLog = {
      id: generateId('audit'),
      adminId: 'system',
      adminEmail: 'registration@mishwar.ye',
      action: `تسجيل كابتن جديد (${data.fullName}) - بانتظار اعتماد الوثائق`,
      targetType: 'DRIVER',
      targetId: newDriverId,
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [audit, ...prev]);

    return {
      success: true,
      message: 'تم استلام طلب التسجيل بنجاح! سيتم فحص الوثائق وتفعيل الحساب من قبل الإدارة.'
    };
  };

  // Live Vehicle Categories derived from Admin Pricing Rules (Requirement 3)
  const vehicleCategories = useMemo(
    () => pricingService.getVehicleCategories(pricingRules),
    [pricingRules]
  );

  const appendRideEvent = (
    ride: Ride,
    status: RideStatus,
    note: string,
    actorRole: UserRole | 'SYSTEM' = 'SYSTEM',
    metadata?: Record<string, unknown>
  ) => {
    const event: RideEvent = {
      id: generateId('evt'),
      rideId: ride.id,
      status,
      timestamp: new Date().toISOString(),
      location: activeDriverPosition
        ? { latitude: activeDriverPosition.lat, longitude: activeDriverPosition.lng, addressName: 'آخر موقع معروف' }
        : ride.pickup,
      note,
      actorRole,
      actorId:
        actorRole === 'CUSTOMER'
          ? currentCustomer.id
          : actorRole === 'DRIVER'
          ? currentDriver.id
          : undefined,
      metadata
    };
    setRideEvents((prev) => [event, ...prev]);
  };

  const getRideTimeline = (rideId: string): RideEvent[] =>
    rideEvents
      .filter((event) => event.rideId === rideId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Estimate Fare
  const estimateRideFare = (
    pickup: GeoPoint,
    destination: GeoPoint,
    vehicleType: VehicleType,
    options?: { passengerCount?: number; airConditioningRequired?: boolean }
  ): FareCalculation => {
    const dynamicPricing = dynamicPricingService.calculateContext({
      pickup,
      vehicleType,
      selectedCity,
      zones,
      rides,
      drivers
    });
    return pricingService.calculateEstimate(pickup, destination, vehicleType, dynamicPricing.multiplier, options);
  };

  // Request Ride (Customer action)
  const requestRide = async (
    pickup: GeoPoint,
    destination: GeoPoint,
    vehicleType: VehicleType,
    options?: {
      passengerCount?: number;
      airConditioningRequired?: boolean;
      scheduledAt?: string;
      paymentMethod?: PaymentMethod;
    }
  ): Promise<Ride> => {
    const passengerCount = options?.passengerCount ?? 1;
    const airConditioningRequired = !!options?.airConditioningRequired;
    const paymentMethod = options?.paymentMethod ?? 'CASH';

    const fare = estimateRideFare(pickup, destination, vehicleType, options);
    const activeMap = appMode === 'PILOT' ? googleMapsService : mapService;
    const route = await activeMap.calculateRoute(pickup, destination);
    setActiveRouteGeometry(route);

    const rideId = generateId('ride');
    const newRide: Ride = {
      id: rideId,
      rideId,
      idempotencyKey: generateId('idemp'),
      customerId: currentCustomer.id,
      passengerId: currentCustomer.id,
      customerName: currentCustomer.fullName,
      customerPhone: currentCustomer.phoneNumber,
      customerRating: currentCustomer.ratingAverage,
      customerAvatar: currentCustomer.avatarUrl,
      vehicleType,
      status: 'SEARCHING_DRIVER',
      pickup,
      destination,
      passengerCount,
      airConditioningRequired,
      scheduledAt: options?.scheduledAt,
      estimatedDistanceKm: route.distanceKm,
      distance: route.distanceKm,
      estimatedDurationMins: route.durationMins,
      estimatedDuration: route.durationMins,
      fare,
      estimatedFare: fare.grossFare,
      finalFare: fare.grossFare,
      paymentMethod,
      paymentStatus: 'PENDING',
      createdAt: new Date().toISOString()
    };

    setActiveRide(newRide);
    setRides((prev) => [newRide, ...prev]);
    setChatMessages([]);
    appendRideEvent(newRide, 'REQUESTED', 'تم إنشاء طلب المشوار', 'CUSTOMER', {
      vehicleType,
      paymentMethod,
      passengerCount,
      airConditioningRequired
    });
    appendRideEvent(newRide, 'SEARCHING_DRIVER', 'بدأ البحث عن أفضل كابتن متاح', 'SYSTEM');

    const rankedDrivers = driverService.rankAvailableDrivers(pickup, vehicleType, {
      passengerCount,
      airConditioningRequired,
      recentRides: rides
    });
    const candidateDriver = rankedDrivers[0]?.driver || null;

    if (candidateDriver) {
      driverService.lockDriverForDispatch(candidateDriver.id, newRide.id);
      appendRideEvent(newRide, 'DRIVER_ASSIGNED', `تم ترشيح ${candidateDriver.fullName} بواسطة محرك التوزيع الذكي`, 'SYSTEM', {
        dispatchScore: rankedDrivers[0].totalScore,
        etaMinutes: rankedDrivers[0].etaMinutes,
        distanceKm: rankedDrivers[0].distanceKm,
        reasons: rankedDrivers[0].reasons
      });
      setTimeout(() => {
        setCurrentDriver(candidateDriver);
        setIncomingRequest(newRide);
        setIncomingTimeoutSecs(15);
      }, 1500);
    } else {
      // Graceful handling of no matching driver found
      setTimeout(() => {
        const updated: Ride = { ...newRide, status: 'NO_DRIVER_AVAILABLE' };
        setActiveRide(updated);
        setRides((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        appendRideEvent(updated, 'NO_DRIVER_AVAILABLE', 'لم يتم العثور على كابتن مطابق للشروط الحالية', 'SYSTEM');
      }, 2000);
    }

    return newRide;
  };

  // Driver Accepts
  const acceptIncomingRide = () => {
    if (!incomingRequest) return;

    const assignedRide: Ride = {
      ...incomingRequest,
      driverId: currentDriver.id,
      driverName: currentDriver.fullName,
      driverPhone: currentDriver.phoneNumber,
      driverRating: currentDriver.ratingAverage,
      driverAvatar: currentDriver.avatarUrl,
      vehicle: currentDriver.vehicle,
      status: 'DRIVER_ARRIVING',
      assignedAt: new Date().toISOString()
    };

    setIncomingRequest(null);
    setActiveRide(assignedRide);
    setRides((prev) =>
      prev.some((r) => r.id === assignedRide.id)
        ? prev.map((r) => (r.id === assignedRide.id ? assignedRide : r))
        : [assignedRide, ...prev]
    );
    appendRideEvent(assignedRide, 'DRIVER_ARRIVING', `قبل الكابتن ${currentDriver.fullName} المشوار وهو في الطريق`, 'DRIVER');

    setDrivers((prev) =>
      prev.map((d) => (d.id === currentDriver.id ? { ...d, driverStatus: 'IN_RIDE' } : d))
    );

    // Push notification to Passenger
    notificationService.sendNotification({
      userId: assignedRide.customerId,
      title: 'تم قبول المشوار! 🚗',
      message: `الكابتن ${currentDriver.fullName} قبل طلبك وهو في الطريق إليك (${currentDriver.vehicle?.make || 'المركبة'} - لوحة ${currentDriver.vehicle?.plateNumber || ''})`,
      type: 'RIDE_UPDATE',
      rideId: assignedRide.id
    });
    setNotifications(notificationService.getUserNotifications(currentCustomer.id));
    setUnreadNotifCount(notificationService.getUnreadCount(currentCustomer.id));
  };

  // Driver Declines
  const declineIncomingRide = () => {
    if (incomingRequest) {
      appendRideEvent(incomingRequest, 'SEARCHING_DRIVER', `رفض الكابتن ${currentDriver.fullName} الطلب، جاري البحث عن بديل`, 'DRIVER');
      driverService.unlockDriver(currentDriver.id);
    }
    setIncomingRequest(null);
    if (activeRide && activeRide.status === 'SEARCHING_DRIVER') {
      const backupDriver = drivers.find(
        (d) => d.id !== currentDriver.id && d.driverStatus === 'ONLINE'
      );
      if (backupDriver) {
        setCurrentDriver(backupDriver);
        setIncomingRequest(activeRide);
        setIncomingTimeoutSecs(15);
      } else {
        const updated: Ride = { ...activeRide, status: 'NO_DRIVER_FOUND' };
        setActiveRide(updated);
        setRides((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        appendRideEvent(updated, 'NO_DRIVER_FOUND', 'انتهت محاولة الإسناد بدون كابتن بديل', 'SYSTEM');
      }
    }
  };

  // Driver Arrived
  const driverArrived = () => {
    if (!activeRide) return;
    const updated: Ride = {
      ...activeRide,
      status: 'DRIVER_ARRIVED',
      arrivedAt: new Date().toISOString()
    };
    setActiveRide(updated);
    setRides((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    appendRideEvent(updated, 'DRIVER_ARRIVED', 'وصل الكابتن إلى نقطة الالتقاط', 'DRIVER');
    firestoreService.updateRideStatus(updated.id, 'DRIVER_ARRIVED', currentDriver.id, 'DRIVER');

    // Notify Customer
    notificationService.sendNotification({
      userId: updated.customerId,
      title: 'الكابتن وصل! 📍',
      message: `الكابتن ${updated.driverName || 'الكابتن'} بانتظارك في موقع الالتقاط.`,
      type: 'RIDE_UPDATE',
      rideId: updated.id
    });
    setNotifications(notificationService.getUserNotifications(currentCustomer.id));
    setUnreadNotifCount(notificationService.getUnreadCount(currentCustomer.id));
  };

  // Start Trip
  const startTrip = () => {
    if (!activeRide) return;
    const updated: Ride = {
      ...activeRide,
      status: 'TRIP_STARTED',
      startedAt: new Date().toISOString()
    };
    setActiveRide(updated);
    setRides((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    appendRideEvent(updated, 'TRIP_STARTED', 'بدأ المشوار بعد التحقق من الراكب', 'DRIVER');
    firestoreService.updateRideStatus(updated.id, 'TRIP_STARTED', currentDriver.id, 'DRIVER');

    notificationService.sendNotification({
      userId: updated.customerId,
      title: 'بدأ المشوار! 🛣️',
      message: `المشوار متجه الآن نحو ${updated.destination.addressName}. نتمنى لك رحلة آمنة.`,
      type: 'RIDE_UPDATE',
      rideId: updated.id
    });
    setNotifications(notificationService.getUserNotifications(currentCustomer.id));
    setUnreadNotifCount(notificationService.getUnreadCount(currentCustomer.id));
  };

  // Complete Trip
  const completeTrip = () => {
    if (!activeRide) return;
    const updated: Ride = {
      ...activeRide,
      status: 'TRIP_COMPLETED',
      completedAt: new Date().toISOString(),
      paymentStatus: 'PAID',
      actualDistanceKm: activeRide.estimatedDistanceKm,
      actualDurationMins: activeRide.estimatedDurationMins
    };

    setActiveRide(updated);
    setRides((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    appendRideEvent(updated, 'TRIP_COMPLETED', 'اكتمل المشوار وتم تسجيل الدفع والمستحقات', 'DRIVER', {
      grossFare: updated.fare.grossFare,
      platformCommission: updated.fare.platformCommission,
      driverNetEarnings: updated.fare.driverNetEarnings
    });
    firestoreService.updateRideStatus(updated.id, 'TRIP_COMPLETED', currentDriver.id, 'DRIVER');

    // Record Payment
    paymentService.processRidePayment(
      updated.id,
      updated.customerId,
      updated.fare.grossFare,
      updated.paymentMethod
    );

    if (updated.driverId) {
      setDriverSettlements((prev) => [
        {
          id: generateId('settlement'),
          driverId: updated.driverId!,
          driverName: updated.driverName || 'MISHWAR Driver',
          date: new Date().toISOString().slice(0, 10),
          grossCollected: updated.fare.grossFare,
          platformCommission: updated.fare.platformCommission,
          driverNet: updated.fare.driverNetEarnings,
          cashCollected: updated.paymentMethod === 'CASH' ? updated.fare.grossFare : 0,
          walletCollected: updated.paymentMethod === 'WALLET' ? updated.fare.grossFare : 0,
          status: 'LOCKED',
          referenceNumber: `SET-${updated.id}`,
          closedAt: new Date().toISOString(),
          lockedBy: 'system',
          notes: 'Auto-locked when trip completed. Adjustments require reversal entries.'
        },
        ...prev
      ]);
    }

    // Notify Customer
    notificationService.sendNotification({
      userId: updated.customerId,
      title: 'وصلت بالسلامة! 🏁',
      message: `اكتمل المشوار. إجمالي المبلغ: ${updated.fare.grossFare.toLocaleString()} ريال يمني. شكراً لاختيارك مشوار!`,
      type: 'PAYMENT',
      rideId: updated.id
    });
    setNotifications(notificationService.getUserNotifications(currentCustomer.id));
    setUnreadNotifCount(notificationService.getUnreadCount(currentCustomer.id));

    // Accumulate driver earnings
    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id === updated.driverId) {
          return {
            ...d,
            driverStatus: 'ONLINE',
            todayEarnings: d.todayEarnings + updated.fare.driverNetEarnings,
            todayTripsCount: d.todayTripsCount + 1,
            walletBalance: d.walletBalance + updated.fare.driverNetEarnings
          };
        }
        return d;
      })
    );
  };

  // Cancel Active Ride
  const cancelActiveRide = (reason: string, cancelledByRole: 'CUSTOMER' | 'DRIVER' | 'ADMIN') => {
    if (!activeRide) return;
    const updated: Ride = {
      ...activeRide,
      status: cancelledByRole === 'CUSTOMER' ? 'CANCELLED_BY_CUSTOMER' : 'CANCELLED_BY_DRIVER',
      cancellationReason: reason,
      cancelledByRole,
      cancelledAt: new Date().toISOString()
    };
    setActiveRide(updated);
    setIncomingRequest(null);
    setRides((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    appendRideEvent(updated, updated.status, reason || 'تم إلغاء المشوار', cancelledByRole);

    if (updated.driverId) {
      driverService.unlockDriver(updated.driverId);
      setDrivers((prev) =>
        prev.map((d) => (d.id === updated.driverId ? { ...d, driverStatus: 'ONLINE' } : d))
      );
    }
  };

  // Rate Ride
  const rateRide = (stars: number, comment?: string) => {
    if (!activeRide) return;
    if (activeRide.driverId) {
      setDrivers((prev) =>
        prev.map((d) => {
          if (d.id === activeRide.driverId) {
            const newCount = d.ratingCount + 1;
            const newAvg = Math.round(((d.ratingAverage * d.ratingCount + stars) / newCount) * 100) / 100;
            return { ...d, ratingAverage: newAvg, ratingCount: newCount };
          }
          return d;
        })
      );
    }
    setActiveRide(null);
  };

  // Chat
  const sendChatMessage = (text: string, senderRole: 'CUSTOMER' | 'DRIVER') => {
    if (!activeRide || !text.trim()) return;
    const msg: ChatMessage = {
      id: generateId('msg'),
      rideId: activeRide.id,
      senderId: senderRole === 'CUSTOMER' ? currentCustomer.id : currentDriver.id,
      senderRole,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages((prev) => [...prev, msg]);
  };

  // SOS Emergency Trigger
  const triggerSOS = (role: 'CUSTOMER' | 'DRIVER') => {
    if (!activeRide) return;
    const sharedTrackingUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://mishwar.local'}/track/${activeRide.id}`;
    const alert: SOSAlert = {
      id: generateId('sos'),
      rideId: activeRide.id,
      triggeredByUserId: role === 'CUSTOMER' ? currentCustomer.id : currentDriver.id,
      triggeredByRole: role,
      location: activeDriverPosition
        ? { latitude: activeDriverPosition.lat, longitude: activeDriverPosition.lng, addressName: 'موقع الطوارئ المباشر' }
        : activeRide.pickup,
      timestamp: new Date().toISOString(),
      status: 'ACTIVE',
      severity: 'CRITICAL',
      sharedTrackingUrl,
      contactedEmergency: false
    };
    setSosAlerts((prev) => [alert, ...prev]);
    setSafetyReports((prev) => [
      {
        id: generateId('safe'),
        rideId: activeRide.id,
        reporterUserId: role === 'CUSTOMER' ? currentCustomer.id : currentDriver.id,
        reporterRole: role,
        reportedUserId: role === 'CUSTOMER' ? activeRide.driverId : activeRide.customerId,
        reportedRole: role === 'CUSTOMER' ? 'DRIVER' : 'CUSTOMER',
        category: 'SOS',
        description: `SOS triggered from ${role} during ride ${activeRide.id}`,
        severity: 'CRITICAL',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedTo: 'OPS_MANAGER'
      },
      ...prev
    ]);
    appendRideEvent(activeRide, activeRide.status, `تم إطلاق SOS من ${role === 'CUSTOMER' ? 'العميل' : 'الكابتن'}`, role, {
      sosAlertId: alert.id,
      lastKnownLocation: alert.location,
      sharedTrackingUrl
    });
    firestoreService.createSOSAlert(alert);

    // Audit Log
    const audit: AuditLog = {
      id: generateId('audit'),
      adminId: 'system',
      adminEmail: 'emergency-dispatch@mishwar.ye',
      action: `إطلاق إنذار طوارئ SOS من ${role === 'CUSTOMER' ? 'العميل' : 'الكابتن'} في المشوار ${activeRide.id}`,
      targetType: 'RIDE',
      targetId: activeRide.id,
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const resolveSOS = (alertId: string) => {
    setSosAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'RESOLVED', resolvedAt: new Date().toISOString() } : a))
    );
  };

  const shareActiveRide = (): string | null => {
    if (!activeRide) return null;
    const trackingUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://mishwar.local'}/track/${activeRide.id}`;
    appendRideEvent(activeRide, activeRide.status, 'تم إنشاء رابط مشاركة الرحلة', 'CUSTOMER', {
      trackingUrl,
      expiresAt: new Date(Date.now() + 2 * 3600000).toISOString()
    });
    notificationService.sendNotification({
      userId: currentCustomer.id,
      title: 'رابط مشاركة الرحلة جاهز',
      message: trackingUrl,
      type: 'SECURITY',
      rideId: activeRide.id
    });
    setNotifications(notificationService.getUserNotifications(currentCustomer.id));
    setUnreadNotifCount(notificationService.getUnreadCount(currentCustomer.id));
    return trackingUrl;
  };

  const createSafetyReport = (params: {
    reporterRole: 'CUSTOMER' | 'DRIVER';
    category: SafetyReport['category'];
    description: string;
    severity?: SafetyReport['severity'];
  }) => {
    const reporterUserId = params.reporterRole === 'CUSTOMER' ? currentCustomer.id : currentDriver.id;
    const report: SafetyReport = {
      id: generateId('safe'),
      rideId: activeRide?.id,
      reporterUserId,
      reporterRole: params.reporterRole,
      reportedUserId: params.reporterRole === 'CUSTOMER' ? activeRide?.driverId : activeRide?.customerId,
      reportedRole: params.reporterRole === 'CUSTOMER' ? 'DRIVER' : 'CUSTOMER',
      category: params.category,
      description: params.description,
      severity: params.severity || 'HIGH',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedTo: params.severity === 'CRITICAL' ? 'OPS_MANAGER' : 'SUPPORT'
    };
    setSafetyReports((prev) => [report, ...prev]);
    if (activeRide) {
      appendRideEvent(activeRide, activeRide.status, `تم فتح بلاغ سلامة: ${params.category}`, params.reporterRole, {
        safetyReportId: report.id,
        severity: report.severity
      });
    }
    setAuditLogs((prev) => [
      {
        id: generateId('audit'),
        adminId: 'system',
        adminEmail: 'safety@mishwar.ye',
        action: `فتح بلاغ سلامة ${params.category}`,
        targetType: activeRide ? 'RIDE' : 'SYSTEM',
        targetId: activeRide?.id || report.id,
        timestamp: new Date().toISOString(),
        details: { severity: report.severity, reporterRole: report.reporterRole }
      },
      ...prev
    ]);
  };

  const blockRideUser = (targetRole: 'CUSTOMER' | 'DRIVER', reason: string) => {
    if (!activeRide) return;
    const blockedUserId = targetRole === 'DRIVER' ? activeRide.driverId : activeRide.customerId;
    if (!blockedUserId) return;
    const requestedByRole = targetRole === 'DRIVER' ? 'CUSTOMER' : 'DRIVER';
    const requestedByUserId = requestedByRole === 'CUSTOMER' ? currentCustomer.id : currentDriver.id;
    const block: UserBlockRecord = {
      id: generateId('block'),
      blockedUserId,
      blockedRole: targetRole,
      requestedByUserId,
      requestedByRole,
      reason,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    setUserBlocks((prev) => [block, ...prev]);
    appendRideEvent(activeRide, activeRide.status, `تم حظر ${targetRole === 'DRIVER' ? 'الكابتن' : 'الراكب'} من الطرف الآخر`, requestedByRole, {
      blockId: block.id,
      reason
    });
  };

  // Driver Online / Offline
  const toggleDriverOnline = (driverId: string) => {
    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id === driverId) {
          const nextStatus: DriverProfile['driverStatus'] = d.driverStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
          const updated: DriverProfile = { ...d, driverStatus: nextStatus, isAcceptingRides: nextStatus === 'ONLINE' };
          if (currentDriver.id === driverId) setCurrentDriver(updated);
          return updated;
        }
        return d;
      })
    );
  };

  const updateDriverStatus = (driverId: string, status: DriverProfile['driverStatus']) => {
    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id === driverId) {
          const updated = { ...d, driverStatus: status, isAcceptingRides: status === 'ONLINE' };
          if (currentDriver.id === driverId) setCurrentDriver(updated);
          return updated;
        }
        return d;
      })
    );
  };

  // Admin rule update
  const updatePricingRule = (rule: PricingRule) => {
    setPricingRules((prev) => ({ ...prev, [rule.vehicleType]: rule }));
    const audit: AuditLog = {
      id: generateId('audit'),
      adminId: 'admin_sys',
      adminEmail: 'admin@mishwar.ye',
      action: `تحديث أسعار مركبات (${rule.vehicleType === 'CAR' ? 'السيارات' : 'الدراجات النارية'})`,
      targetType: 'PRICING',
      targetId: rule.id,
      timestamp: new Date().toISOString(),
      details: { baseFare: rule.baseFare, pricePerKm: rule.pricePerKm, minimumFare: rule.minimumFare }
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const updateZone = (zone: Zone) => {
    setZones((prev) => prev.map((z) => (z.id === zone.id ? zone : z)));
  };

  const updateTicketStatus = (ticketId: string, status: SupportTicket['status'], adminNotes?: string) => {
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status, adminNotes: adminNotes || t.adminNotes, updatedAt: new Date().toISOString() } : t))
    );
  };

  const reviewKycDocument = (
    documentId: string,
    decision: 'APPROVED' | 'REJECTED' | 'REQUEST_CHANGES',
    notes: string
  ) => {
    const reviewedAt = new Date().toISOString();
    const targetDoc = driverDocuments.find((doc) => doc.id === documentId);
    if (!targetDoc) return;
    const status = decision === 'APPROVED' ? 'APPROVED' : decision === 'REJECTED' ? 'REJECTED' : 'PENDING';
    setDriverDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              status,
              reviewedAt,
              reviewedBy: 'admin_kyc_reviewer',
              reviewNotes: notes,
              rejectionReason: decision === 'REJECTED' ? notes : doc.rejectionReason
            }
          : doc
      )
    );
    setKycReviewRecords((prev) => [
      {
        id: generateId('kyc_review'),
        driverId: targetDoc.driverId,
        documentId,
        decision,
        reviewerId: 'admin_kyc_reviewer',
        reviewerRole: 'KYC_REVIEWER',
        notes,
        createdAt: reviewedAt
      },
      ...prev
    ]);
    setAuditLogs((prev) => [
      {
        id: generateId('audit'),
        adminId: 'admin_kyc_reviewer',
        adminEmail: 'kyc@mishwar.ye',
        action: `KYC document ${decision}`,
        targetType: 'DRIVER',
        targetId: targetDoc.driverId,
        timestamp: reviewedAt,
        details: { documentId, notes }
      },
      ...prev
    ]);
  };

  const markSettlementPaid = (settlementId: string, referenceNumber: string, proofUrl?: string) => {
    const paidAt = new Date().toISOString();
    setDriverSettlements((prev) =>
      prev.map((settlement) =>
        settlement.id === settlementId
          ? {
              ...settlement,
              status: 'PAID',
              referenceNumber,
              proofUrl,
              paidAt
            }
          : settlement
      )
    );
    setAuditLogs((prev) => [
      {
        id: generateId('audit'),
        adminId: 'admin_finance',
        adminEmail: 'finance@mishwar.ye',
        action: 'تأكيد دفع تسوية كابتن',
        targetType: 'WALLET',
        targetId: settlementId,
        timestamp: paidAt,
        details: { referenceNumber, proofUrl }
      },
      ...prev
    ]);
  };

  const recordDiagnosticEvent = (event: Omit<DiagnosticEvent, 'id' | 'createdAt'>) => {
    setDiagnosticEvents((prev) => [
      {
        id: generateId('diag'),
        createdAt: new Date().toISOString(),
        ...event
      },
      ...prev
    ]);
  };

  const createBackupSnapshot = (scope: BackupSnapshot['scope']) => {
    const createdAt = new Date().toISOString();
    setBackupSnapshots((prev) => [
      {
        id: generateId('backup'),
        scope,
        status: 'COMPLETED',
        createdAt,
        completedAt: new Date(Date.now() + 90000).toISOString(),
        storagePath: `backups/demo/${scope.toLowerCase()}-${Date.now()}.json`,
        checksum: `sha256-${Date.now().toString(36)}`
      },
      ...prev
    ]);
    recordDiagnosticEvent({
      source: 'BACKEND',
      level: 'INFO',
      message: `Backup snapshot completed for ${scope}`,
      durationMs: 90_000
    });
  };

  const updatePlatformSettings = (settings: PlatformSettings) => {
    setPlatformSettings(settings);
    const audit: AuditLog = {
      id: generateId('audit'),
      adminId: 'admin_sys',
      adminEmail: 'admin@mishwar.ye',
      action: 'تحديث إعدادات المنصة وقيود مرحلة الـ Pilot',
      targetType: 'SYSTEM',
      targetId: settings.id,
      timestamp: new Date().toISOString()
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const topUpWallet = async (amount: number, provider: 'KURAIMI' | 'FLOOSAK' | 'JAIB' | 'CASH' = 'KURAIMI') => {
    await paymentService.topUpWallet(currentCustomer.id, amount, provider);
    const newBal = passengerService.updateWalletBalance(currentCustomer.id, amount);
    setCurrentCustomer((prev) => ({ ...prev, walletBalance: newBal }));
    setCustomers((prev) => prev.map((c) => (c.id === currentCustomer.id ? { ...c, walletBalance: newBal } : c)));
    notificationService.sendNotification({
      userId: currentCustomer.id,
      title: 'تم شحن المحفظة بنجاح 💰',
      message: `تم إضافة ${amount.toLocaleString()} ر.ي إلى محفظتك عبر ${provider}. الرصيد الحالي: ${newBal.toLocaleString()} ر.ي`,
      type: 'PAYMENT'
    });
    setNotifications(notificationService.getUserNotifications(currentCustomer.id));
    setUnreadNotifCount(notificationService.getUnreadCount(currentCustomer.id));
  };

  const markNotificationRead = (id: string) => {
    notificationService.markAsRead(id);
    setNotifications(notificationService.getUserNotifications(currentCustomer.id));
    setUnreadNotifCount(notificationService.getUnreadCount(currentCustomer.id));
  };

  const markAllNotificationsRead = () => {
    notificationService.markAllAsRead(currentCustomer.id);
    setNotifications(notificationService.getUserNotifications(currentCustomer.id));
    setUnreadNotifCount(0);
  };

  const addFavoriteLocation = (fav: FavoriteLocation) => {
    setFavoriteLocations((prev) => [fav, ...prev]);
  };

  const switchDemoAccount = (role: 'CUSTOMER' | 'DRIVER' | 'ADMIN', id?: string) => {
    if (role === 'CUSTOMER') {
      const target = customers.find((c) => (id ? c.id === id : true)) || customers[0];
      setCurrentCustomer(target);
      setCurrentView('CUSTOMER');
    } else if (role === 'DRIVER') {
      const target = drivers.find((d) => (id ? d.id === id : true)) || drivers[0];
      setCurrentDriver(target);
      setCurrentView('DRIVER');
    } else if (role === 'ADMIN') {
      setCurrentView('ADMIN');
    }
  };

  const runSystemTestsSuite = async (): Promise<TestResult[]> => {
    setIsTesting(true);
    const res = await runUnitTests();
    setSystemTestResults(res);
    setIsTesting(false);
    return res;
  };

  // Reset demo data
  const resetDemoData = () => {
    if (typeof window !== 'undefined' && appConfig.flags.allowLocalPersistence) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    paymentService.resetDemoData();
    driverService.resetDemoDrivers();
    setCustomers(MOCK_CUSTOMERS);
    setDrivers(MOCK_DRIVERS);
    setRides(MOCK_RIDES);
    setRideEvents([]);
    setPricingRules(INITIAL_PRICING_RULES);
    setZones(INITIAL_ZONES);
    setSupportTickets(MOCK_SUPPORT_TICKETS);
    setAuditLogs(MOCK_AUDIT_LOGS);
    setSosAlerts([]);
    setSafetyReports([]);
    setUserBlocks([]);
    setDriverDocuments([]);
    setKycReviewRecords([]);
    setDriverSettlements([]);
    setDiagnosticEvents([]);
    setBackupSnapshots([]);
    setActiveRide(null);
    setActiveRouteGeometry(null);
    setIncomingRequest(null);
    setChatMessages([]);
  };

  return (
    <MishwarContext.Provider
      value={{
        currentView,
        setCurrentView,
        lang,
        setLang,
        appMode,
        setAppMode,
        cities,
        selectedCity,
        setSelectedCity,
        platformSettings,
        updatePlatformSettings,
        customers,
        drivers,
        rides,
        rideEvents,
        pricingRules,
        zones,
        supportTickets,
        auditLogs,
        sosAlerts,
        safetyReports,
        userBlocks,
        driverDocuments,
        kycReviewRecords,
        driverSettlements,
        diagnosticEvents,
        backupSnapshots,
        notifications,
        unreadNotifCount,
        favoriteLocations,
        currentCustomer,
        setCurrentCustomer,
        currentDriver,
        setCurrentDriver,
        demoAccounts,
        switchDemoAccount,
        activeRide,
        activeRouteGeometry,
        activeDriverPosition,
        chatMessages,
        incomingRequest,
        incomingTimeoutSecs,
        vehicleCategories,
        estimateRideFare,
        getRideTimeline,
        requestRide,
        acceptIncomingRide,
        declineIncomingRide,
        cancelActiveRide,
        driverArrived,
        startTrip,
        completeTrip,
        rateRide,
        sendChatMessage,
        triggerSOS,
        resolveSOS,
        shareActiveRide,
        createSafetyReport,
        blockRideUser,
        topUpWallet,
        markNotificationRead,
        markAllNotificationsRead,
        addFavoriteLocation,
        systemTestResults,
        isTesting,
        runSystemTestsSuite,
        getCurrentDeviceLocation,
        loginWithPhone,
        registerDriverOnboarding,
        toggleDriverOnline,
        updateDriverStatus,
        updatePricingRule,
        updateZone,
        updateTicketStatus,
        reviewKycDocument,
        markSettlementPaid,
        recordDiagnosticEvent,
        createBackupSnapshot,
        resetDemoData
      }}
    >
      {children}
    </MishwarContext.Provider>
  );
};

export const useMishwar = (): MishwarContextType => {
  const context = useContext(MishwarContext);
  if (!context) {
    throw new Error('useMishwar must be used within a MishwarProvider');
  }
  return context;
};
