import {
  DriverProfile,
  PricingRule,
  Ride,
  SupportTicket,
  UserProfile,
  Zone,
  AuditLog
} from '../../packages/shared_types/src';

export const INITIAL_PRICING_RULES: Record<string, PricingRule> = {
  MOTORCYCLE: {
    id: 'rule_motorcycle_sanaa',
    vehicleType: 'MOTORCYCLE',
    baseFare: 500,          // 500 YER
    pricePerKm: 150,        // 150 YER / km
    pricePerMinute: 25,     // 25 YER / min
    minimumFare: 700,       // 700 YER minimum (as required)
    platformCommissionRate: 0.10, // 10% commission
    peakMultiplier: 1.0,
    currency: 'YER',
    updatedAt: new Date().toISOString()
  },
  ECONOMY: {
    id: 'rule_economy_sanaa',
    vehicleType: 'ECONOMY',
    baseFare: 1200,         // 1,200 YER
    pricePerKm: 350,        // 350 YER / km
    pricePerMinute: 45,     // 45 YER / min
    minimumFare: 1800,      // 1,800 YER minimum (as required)
    platformCommissionRate: 0.10, // 10% commission
    peakMultiplier: 1.0,
    currency: 'YER',
    updatedAt: new Date().toISOString()
  },
  COMFORT: {
    id: 'rule_comfort_sanaa',
    vehicleType: 'COMFORT',
    baseFare: 1600,         // 1,600 YER
    pricePerKm: 420,        // 420 YER / km
    pricePerMinute: 55,     // 55 YER / min
    minimumFare: 2400,      // 2,400 YER minimum
    platformCommissionRate: 0.10, // 10% commission
    peakMultiplier: 1.0,
    currency: 'YER',
    updatedAt: new Date().toISOString()
  },
  FAMILY: {
    id: 'rule_family_sanaa',
    vehicleType: 'FAMILY',
    baseFare: 2200,         // 2,200 YER
    pricePerKm: 550,        // 550 YER / km
    pricePerMinute: 70,     // 70 YER / min
    minimumFare: 3200,      // 3,200 YER minimum
    platformCommissionRate: 0.10, // 10% commission
    peakMultiplier: 1.0,
    currency: 'YER',
    updatedAt: new Date().toISOString()
  },
  CAR: {
    id: 'rule_car_sanaa',
    vehicleType: 'CAR',
    baseFare: 1200,         // 1,200 YER
    pricePerKm: 350,        // 350 YER / km
    pricePerMinute: 45,     // 45 YER / min
    minimumFare: 1800,      // 1,800 YER minimum (as required)
    platformCommissionRate: 0.10, // 10% commission
    peakMultiplier: 1.0,
    currency: 'YER',
    updatedAt: new Date().toISOString()
  }
};

export const INITIAL_ZONES: Zone[] = [
  {
    id: 'zone_sanaa_central',
    nameAr: 'صنعاء - وسط العاصمة (حدة / التحرير / الستين)',
    nameEn: "Sana'a - City Center (Hadda / Tahrir / Sixtieth)",
    city: 'صنعاء',
    center: { latitude: 15.3694, longitude: 44.1910, addressName: 'ميدان التحرير، صنعاء' },
    radiusKm: 9.5,
    isActive: true,
    surgeMultiplier: 1.0
  },
  {
    id: 'zone_sanaa_airport',
    nameAr: 'صنعاء - طريق المطار والروضة',
    nameEn: "Sana'a - Airport & Rawdah",
    city: 'صنعاء',
    center: { latitude: 15.4600, longitude: 44.2200, addressName: 'مطار صنعاء الدولي' },
    radiusKm: 12.0,
    isActive: true,
    surgeMultiplier: 1.15
  },
  {
    id: 'zone_aden_central',
    nameAr: 'عدن - كريتر وخور مكسر والمنصورة',
    nameEn: 'Aden - Crater & Khormaksar',
    city: 'عدن',
    center: { latitude: 12.7794, longitude: 45.0367, addressName: 'جولة كالتكس، المنصورة، عدن' },
    radiusKm: 14.0,
    isActive: true,
    surgeMultiplier: 1.0
  }
];

export const POPULAR_LOCATIONS = [
  { nameAr: 'شارع حدة - بريد حدة', nameEn: 'Hadda St - Post Office', lat: 15.3280, lng: 44.1950 },
  { nameAr: 'ميدان التحرير - صنعاء القديمة', nameEn: 'Tahrir Square', lat: 15.3556, lng: 44.2075 },
  { nameAr: 'شارع الستين الغربي - جولة مذبح', nameEn: 'West Sixtieth St - Mathbah', lat: 15.3780, lng: 44.1750 },
  { nameAr: 'جامعة صنعاء - البوابة الشرقية', nameEn: "Sana'a University East Gate", lat: 15.3680, lng: 44.1800 },
  { nameAr: 'جامعة العلوم والتكنولوجيا - الستين', nameEn: 'UST University - Sixtieth St', lat: 15.3720, lng: 44.1780 },
  { nameAr: 'جولة الرويشان - شارع الزبيري', nameEn: 'Ruwaishan R/A - Zubairi St', lat: 15.3400, lng: 44.2050 },
  { nameAr: 'حديقة السبعين - النصب التذكاري', nameEn: 'Sabeen Park', lat: 15.3220, lng: 44.2150 },
  { nameAr: 'شارع هايل - تقاطع بغداد', nameEn: 'Hayel St - Baghdad Cross', lat: 15.3520, lng: 44.1890 },
  { nameAr: 'فندق شيراتون - عصر', nameEn: 'Sheraton / Asr Hill', lat: 15.3700, lng: 44.2300 },
  { nameAr: 'شميلة - شارع تعز', nameEn: 'Shumaila - Taiz St', lat: 15.3150, lng: 44.2250 },
  { nameAr: 'جولة عصر - طريق الحديدة', nameEn: 'Asr R/A - Hodeidah Rd', lat: 15.3450, lng: 44.1650 }
];

// 50 Yemeni Passengers
const PASSENGER_NAMES = [
  'عادل منصور الأنسي', 'سارة عبدالسلام الصنعاني', 'فؤاد نبيل الشرجبي', 'مروة صالح باوزير',
  'عبدالكريم قاسم العماري', 'فاطمة محمد باحميد', 'هشام وضاح العدني', 'ياسمين حميد الزبيري',
  'طارق عبدربه الحميري', 'إبراهيم علوي اليافعي', 'ريم أحمد الحدا', 'مازن صادق الصعدي',
  'بلقيس محمد المقطري', 'عمار فيصل السنحاني', 'رنا نجيب القدسي', 'خالد عبدالملك الشيباني',
  'دينا مروان القحطاني', 'سامي لطف المطري', 'منى عوض العولقي', 'جمال توفيق الحكيمي',
  'أصيل نجيب المريسي', 'أروى عبدالجليل الكبسي', 'يحيى سيف المخلافي', 'هند علي الذماري',
  'بشير غانم الوادعي', 'وفاء محسن الحرازي', 'معاذ عبدالله البعداني', 'نسرين طه الجابري',
  'عصام سلطان الريمي', 'خلود خالد الأكوع', 'حمزة عبدالحكيم الحرازي', 'لمياء رضوان الدبعي',
  'زياد مطهر المؤيد', 'إيمان عثمان الشامي', 'وليد سيف المعمري', 'نجلاء هاشم المتوكل',
  'صقر عبده العريقي', 'سمية مجاهد العنسي', 'مروان سعيد الجائفي', 'غادة عبدالقادر العريقي',
  'طه يوسف البكاري', 'آلاء فضل الضالعي', 'نوفل نبيل العولقي', 'حنان عبدالله الغفاري',
  'رامي عبدالمجيد الحبيشي', 'شهد ناصر الفضلي', 'أسامة حيدر الهتار', 'عبير عبدالباقي النعمان',
  'فراس عبدالوهاب النجار', 'سحر بدر الصباري'
];

export const MOCK_CUSTOMERS: UserProfile[] = PASSENGER_NAMES.map((name, i) => {
  const idNum = String(i + 1).padStart(2, '0');
  const carrierPrefix = ['77', '73', '71', '78'][i % 4];
  const numPart = 100000 + ((i * 17923) % 899999);
  return {
    id: `cust_${idNum}`,
    fullName: name,
    phoneNumber: `+967 ${carrierPrefix} ${String(numPart).slice(0, 3)} ${String(numPart).slice(3)}`,
    avatarUrl: i % 2 === 0
      ? `https://images.unsplash.com/photo-${1534528741775 + i}?w=150&auto=format&fit=crop&q=80`
      : undefined,
    role: 'CUSTOMER',
    isActive: i !== 9, // cust_10 inactive for suspension test
    ratingAverage: Math.round((4.6 + ((i * 7) % 5) * 0.1) * 100) / 100,
    ratingCount: 5 + ((i * 9) % 50),
    walletBalance: 1500 + ((i * 850) % 25000),
    createdAt: new Date(Date.now() - (60 - i) * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  };
});

// Exactly 20 Drivers with capabilities: capacity, hasAC, status
export const MOCK_DRIVERS: DriverProfile[] = [
  // 6 Motorcycles (capacity = 1, hasAC = false)
  {
    id: 'driver_moto_01',
    fullName: 'جميل أحمد الوصابي',
    phoneNumber: '+967 774 112 334',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 4.95,
    ratingCount: 142,
    walletBalance: 24500,
    driverStatus: 'ONLINE',
    isAcceptingRides: true,
    todayEarnings: 14800,
    todayTripsCount: 9,
    currentLocation: { latitude: 15.3320, longitude: 44.1980, addressName: 'شارع حدة، أمام مركز الكميم' },
    lastLocationUpdate: new Date().toISOString(),
    createdAt: '2024-11-10T08:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_moto_01',
      driverId: 'driver_moto_01',
      type: 'MOTORCYCLE',
      make: 'Haojue',
      model: 'HJ125-8E',
      year: 2023,
      color: 'أحمر',
      plateNumber: 'صنعاء 84210/د',
      isVerified: true,
      capacity: 1,
      hasAC: false,
      status: 'ACTIVE'
    }
  },
  {
    id: 'driver_moto_02',
    fullName: 'أكرم يحيى الجعفري',
    phoneNumber: '+967 737 445 566',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 4.88,
    ratingCount: 98,
    walletBalance: 16200,
    driverStatus: 'ONLINE',
    isAcceptingRides: true,
    todayEarnings: 9500,
    todayTripsCount: 6,
    currentLocation: { latitude: 15.3500, longitude: 44.2010, addressName: 'شارع الزبيري، قرب المستشفى الجمهوري' },
    lastLocationUpdate: new Date().toISOString(),
    createdAt: '2024-12-01T09:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_moto_02',
      driverId: 'driver_moto_02',
      type: 'MOTORCYCLE',
      make: 'Dayun',
      model: 'DY150',
      year: 2022,
      color: 'أسود',
      plateNumber: 'صنعاء 71329/د',
      isVerified: true,
      capacity: 1,
      hasAC: false,
      status: 'ACTIVE'
    }
  },
  {
    id: 'driver_moto_03',
    fullName: 'بسام عصام الريمي',
    phoneNumber: '+967 713 889 900',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 4.92,
    ratingCount: 110,
    walletBalance: 31000,
    driverStatus: 'ONLINE',
    isAcceptingRides: true,
    todayEarnings: 18200,
    todayTripsCount: 11,
    currentLocation: { latitude: 15.3620, longitude: 44.1850, addressName: 'شارع الدائري الغربي، جوار الجامعة' },
    lastLocationUpdate: new Date().toISOString(),
    createdAt: '2024-10-15T08:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_moto_03',
      driverId: 'driver_moto_03',
      type: 'MOTORCYCLE',
      make: 'Sanlg',
      model: 'SL150',
      year: 2024,
      color: 'أزرق',
      plateNumber: 'صنعاء 93401/د',
      isVerified: true,
      capacity: 1,
      hasAC: false,
      status: 'ACTIVE'
    }
  },
  {
    id: 'driver_moto_04',
    fullName: 'شرف الدين هزاع المعمري',
    phoneNumber: '+967 772 334 455',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 4.75,
    ratingCount: 64,
    walletBalance: 8400,
    driverStatus: 'OFFLINE',
    isAcceptingRides: false,
    todayEarnings: 0,
    todayTripsCount: 0,
    currentLocation: { latitude: 15.3400, longitude: 44.2200, addressName: 'شارع تعز، جولة الصافية' },
    lastLocationUpdate: new Date().toISOString(),
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_moto_04',
      driverId: 'driver_moto_04',
      type: 'MOTORCYCLE',
      make: 'Haojue',
      model: 'HJ150',
      year: 2021,
      color: 'فضي',
      plateNumber: 'صنعاء 55214/د',
      isVerified: true,
      capacity: 1,
      hasAC: false,
      status: 'ACTIVE'
    }
  },
  {
    id: 'driver_moto_05',
    fullName: 'نزار عادل الهتار',
    phoneNumber: '+967 778 990 011',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 5.0,
    ratingCount: 15,
    walletBalance: 5000,
    driverStatus: 'PENDING_APPROVAL',
    isAcceptingRides: false,
    todayEarnings: 0,
    todayTripsCount: 0,
    createdAt: '2026-03-20T08:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_moto_05',
      driverId: 'driver_moto_05',
      type: 'MOTORCYCLE',
      make: 'Lifan',
      model: 'LF150',
      year: 2023,
      color: 'أبيض',
      plateNumber: 'صنعاء 48901/د',
      isVerified: false,
      capacity: 1,
      hasAC: false,
      status: 'INACTIVE'
    }
  },
  {
    id: 'driver_moto_06',
    fullName: 'صلاح نبيل العريقي',
    phoneNumber: '+967 733 112 889',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 4.86,
    ratingCount: 45,
    walletBalance: 12400,
    driverStatus: 'ONLINE',
    isAcceptingRides: true,
    todayEarnings: 7200,
    todayTripsCount: 5,
    currentLocation: { latitude: 15.3780, longitude: 44.1750, addressName: 'شارع الستين الغربي، مذبح' },
    lastLocationUpdate: new Date().toISOString(),
    createdAt: '2025-02-15T08:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_moto_06',
      driverId: 'driver_moto_06',
      type: 'MOTORCYCLE',
      make: 'Haojue',
      model: 'HJ125',
      year: 2022,
      color: 'أسود',
      plateNumber: 'صنعاء 61288/د',
      isVerified: true,
      capacity: 1,
      hasAC: false,
      status: 'ACTIVE'
    }
  },

  // 8 Economy Cars
  {
    id: 'driver_car_01',
    fullName: 'مختار عبده الحبيشي',
    phoneNumber: '+967 770 123 456',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 4.96,
    ratingCount: 185,
    walletBalance: 42000,
    driverStatus: 'ONLINE',
    isAcceptingRides: true,
    todayEarnings: 26400,
    todayTripsCount: 8,
    currentLocation: { latitude: 15.3560, longitude: 44.2050, addressName: 'ميدان التحرير، جوار البريد العام' },
    lastLocationUpdate: new Date().toISOString(),
    createdAt: '2024-09-01T08:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_car_01',
      driverId: 'driver_car_01',
      type: 'ECONOMY',
      make: 'Toyota',
      model: 'Yaris',
      year: 2020,
      color: 'فضي لامع',
      plateNumber: 'صنعاء 12948/أ',
      isVerified: true,
      capacity: 4,
      hasAC: true,
      status: 'ACTIVE'
    }
  },
  {
    id: 'driver_car_02',
    fullName: 'وليد عبدالمجيد السقاف',
    phoneNumber: '+967 734 556 778',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 4.91,
    ratingCount: 120,
    walletBalance: 28500,
    driverStatus: 'ONLINE',
    isAcceptingRides: true,
    todayEarnings: 19500,
    todayTripsCount: 6,
    currentLocation: { latitude: 15.3280, longitude: 44.1950, addressName: 'شارع حدة، جولة المدينة' },
    lastLocationUpdate: new Date().toISOString(),
    createdAt: '2024-11-20T10:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_car_02',
      driverId: 'driver_car_02',
      type: 'ECONOMY',
      make: 'Hyundai',
      model: 'Accent',
      year: 2021,
      color: 'أبيض',
      plateNumber: 'صنعاء 64120/أ',
      isVerified: true,
      capacity: 4,
      hasAC: false, // Explicitly non-AC for AC filter testing
      status: 'ACTIVE'
    }
  },
  {
    id: 'driver_car_03',
    fullName: 'رشاد أحمد البركاني',
    phoneNumber: '+967 711 778 990',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 4.84,
    ratingCount: 78,
    walletBalance: 19800,
    driverStatus: 'ONLINE',
    isAcceptingRides: true,
    todayEarnings: 15200,
    todayTripsCount: 5,
    currentLocation: { latitude: 15.3700, longitude: 44.2250, addressName: 'جولة النصر، دارس' },
    lastLocationUpdate: new Date().toISOString(),
    createdAt: '2024-12-15T09:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_car_03',
      driverId: 'driver_car_03',
      type: 'ECONOMY',
      make: 'Kia',
      model: 'Rio',
      year: 2019,
      color: 'رمادي رصاصي',
      plateNumber: 'صنعاء 43710/أ',
      isVerified: true,
      capacity: 4,
      hasAC: true,
      status: 'ACTIVE'
    }
  },
  {
    id: 'driver_car_04',
    fullName: 'ماجد سلطان الأهدل',
    phoneNumber: '+967 775 667 788',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 4.79,
    ratingCount: 52,
    walletBalance: 11500,
    driverStatus: 'OFFLINE',
    isAcceptingRides: false,
    todayEarnings: 0,
    todayTripsCount: 0,
    currentLocation: { latitude: 15.3200, longitude: 44.2100, addressName: 'ميدان السبعين' },
    lastLocationUpdate: new Date().toISOString(),
    createdAt: '2025-01-05T08:30:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_car_04',
      driverId: 'driver_car_04',
      type: 'ECONOMY',
      make: 'Toyota',
      model: 'Corolla',
      year: 2019,
      color: 'أسود ملوكي',
      plateNumber: 'صنعاء 38201/أ',
      isVerified: true,
      capacity: 4,
      hasAC: true,
      status: 'ACTIVE'
    }
  },
  {
    id: 'driver_car_05',
    fullName: 'فيصل عبدالوهاب الذاري',
    phoneNumber: '+967 735 112 299',
    role: 'DRIVER',
    isActive: false,
    ratingAverage: 3.9,
    ratingCount: 34,
    walletBalance: 4200,
    driverStatus: 'SUSPENDED',
    isAcceptingRides: false,
    todayEarnings: 0,
    todayTripsCount: 0,
    createdAt: '2024-12-10T11:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_car_05',
      driverId: 'driver_car_05',
      type: 'ECONOMY',
      make: 'Nissan',
      model: 'Sunny',
      year: 2018,
      color: 'أبيض لؤلؤي',
      plateNumber: 'صنعاء 51203/أ',
      isVerified: true,
      capacity: 4,
      hasAC: true,
      status: 'INACTIVE'
    }
  },
  {
    id: 'driver_car_06',
    fullName: 'ياسر محمد القاضي',
    phoneNumber: '+967 771 884 411',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 4.88,
    ratingCount: 65,
    walletBalance: 21300,
    driverStatus: 'ONLINE',
    isAcceptingRides: true,
    todayEarnings: 14200,
    todayTripsCount: 4,
    currentLocation: { latitude: 15.3450, longitude: 44.1800, addressName: 'شارع بغداد، جولة القدس' },
    lastLocationUpdate: new Date().toISOString(),
    createdAt: '2025-01-20T09:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_car_06',
      driverId: 'driver_car_06',
      type: 'ECONOMY',
      make: 'Toyota',
      model: 'Echo',
      year: 2018,
      color: 'أزرق كحلي',
      plateNumber: 'صنعاء 88314/أ',
      isVerified: true,
      capacity: 4,
      hasAC: true,
      status: 'ACTIVE'
    }
  },
  {
    id: 'driver_car_07',
    fullName: 'نواف عبيد الشميري',
    phoneNumber: '+967 776 221 990',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 4.93,
    ratingCount: 94,
    walletBalance: 29000,
    driverStatus: 'ONLINE',
    isAcceptingRides: true,
    todayEarnings: 18500,
    todayTripsCount: 6,
    currentLocation: { latitude: 15.3520, longitude: 44.1890, addressName: 'شارع هايل، تقاطع 16' },
    lastLocationUpdate: new Date().toISOString(),
    createdAt: '2024-12-25T10:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_car_07',
      driverId: 'driver_car_07',
      type: 'ECONOMY',
      make: 'Hyundai',
      model: 'Avante',
      year: 2020,
      color: 'فضي',
      plateNumber: 'صنعاء 75112/أ',
      isVerified: true,
      capacity: 4,
      hasAC: true,
      status: 'ACTIVE'
    }
  },
  {
    id: 'driver_car_08',
    fullName: 'بشير فاروق الصهيبي',
    phoneNumber: '+967 739 887 654',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 4.82,
    ratingCount: 38,
    walletBalance: 14800,
    driverStatus: 'OFFLINE',
    isAcceptingRides: false,
    todayEarnings: 0,
    todayTripsCount: 0,
    currentLocation: { latitude: 15.3150, longitude: 44.2250, addressName: 'شميلة، سوق شميلة المركزي' },
    lastLocationUpdate: new Date().toISOString(),
    createdAt: '2025-02-01T11:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_car_08',
      driverId: 'driver_car_08',
      type: 'ECONOMY',
      make: 'Kia',
      model: 'Cerato',
      year: 2019,
      color: 'أحمر داكن',
      plateNumber: 'صنعاء 29001/أ',
      isVerified: true,
      capacity: 4,
      hasAC: true,
      status: 'ACTIVE'
    }
  },

  // 4 Comfort Cars (capacity = 4, hasAC = true)
  {
    id: 'driver_comf_01',
    fullName: 'طارق صلاح البعداني',
    phoneNumber: '+967 777 554 433',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 4.98,
    ratingCount: 210,
    walletBalance: 58000,
    driverStatus: 'ONLINE',
    isAcceptingRides: true,
    todayEarnings: 38000,
    todayTripsCount: 7,
    currentLocation: { latitude: 15.3340, longitude: 44.2000, addressName: 'شارع حدة، جولة الرويشان' },
    lastLocationUpdate: new Date().toISOString(),
    createdAt: '2024-08-10T08:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_comf_01',
      driverId: 'driver_comf_01',
      type: 'COMFORT',
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      color: 'لؤلؤي',
      plateNumber: 'صنعاء 91044/أ',
      isVerified: true,
      capacity: 4,
      hasAC: true,
      status: 'ACTIVE'
    }
  },
  {
    id: 'driver_comf_02',
    fullName: 'عصام قاسم الهمداني',
    phoneNumber: '+967 733 990 022',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 4.94,
    ratingCount: 160,
    walletBalance: 46500,
    driverStatus: 'ONLINE',
    isAcceptingRides: true,
    todayEarnings: 29000,
    todayTripsCount: 6,
    currentLocation: { latitude: 15.3680, longitude: 44.1800, addressName: 'جامعة صنعاء، كلية الهندسة' },
    lastLocationUpdate: new Date().toISOString(),
    createdAt: '2024-09-15T09:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_comf_02',
      driverId: 'driver_comf_02',
      type: 'COMFORT',
      make: 'Hyundai',
      model: 'Sonata',
      year: 2022,
      color: 'أسود',
      plateNumber: 'صنعاء 82319/أ',
      isVerified: true,
      capacity: 4,
      hasAC: true,
      status: 'ACTIVE'
    }
  },
  {
    id: 'driver_comf_03',
    fullName: 'حميد صالح الحاوري',
    phoneNumber: '+967 714 556 611',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 4.9,
    ratingCount: 115,
    walletBalance: 34000,
    driverStatus: 'ONLINE',
    isAcceptingRides: true,
    todayEarnings: 21000,
    todayTripsCount: 4,
    currentLocation: { latitude: 15.3400, longitude: 44.2050, addressName: 'شارع الزبيري، تقاطع بغداد' },
    lastLocationUpdate: new Date().toISOString(),
    createdAt: '2024-10-20T10:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_comf_03',
      driverId: 'driver_comf_03',
      type: 'COMFORT',
      make: 'Nissan',
      model: 'Altima',
      year: 2021,
      color: 'فضي',
      plateNumber: 'صنعاء 57022/أ',
      isVerified: true,
      capacity: 4,
      hasAC: true,
      status: 'ACTIVE'
    }
  },
  {
    id: 'driver_comf_04',
    fullName: 'منير علي الصلوي',
    phoneNumber: '+967 772 881 144',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 4.87,
    ratingCount: 88,
    walletBalance: 27500,
    driverStatus: 'OFFLINE',
    isAcceptingRides: false,
    todayEarnings: 0,
    todayTripsCount: 0,
    currentLocation: { latitude: 15.3700, longitude: 44.2300, addressName: 'فندق موفنبيك / شيراتون' },
    lastLocationUpdate: new Date().toISOString(),
    createdAt: '2024-11-05T08:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_comf_04',
      driverId: 'driver_comf_04',
      type: 'COMFORT',
      make: 'Kia',
      model: 'K5',
      year: 2022,
      color: 'كحلي',
      plateNumber: 'صنعاء 39180/أ',
      isVerified: true,
      capacity: 4,
      hasAC: true,
      status: 'ACTIVE'
    }
  },

  // 2 Family XL Cars (capacity = 6, hasAC = true)
  {
    id: 'driver_fam_01',
    fullName: 'عبدالغني مطهر السياني',
    phoneNumber: '+967 775 009 988',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 4.96,
    ratingCount: 175,
    walletBalance: 64000,
    driverStatus: 'ONLINE',
    isAcceptingRides: true,
    todayEarnings: 45000,
    todayTripsCount: 5,
    currentLocation: { latitude: 15.4600, longitude: 44.2200, addressName: 'طريق مطار صنعاء الدولي' },
    lastLocationUpdate: new Date().toISOString(),
    createdAt: '2024-07-15T08:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_fam_01',
      driverId: 'driver_fam_01',
      type: 'FAMILY',
      make: 'Toyota',
      model: 'Innova (7 مقاعد)',
      year: 2023,
      color: 'أبيض عاجي',
      plateNumber: 'صنعاء 95001/أ',
      isVerified: true,
      capacity: 6,
      hasAC: true,
      status: 'ACTIVE'
    }
  },
  {
    id: 'driver_fam_02',
    fullName: 'شهاب فضل العولقي',
    phoneNumber: '+967 736 443 322',
    role: 'DRIVER',
    isActive: true,
    ratingAverage: 4.91,
    ratingCount: 92,
    walletBalance: 38000,
    driverStatus: 'ONLINE',
    isAcceptingRides: true,
    todayEarnings: 27000,
    todayTripsCount: 3,
    currentLocation: { latitude: 15.3556, longitude: 44.2075, addressName: 'ميدان التحرير، أمام بنك اليمن الدولي' },
    lastLocationUpdate: new Date().toISOString(),
    createdAt: '2024-09-10T10:00:00Z',
    updatedAt: new Date().toISOString(),
    vehicle: {
      id: 'veh_fam_02',
      driverId: 'driver_fam_02',
      type: 'FAMILY',
      make: 'Hyundai',
      model: 'H1 Van',
      year: 2021,
      color: 'فضي معدني',
      plateNumber: 'صنعاء 81400/أ',
      isVerified: true,
      capacity: 6,
      hasAC: true,
      status: 'ACTIVE'
    }
  }
];

// Helper to generate 100 realistic rides with capacity & AC
function generate100Rides(): Ride[] {
  const ridesList: Ride[] = [];
  const statuses: Ride['status'][] = [
    'TRIP_COMPLETED', 'TRIP_COMPLETED', 'TRIP_COMPLETED', 'TRIP_COMPLETED',
    'TRIP_COMPLETED', 'TRIP_COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_DRIVER'
  ];

  for (let i = 1; i <= 100; i++) {
    const rideId = `ride_2026_${String(i).padStart(3, '0')}`;
    const cust = MOCK_CUSTOMERS[(i - 1) % MOCK_CUSTOMERS.length];
    const driver = MOCK_DRIVERS[(i * 3) % MOCK_DRIVERS.length];
    const pickLoc = POPULAR_LOCATIONS[i % POPULAR_LOCATIONS.length];
    const destLoc = POPULAR_LOCATIONS[(i + 3) % POPULAR_LOCATIONS.length];
    const distKm = Math.round((2.5 + ((i * 1.37) % 8.5)) * 10) / 10;
    const durMins = Math.round(distKm * 3.2);

    const vehType = driver.vehicle?.type || 'ECONOMY';
    const rule = INITIAL_PRICING_RULES[vehType] || INITIAL_PRICING_RULES.ECONOMY;

    const distFare = Math.round(distKm * rule.pricePerKm);
    const timeFare = Math.round(durMins * rule.pricePerMinute);
    const calculatedFare = Math.round(rule.baseFare + distFare + timeFare);
    const gross = Math.max(rule.minimumFare, calculatedFare);
    const commission = Math.round(gross * rule.platformCommissionRate);
    const net = gross - commission;

    const status = i <= 5
      ? (i === 1 ? 'TRIP_COMPLETED' : i === 2 ? 'TRIP_COMPLETED' : i === 3 ? 'TRIP_COMPLETED' : i === 4 ? 'CANCELLED_BY_CUSTOMER' : 'TRIP_COMPLETED')
      : statuses[i % statuses.length];

    const isPaid = status === 'TRIP_COMPLETED';
    const payMethod = i % 3 === 0 ? 'WALLET' : 'CASH';

    const createdAt = new Date(Date.now() - (105 - i) * 3600000 * 3).toISOString();
    const maxCap = driver.vehicle?.capacity || 4;
    const passCount = Math.min(maxCap, 1 + (i % maxCap));
    const acReq = Boolean(driver.vehicle?.hasAC && i % 2 === 0);

    ridesList.push({
      id: rideId,
      rideId,
      idempotencyKey: `idemp_${rideId}`,
      customerId: cust.id,
      passengerId: cust.id,
      customerName: cust.fullName,
      customerPhone: cust.phoneNumber,
      customerRating: cust.ratingAverage,
      customerAvatar: cust.avatarUrl,
      driverId: status.startsWith('CANCELLED') && i % 2 === 0 ? undefined : driver.id,
      driverName: status.startsWith('CANCELLED') && i % 2 === 0 ? undefined : driver.fullName,
      driverPhone: status.startsWith('CANCELLED') && i % 2 === 0 ? undefined : driver.phoneNumber,
      driverRating: driver.ratingAverage,
      driverAvatar: driver.avatarUrl,
      vehicle: driver.vehicle,
      vehicleType: vehType,
      passengerCount: passCount,
      airConditioningRequired: acReq,
      status,
      pickup: { latitude: pickLoc.lat, longitude: pickLoc.lng, addressName: pickLoc.nameAr },
      destination: { latitude: destLoc.lat, longitude: destLoc.lng, addressName: destLoc.nameAr },
      estimatedDistanceKm: distKm,
      distance: distKm,
      estimatedDurationMins: durMins,
      estimatedDuration: durMins,
      actualDistanceKm: distKm + 0.1,
      actualDurationMins: durMins + 1,
      fare: {
        baseFare: rule.baseFare,
        distanceKm: distKm,
        distanceFare: distFare,
        durationMinutes: durMins,
        timeFare: timeFare,
        surgeMultiplier: 1.0,
        grossFare: gross,
        platformCommission: commission,
        driverNetEarnings: net,
        currency: 'YER'
      },
      estimatedFare: gross,
      finalFare: isPaid ? gross : undefined,
      paymentMethod: payMethod,
      paymentStatus: isPaid ? 'PAID' : (status.startsWith('CANCELLED') ? 'FAILED' : 'PENDING'),
      cancellationReason: status.startsWith('CANCELLED') ? (status === 'CANCELLED_BY_CUSTOMER' ? 'تأخر الكابتن أو تغيير الوجهة' : 'عطل فني مفاجئ بالمركبة') : undefined,
      cancelledByRole: status === 'CANCELLED_BY_CUSTOMER' ? 'CUSTOMER' : (status === 'CANCELLED_BY_DRIVER' ? 'DRIVER' : undefined),
      createdAt,
      assignedAt: new Date(new Date(createdAt).getTime() + 20000).toISOString(),
      arrivedAt: new Date(new Date(createdAt).getTime() + 180000).toISOString(),
      startedAt: new Date(new Date(createdAt).getTime() + 240000).toISOString(),
      completedAt: isPaid ? new Date(new Date(createdAt).getTime() + (durMins + 4) * 60000).toISOString() : undefined,
      cancelledAt: status.startsWith('CANCELLED') ? new Date(new Date(createdAt).getTime() + 90000).toISOString() : undefined
    });
  }

  return ridesList;
}

export const MOCK_RIDES: Ride[] = generate100Rides();

export const MOCK_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tick_01',
    userId: 'cust_01',
    userName: 'عادل منصور الأنسي',
    userRole: 'CUSTOMER',
    rideId: 'ride_2026_001',
    category: 'LOST_ITEM',
    subject: 'نسيان مظلة ومحفظة صغيرة في الدراجة',
    description: 'قمت بإنهاء المشوار ونسيت كيس صغير به مظلة، أرجو تزويدي برقم السائق للتواصل.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    createdAt: '2026-03-24T08:45:00Z',
    updatedAt: '2026-03-24T09:10:00Z',
    adminNotes: 'تم الاتصال بالسائق وأكد وجود الأغراض وسيتم تسليمها للعميل'
  },
  {
    id: 'tick_02',
    userId: 'driver_car_05',
    userName: 'فيصل عبدالوهاب الذاري',
    userRole: 'DRIVER',
    category: 'GENERAL',
    subject: 'استفسار بخصوص تعليق الحساب المؤقت',
    description: 'تم تعليق حسابي وأريد معرفة السبب وتحديث الوثائق المطلوبة.',
    status: 'OPEN',
    priority: 'HIGH',
    createdAt: '2026-03-24T11:20:00Z',
    updatedAt: '2026-03-24T11:20:00Z'
  },
  {
    id: 'tick_03',
    userId: 'cust_03',
    userName: 'فؤاد نبيل الشرجبي',
    userRole: 'CUSTOMER',
    category: 'BILLING',
    subject: 'طلب كشف حساب رحلات الأسبوع الماضي',
    description: 'أحتاج فاتورة رسمية لتقديمها للشركة لتعويض مصاريف التنقل.',
    status: 'RESOLVED',
    priority: 'LOW',
    createdAt: '2026-03-23T15:00:00Z',
    updatedAt: '2026-03-24T10:00:00Z',
    adminNotes: 'تم إرسال كشف الحساب والتقرير المالي عبر البريد الإلكتروني بنجاح'
  }
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit_01',
    actor: { id: 'admin_sys', role: 'ADMIN', emailOrPhone: 'admin@mishwar-ye.com', name: 'مدير النظام الرئيسي' },
    action: 'تعديل تعرفة الدراجات النارية',
    target: { type: 'PRICING', id: 'rule_motorcycle_sanaa' },
    timestamp: '2026-03-24T07:00:00Z',
    metadata: { oldBaseFare: 450, newBaseFare: 500, minimumFare: 700 },
    adminId: 'admin_sys',
    adminEmail: 'admin@mishwar-ye.com',
    targetType: 'PRICING',
    targetId: 'rule_motorcycle_sanaa',
    details: { oldBaseFare: 450, newBaseFare: 500 }
  },
  {
    id: 'audit_02',
    actor: { id: 'admin_sys', role: 'ADMIN', emailOrPhone: 'admin@mishwar-ye.com', name: 'مدير العمليات' },
    action: 'تعليق حساب سائق لمراجعة المخالفات',
    target: { type: 'DRIVER', id: 'driver_car_05' },
    timestamp: '2026-03-24T08:30:00Z',
    metadata: { reason: 'انخفاض التقييم المتكرر والشكاوى' },
    adminId: 'admin_sys',
    adminEmail: 'admin@mishwar-ye.com',
    targetType: 'DRIVER',
    targetId: 'driver_car_05',
    details: { reason: 'انخفاض التقييم المتكرر والشكاوى' }
  },
  {
    id: 'audit_03',
    actor: { id: 'admin_sys', role: 'ADMIN', emailOrPhone: 'admin@mishwar-ye.com', name: 'مدير التخطيط والتوسع' },
    action: 'اعتماد منطقة جغرافية جديدة (عدن المركزية)',
    target: { type: 'ZONE', id: 'zone_aden_central' },
    timestamp: '2026-03-23T14:15:00Z',
    metadata: { city: 'عدن', radiusKm: 14.0 },
    adminId: 'admin_sys',
    adminEmail: 'admin@mishwar-ye.com',
    targetType: 'ZONE',
    targetId: 'zone_aden_central',
    details: { city: 'عدن', radiusKm: 14.0 }
  },
  {
    id: 'audit_04',
    actor: { id: 'cust_01', role: 'CUSTOMER', emailOrPhone: '+967 771 234 567', name: 'عادل منصور الأنسي' },
    action: 'شحن رصيد المحفظة الإلكترونية',
    target: { type: 'WALLET', id: 'tx_topup_01' },
    timestamp: '2026-03-24T09:00:00Z',
    metadata: { provider: 'KURAIMI', amount: 15000, balanceAfter: 23500 },
    adminId: 'system',
    adminEmail: 'billing@mishwar-ye.com',
    targetType: 'WALLET',
    targetId: 'tx_topup_01'
  },
  {
    id: 'audit_05',
    actor: { id: 'cust_02', role: 'CUSTOMER', emailOrPhone: '+967 733 987 654', name: 'سارة عبدالسلام الصنعاني' },
    action: 'إنشاء طلب مشوار جديد',
    target: { type: 'RIDE', id: 'ride_2026_002' },
    timestamp: '2026-03-24T09:00:00Z',
    metadata: { vehicleType: 'CAR', grossFare: 3680, passengerCount: 4, airConditioningRequired: true },
    adminId: 'system',
    adminEmail: 'dispatch@mishwar-ye.com',
    targetType: 'RIDE',
    targetId: 'ride_2026_002'
  }
];
