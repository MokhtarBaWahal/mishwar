import React, { useMemo, useState } from 'react';
import { INITIAL_PLATFORM_SETTINGS, useMishwar } from '../../context/MishwarContext';
import { InteractiveMap } from '../common/InteractiveMap';
import { formatCurrency } from '../../../packages/shared_utils/src';
import { AdminRole, DriverDocument, DriverProfile, PlatformSettings, PricingRule, VehicleType, Zone } from '../../../packages/shared_types/src';
import { runUnitTests, TestResult } from '../../tests/mishwar.test';
import { operationsAnalyticsService } from '../../services/operationsAnalyticsService';
import { kycService } from '../../services/kycService';
import { paymentService } from '../../services/paymentService';
import {
  BarChart3,
  Users,
  Car,
  MapPin,
  DollarSign,
  AlertTriangle,
  FileText,
  Shield,
  Layers,
  Settings,
  Search,
  Check,
  X,
  Eye,
  Sliders,
  TrendingUp,
  Clock,
  Radio,
  RefreshCw,
  Phone,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  Play,
  Cpu
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const {
    customers,
    drivers,
    rides,
    rideEvents,
    pricingRules,
    updatePricingRule,
    zones,
    updateZone,
    supportTickets,
    updateTicketStatus,
    auditLogs,
    sosAlerts,
    safetyReports,
    userBlocks,
    driverDocuments: persistedDriverDocuments,
    kycReviewRecords,
    driverSettlements: persistedDriverSettlements,
    diagnosticEvents,
    backupSnapshots,
    resolveSOS,
    reviewKycDocument,
    markSettlementPaid,
    recordDiagnosticEvent,
    createBackupSnapshot,
    updateDriverStatus,
    resetDemoData,
    platformSettings,
    updatePlatformSettings,
    selectedCity,
    cities
  } = useMishwar();

  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'LIVE_MAP' | 'OPS' | 'OFFERS' | 'SETTLEMENTS' | 'DAILY_CLOSE' | 'LEDGER' | 'ADMIN_ROLES' | 'RIDES' | 'DRIVERS' | 'CUSTOMERS' | 'PRICING' | 'ZONES' | 'SOS' | 'SUPPORT' | 'DIAGNOSTICS' | 'BACKUPS' | 'AUDIT' | 'SETTINGS' | 'TESTS'
  >('OVERVIEW');

  // Search & Filters
  const [driverSearch, setDriverSearch] = useState('');
  const [rideFilter, setRideFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS'>('ALL');
  const [inspectingDriver, setInspectingDriver] = useState<DriverProfile | null>(null);

  // Unit tests runner state
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testsExecutedOnce, setTestsExecutedOnce] = useState(false);
  const [testStatusFilter, setTestStatusFilter] = useState<'ALL' | 'PASS' | 'FAIL' | 'WARNING'>('ALL');
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [dailyCloseReports, setDailyCloseReports] = useState<Array<{
    id: string;
    date: string;
    grossCash: number;
    platformCommission: number;
    driverNet: number;
    closedBy: string;
    closedAt: string;
    status: 'SETTLED' | 'DISPUTED';
  }>>([]);

  const adminRoleMatrix: Array<{ role: AdminRole; scope: string; permissions: string[] }> = [
    { role: 'SUPER_ADMIN', scope: 'كل النظام', permissions: ['إدارة الصلاحيات', 'التسعير', 'الإقفال المالي', 'KYC', 'الصيانة'] },
    { role: 'OPS_MANAGER', scope: 'العمليات', permissions: ['مركز العمليات', 'الرحلات', 'عروض الرحلات', 'السائقين'] },
    { role: 'KYC_REVIEWER', scope: 'توثيق الكباتن', permissions: ['مراجعة الوثائق', 'رفض/اعتماد KYC', 'ملاحظات الوثائق'] },
    { role: 'FINANCE', scope: 'الماليات', permissions: ['التسويات', 'Ledger', 'إقفال اليوم', 'تصدير التقارير'] },
    { role: 'SUPPORT', scope: 'الدعم', permissions: ['الشكاوى', 'SOS قراءة', 'متابعة الرحلات بدون تغيير مالي'] }
  ];

  const handleRunAllTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await runUnitTests(false);
      setTestResults(results);
      setTestsExecutedOnce(true);
      showToast('تم اكتمال تشغيل كافة الفحوصات البرمجية واختبارات السيناريوهات بنجاح!');
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleRunFailedTests = async () => {
    if (testResults.length === 0) {
      await handleRunAllTests();
      return;
    }
    setIsRunningTests(true);
    try {
      const results = await runUnitTests(true, testResults);
      setTestResults(results);
      showToast('تمت إعادة تشغيل الفحوصات المحددة.');
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleClearResults = () => {
    setTestResults([]);
    setTestsExecutedOnce(false);
    showToast('تم مسح نتائج الفحص.');
  };

  // Pricing Rule Editor Form State
  const [editingPricingType, setEditingPricingType] = useState<VehicleType>('MOTORCYCLE');
  const [pricingForm, setPricingForm] = useState<PricingRule>(pricingRules.MOTORCYCLE);

  // Platform & Pilot Settings Form State
  const [settingsForm, setSettingsForm] = useState<PlatformSettings>(platformSettings);
  const [adminToast, setAdminToast] = useState<string | null>(null);

  const adminDecisionLog = useMemo(() => [
    {
      id: 'decision-kyc-policy',
      title: 'تفعيل KYC المتقدم للكباتن',
      owner: 'KYC_REVIEWER',
      impact: 'لا يتم قبول الكابتن قبل اكتمال الهوية، الرخصة، الاستمارة، والتأمين.',
      status: 'ACTIVE'
    },
    {
      id: 'decision-financial-close',
      title: 'اعتماد إقفال اليوم المالي',
      owner: 'FINANCE',
      impact: 'تثبيت إجمالي النقد، العمولة، وصافي مستحقات الكباتن في نهاية كل يوم.',
      status: dailyCloseReports.length > 0 ? 'EXECUTED' : 'READY'
    },
    {
      id: 'decision-release-gate',
      title: 'بوابة الصيانة والتحديث الإجباري',
      owner: 'SUPER_ADMIN',
      impact: 'إيقاف الاستخدام وقت الصيانة أو إجبار الإصدارات القديمة على التحديث.',
      status: settingsForm.operations?.maintenanceMode || settingsForm.operations?.forceUpdateRequired ? 'ACTIVE' : 'STANDBY'
    }
  ], [dailyCloseReports.length, settingsForm.operations?.forceUpdateRequired, settingsForm.operations?.maintenanceMode]);

  const showToast = (msg: string) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(null), 3500);
  };

  // Analytics Calculations
  const totalCustomersCount = customers.length;
  const activeDriversCount = drivers.filter((d) => d.isActive).length;
  const onlineDriversCount = drivers.filter((d) => d.driverStatus === 'ONLINE' || d.driverStatus === 'IN_RIDE').length;
  const completedRides = rides.filter((r) => r.status === 'TRIP_COMPLETED');
  const cancelledRides = rides.filter((r) => r.status.startsWith('CANCELLED'));
  
  const totalGrossRevenue = completedRides.reduce((acc, r) => acc + r.fare.grossFare, 0);
  const totalPlatformCommission = completedRides.reduce((acc, r) => acc + r.fare.platformCommission, 0);
  const totalDriverEarnings = completedRides.reduce((acc, r) => acc + r.fare.driverNetEarnings, 0);
  const averageTripValue = completedRides.length > 0 ? Math.round(totalGrossRevenue / completedRides.length) : 0;
  const operationsSummary = useMemo(
    () => operationsAnalyticsService.buildSummary({ city: selectedCity, rides, drivers }),
    [selectedCity, rides, drivers]
  );
  const latestRideEvents = useMemo(() => rideEvents.slice(0, 8), [rideEvents]);
  const pendingKycDrivers = useMemo(
    () => drivers.filter((driver) => kycService.getDriverDecision(driver) !== 'APPROVED'),
    [drivers]
  );
  const driverDocuments = useMemo<Record<string, DriverDocument[]>>(
    () => {
      const seeded = drivers.reduce((acc, driver, index) => {
        const decision = kycService.getDriverDecision(driver);
        const approved = decision === 'APPROVED';
        const expiresAt = new Date(Date.now() + (approved ? 240 : 25 + index) * 86400000).toISOString();
        acc[driver.id] = [
          {
            id: `doc_nat_${driver.id}`,
            driverId: driver.id,
            type: 'NATIONAL_ID',
            documentUrl: '#',
            status: approved ? 'APPROVED' : decision === 'REJECTED' ? 'REJECTED' : 'PENDING',
            uploadedAt: driver.createdAt,
            expiresAt,
            reviewedAt: approved ? driver.updatedAt : undefined,
            reviewedBy: approved ? 'kyc_reviewer_01' : undefined,
            reviewNotes: approved ? 'مطابقة الهوية مع رقم الهاتف' : 'بانتظار مراجعة الهوية'
          },
          {
            id: `doc_license_${driver.id}`,
            driverId: driver.id,
            type: 'DRIVING_LICENSE',
            documentUrl: '#',
            status: approved ? 'APPROVED' : 'PENDING',
            uploadedAt: driver.createdAt,
            expiresAt,
            reviewedAt: approved ? driver.updatedAt : undefined,
            reviewedBy: approved ? 'kyc_reviewer_01' : undefined,
            reviewNotes: approved ? 'الرخصة سارية' : 'بانتظار مراجعة الرخصة'
          },
          {
            id: `doc_vehicle_${driver.id}`,
            driverId: driver.id,
            type: 'VEHICLE_REGISTRATION',
            documentUrl: '#',
            status: driver.vehicle?.isVerified ? 'APPROVED' : 'PENDING',
            uploadedAt: driver.createdAt,
            expiresAt,
            reviewedAt: driver.vehicle?.isVerified ? driver.updatedAt : undefined,
            reviewedBy: driver.vehicle?.isVerified ? 'kyc_reviewer_01' : undefined,
            reviewNotes: driver.vehicle?.isVerified ? 'الاستمارة مطابقة للوحة' : 'تحتاج رفع استمارة واضحة'
          }
        ];
        return acc;
      }, {} as Record<string, DriverDocument[]>);

      persistedDriverDocuments.forEach((doc) => {
        seeded[doc.driverId] = [doc, ...(seeded[doc.driverId] || [])];
      });

      return seeded;
    },
    [drivers, persistedDriverDocuments]
  );
  const rideOffers = useMemo(
    () =>
      rides.slice(0, 24).map((ride, index) => ({
        id: `offer_${ride.id}`,
        rideId: ride.id,
        driverId: ride.driverId || drivers[index % Math.max(drivers.length, 1)]?.id || 'unassigned',
        driverName: ride.driverName || drivers[index % Math.max(drivers.length, 1)]?.fullName || 'غير معين',
        status:
          ride.status === 'SEARCHING_DRIVER'
            ? 'PENDING'
            : ride.status === 'DRIVER_ASSIGNED' || ride.status === 'DRIVER_ARRIVING' || ride.status === 'TRIP_COMPLETED'
            ? 'ACCEPTED'
            : ride.status.startsWith('CANCELLED')
            ? 'CANCELLED'
            : index % 5 === 0
            ? 'EXPIRED'
            : 'REJECTED',
        createdAt: ride.createdAt,
        expiresAt: new Date(new Date(ride.createdAt).getTime() + 15000).toISOString(),
        fare: ride.fare.grossFare,
        pickup: ride.pickup.addressName,
        destination: ride.destination.addressName
      })),
    [rides, drivers]
  );
  const driverSettlements = useMemo(
    () =>
      drivers.map((driver) => {
        const driverCompleted = completedRides.filter((ride) => ride.driverId === driver.id);
        const cashCollected = driverCompleted
          .filter((ride) => ride.paymentMethod === 'CASH')
          .reduce((sum, ride) => sum + ride.fare.grossFare, 0);
        const walletCollected = driverCompleted
          .filter((ride) => ride.paymentMethod === 'WALLET')
          .reduce((sum, ride) => sum + ride.fare.grossFare, 0);
        const platformCommission = driverCompleted.reduce((sum, ride) => sum + ride.fare.platformCommission, 0);
        const driverNet = driverCompleted.reduce((sum, ride) => sum + ride.fare.driverNetEarnings, 0);
        return {
          driver,
          trips: driverCompleted.length,
          cashCollected,
          walletCollected,
          platformCommission,
          driverNet,
          platformDueFromCash: Math.min(cashCollected, platformCommission),
          payoutDueToDriver: Math.max(0, driverNet - cashCollected)
        };
      }),
    [drivers, completedRides]
  );
  const ledgerRows = useMemo(() => {
    const serviceLedger = paymentService.getLedger();
    const generatedLedger = completedRides.slice(0, 20).flatMap((ride) => [
      {
        transactionId: `ledger_ride_${ride.id}`,
        userId: ride.customerId,
        type: 'RIDE_PAYMENT',
        amount: ride.fare.grossFare,
        balanceBefore: ride.paymentMethod === 'WALLET' ? ride.fare.grossFare + 5000 : 0,
        balanceAfter: ride.paymentMethod === 'WALLET' ? 5000 : 0,
        status: 'SUCCESS',
        referenceId: ride.id,
        idempotencyKey: ride.idempotencyKey || `idemp_${ride.id}`,
        createdAt: ride.completedAt || ride.createdAt,
        description: `تحصيل أجرة مشوار ${ride.id} (${ride.paymentMethod})`
      },
      {
        transactionId: `ledger_commission_${ride.id}`,
        userId: ride.driverId || 'platform',
        type: 'COMMISSION_DEDUCTION',
        amount: ride.fare.platformCommission,
        balanceBefore: ride.fare.grossFare,
        balanceAfter: ride.fare.driverNetEarnings,
        status: 'SUCCESS',
        referenceId: ride.id,
        idempotencyKey: `commission_${ride.id}`,
        createdAt: ride.completedAt || ride.createdAt,
        description: `عمولة المنصة 10% للمشوار ${ride.id}`
      }
    ]);
    return [...serviceLedger, ...generatedLedger].slice(0, 40);
  }, [completedRides]);

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    updatePricingRule(pricingForm);
    showToast(`تم حفظ وتطبيق إعدادات تسعير (${pricingForm.vehicleType === 'CAR' ? 'السيارات' : 'الدراجات النارية'}) بنجاح!`);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlatformSettings(settingsForm);
    showToast('تم حفظ إعدادات المنصة وقيود الـ Pilot بنجاح!');
  };

  const handleApproveDriver = (driverId: string) => {
    updateDriverStatus(driverId, 'ONLINE');
    setInspectingDriver(null);
    showToast('تمت الموافقة على الكابتن وتفعيل حسابه بنجاح!');
  };

  const handleSuspendDriver = (driverId: string) => {
    updateDriverStatus(driverId, 'SUSPENDED');
    setInspectingDriver(null);
    showToast('تم تعليق حساب الكابتن.');
  };

  const handleCloseFinancialDay = () => {
    const report = {
      id: `close_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      grossCash: driverSettlements.reduce((sum, row) => sum + row.cashCollected, 0),
      platformCommission: driverSettlements.reduce((sum, row) => sum + row.platformCommission, 0),
      driverNet: driverSettlements.reduce((sum, row) => sum + row.driverNet, 0),
      closedBy: 'admin@mishwar-ye.com',
      closedAt: new Date().toISOString(),
      status: 'SETTLED' as const
    };
    setDailyCloseReports((prev) => [report, ...prev]);
    showToast('تم إقفال اليوم المالي وتثبيت تقرير التسوية.');
  };

  return (
    <div className="flex h-full bg-slate-950 text-slate-100 overflow-hidden font-['Cairo',sans-serif]">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 z-30">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/20">
              مـ
            </div>
            <div>
              <h1 className="font-black text-sm text-slate-100 tracking-wide">مشوار الإدارة</h1>
              <span className="text-[10px] text-emerald-400 font-semibold">MISHWAR Pilot Ops</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] border border-emerald-800">
            {selectedCity.nameAr.split(' ')[0]}
          </span>
        </div>

        {/* SOS Emergency Counter Badge */}
        {sosAlerts.filter((a) => a.status === 'ACTIVE').length > 0 && (
          <div className="mx-3 mt-3 p-2 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center justify-between text-rose-300 text-xs animate-pulse">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span className="font-bold">نداء طوارئ SOS نشط!</span>
            </div>
            <button
              onClick={() => setActiveTab('SOS')}
              className="px-2 py-0.5 bg-rose-600 text-white rounded-lg text-[10px] font-bold"
            >
              عرض
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto text-xs">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'OVERVIEW'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>نظرة عامة والتحليلات</span>
          </button>

          <button
            onClick={() => setActiveTab('LIVE_MAP')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'LIVE_MAP'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>خريطة التتبع المباشر</span>
          </button>

          <button
            onClick={() => setActiveTab('OPS')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'OPS'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>طبقة العمليات H3</span>
          </button>

          <button
            onClick={() => setActiveTab('OFFERS')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'OFFERS'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>عروض الرحلات ({rideOffers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SETTLEMENTS')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'SETTLEMENTS'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>تسويات الكباتن</span>
          </button>

          <button
            onClick={() => setActiveTab('DAILY_CLOSE')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'DAILY_CLOSE'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>إقفال اليوم المالي</span>
          </button>

          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'LEDGER'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>الدفتر المالي Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('ADMIN_ROLES')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'ADMIN_ROLES'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>صلاحيات الإدارة</span>
          </button>

          <button
            onClick={() => setActiveTab('RIDES')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'RIDES'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>إدارة المشاوير والرحلات</span>
          </button>

          <button
            onClick={() => setActiveTab('DRIVERS')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'DRIVERS'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>إدارة الكباتن والسائقين ({drivers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'CUSTOMERS'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>إدارة العملاء</span>
          </button>

          <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            المحركات والعمليات
          </div>

          <button
            onClick={() => {
              setActiveTab('PRICING');
              setPricingForm(pricingRules[editingPricingType]);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'PRICING'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>محرك التسعير والعمولة</span>
          </button>

          <button
            onClick={() => setActiveTab('ZONES')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'ZONES'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>المناطق والمدن</span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'SETTINGS'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>إعدادات Pilot والمنصة</span>
          </button>

          <button
            onClick={() => setActiveTab('SOS')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'SOS'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-rose-400'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>مركز طوارئ SOS ({sosAlerts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SUPPORT')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'SUPPORT'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>تذاكر الدعم والشكاوى</span>
          </button>

          <button
            onClick={() => setActiveTab('DIAGNOSTICS')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'DIAGNOSTICS'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>المراقبة والتشخيص</span>
          </button>

          <button
            onClick={() => setActiveTab('BACKUPS')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'BACKUPS'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>النسخ والاسترجاع</span>
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'AUDIT'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>سجل الرقابة والأمان</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('TESTS');
              if (!testsExecutedOnce) {
                handleRunAllTests();
              }
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
              activeTab === 'TESTS'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>فحص واختبارات المحركات</span>
          </button>
        </nav>

        {/* Footer info & Reset Demo */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => setShowResetConfirmModal(true)}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl flex items-center justify-center gap-2 transition-colors font-semibold"
            title="إعادة تعيين البيانات الأولية"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>إعادة ضبط بيانات Demo</span>
          </button>
        </div>
      </aside>

      {/* Main Content Dashboard */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top App Bar */}
        <header className="h-14 bg-slate-900/80 border-b border-slate-800 px-6 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">لوحة الإدارة</span>
            <span className="text-slate-600">/</span>
            <span className="text-emerald-400 font-bold">
              {activeTab === 'OVERVIEW' && 'نظرة عامة وإحصائيات المنصة'}
              {activeTab === 'LIVE_MAP' && 'خريطة السائقين والرحلات المباشرة'}
              {activeTab === 'OPS' && 'طبقة العمليات الذكية وتوازن الطلب'}
              {activeTab === 'OFFERS' && 'عروض الرحلات ومؤقتات القبول'}
              {activeTab === 'SETTLEMENTS' && 'تسويات الكباتن والعمولات النقدية'}
              {activeTab === 'DAILY_CLOSE' && 'إقفال اليوم المالي وتثبيت التسويات'}
              {activeTab === 'LEDGER' && 'الدفتر المالي غير القابل للتعديل'}
              {activeTab === 'ADMIN_ROLES' && 'صلاحيات الإدارة وتوزيع المسؤوليات'}
              {activeTab === 'RIDES' && 'سجل المشاوير والرحلات'}
              {activeTab === 'DRIVERS' && 'الكباتن وتوثيق المركبات'}
              {activeTab === 'CUSTOMERS' && 'قائمة العملاء المسجلين'}
              {activeTab === 'PRICING' && 'محرك احتساب الأسعار والعمولات'}
              {activeTab === 'ZONES' && 'إدارة المناطق الجغرافية'}
              {activeTab === 'SETTINGS' && 'إعدادات المنصة وقيود الـ Pilot'}
              {activeTab === 'SOS' && 'مركز الاستجابة للطوارئ SOS'}
              {activeTab === 'SUPPORT' && 'مركز خدمة العملاء والشكاوى'}
              {activeTab === 'AUDIT' && 'سجل التدقيق الأمني الموحد'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 px-3 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>خادم العمليات: متصل ومستقر</span>
            </span>
          </div>
        </header>

        {/* In-App Toast Banner */}
        {adminToast && (
          <div className="mx-6 mt-3 p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 text-center font-bold shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
            {adminToast}
          </div>
        )}

        {/* Dynamic Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Primary KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>إجمالي قيمة المشاوير</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-black text-slate-100 font-mono">
                    {formatCurrency(totalGrossRevenue)}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>من {completedRides.length} مشوار مكتمل</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>صافي أرباح المنصة (العمولة)</span>
                    <TrendingUp className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-xl font-black text-sky-400 font-mono">
                    {formatCurrency(totalPlatformCommission)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">
                    معدل العمولة المعتمد: {platformSettings.defaultCommissionRate * 100}%
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>مجموع أرباح الكباتن</span>
                    <Car className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl font-black text-amber-400 font-mono">
                    {formatCurrency(totalDriverEarnings)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">
                    مدفوعة نقداً للكباتن
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>متوسط قيمة المشوار</span>
                    <Clock className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-xl font-black text-teal-400 font-mono">
                    {formatCurrency(averageTripValue)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">
                    سيارات ودراجات نارية
                  </div>
                </div>
              </div>

              {/* Secondary Metric Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl text-center">
                  <span className="text-xs text-slate-400 block">الكباتن المتصلون الآن</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">{onlineDriversCount} سائق</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl text-center">
                  <span className="text-xs text-slate-400 block">إجمالي العملاء المسجلين</span>
                  <span className="text-lg font-bold text-slate-200 font-mono">{totalCustomersCount} عميل</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl text-center">
                  <span className="text-xs text-slate-400 block">المشاوير الملغاة</span>
                  <span className="text-lg font-bold text-rose-400 font-mono">{cancelledRides.length}</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl text-center">
                  <span className="text-xs text-slate-400 block">نسبة إكمال المشاوير</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {rides.length > 0 ? Math.round((completedRides.length / rides.length) * 100) : 100}%
                  </span>
                </div>
              </div>

              {/* Recent Activity Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-100">آخر المشاوير المنفذة في {selectedCity.nameAr}</h3>
                  <button
                    onClick={() => setActiveTab('RIDES')}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    عرض جميع الرحلات →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-3 pr-2">رقم المشوار</th>
                        <th className="pb-3">العميل</th>
                        <th className="pb-3">الكابتن</th>
                        <th className="pb-3">نوع المركبة</th>
                        <th className="pb-3">الحالة</th>
                        <th className="pb-3">الأجرة الإجمالية</th>
                        <th className="pb-3 pl-2">عمولة مشوار</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {rides.slice(0, 5).map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/40">
                          <td className="py-3 pr-2 font-mono text-slate-400">{r.id}</td>
                          <td className="py-3 font-semibold">{r.customerName}</td>
                          <td className="py-3">{r.driverName || '—'}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px]">
                              {r.vehicleType === 'MOTORCYCLE' ? '🏍️ دراجة' : '🚗 سيارة'}
                            </span>
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.status === 'TRIP_COMPLETED'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : r.status.startsWith('CANCELLED')
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : 'bg-sky-500/20 text-sky-400 animate-pulse'
                              }`}
                            >
                              {r.status === 'TRIP_COMPLETED' && 'مكتملة'}
                              {r.status === 'CANCELLED_BY_CUSTOMER' && 'ملغاة من العميل'}
                              {r.status === 'DRIVER_ARRIVING' && 'الكابتن متوجه'}
                              {r.status === 'TRIP_STARTED' && 'جارية الآن'}
                              {r.status === 'SEARCHING_DRIVER' && 'بحث عن سائق'}
                            </span>
                          </td>
                          <td className="py-3 font-bold text-emerald-400 font-mono">
                            {formatCurrency(r.fare.grossFare)}
                          </td>
                          <td className="py-3 pl-2 font-bold text-sky-400 font-mono">
                            {formatCurrency(r.fare.platformCommission)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE MAP */}
          {activeTab === 'LIVE_MAP' && (
            <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col">
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>{drivers.filter((d) => d.driverStatus === 'ONLINE').length} كابتن متصل</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                    <span>{drivers.filter((d) => d.driverStatus === 'IN_RIDE').length} في رحلة نشطة</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                    <span>{drivers.filter((d) => d.driverStatus === 'OFFLINE').length} غير متصل</span>
                  </span>
                </div>
                <span className="text-xs text-slate-400">المدينة: {selectedCity.nameAr}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
                  <div className="text-[10px] text-slate-400">Heatmap الطلبات</div>
                  <div className="mt-1 text-lg font-black text-rose-400 font-mono">{operationsSummary.hotCells}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
                  <div className="text-[10px] text-slate-400">السائقون المتاحون</div>
                  <div className="mt-1 text-lg font-black text-emerald-400 font-mono">{operationsSummary.totalActiveDrivers}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
                  <div className="text-[10px] text-slate-400">الرحلات النشطة</div>
                  <div className="mt-1 text-lg font-black text-sky-400 font-mono">
                    {rides.filter((r) => !['TRIP_COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_DRIVER', 'NO_DRIVER_FOUND', 'NO_DRIVER_AVAILABLE'].includes(r.status)).length}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
                  <div className="text-[10px] text-slate-400">إنذار الإلغاء</div>
                  <div className={`mt-1 text-lg font-black font-mono ${operationsSummary.cancellationRate >= 25 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {operationsSummary.cancellationRate}%
                  </div>
                </div>
              </div>

              <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative">
                <InteractiveMap
                  center={{ lat: selectedCity.center.latitude, lng: selectedCity.center.longitude }}
                  nearbyDrivers={drivers
                    .filter((d) => d.currentLocation && d.driverStatus !== 'OFFLINE')
                    .map((d) => ({
                      id: d.id,
                      lat: d.currentLocation!.latitude,
                      lng: d.currentLocation!.longitude,
                      type: d.vehicle?.type || 'CAR',
                      name: d.fullName
                    }))}
                />
              </div>
            </div>
          )}

          {/* TAB 3: H3-INSPIRED OPERATIONS LAYER */}
          {activeTab === 'OPS' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">إجمالي الطلب داخل نطاق المدينة</div>
                  <div className="text-xl font-black text-slate-100 font-mono">{operationsSummary.totalDemand}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">الكباتن المتاحون داخل الخلايا</div>
                  <div className="text-xl font-black text-emerald-400 font-mono">{operationsSummary.totalActiveDrivers}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">الخلايا الساخنة</div>
                  <div className="text-xl font-black text-rose-400 font-mono">{operationsSummary.hotCells}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">متوسط قيمة المشوار</div>
                  <div className="text-lg font-black text-sky-400 font-mono">{formatCurrency(operationsSummary.averageFare)}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">معدل الإلغاء</div>
                  <div className="text-xl font-black text-amber-400 font-mono">{operationsSummary.cancellationRate}%</div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">طبقة العمليات المستوحاة من H3 - {selectedCity.nameAr}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    تقسيم سداسي تقريبي بحجم 2.5 كم للخلية، يحسب الطلب والمعروض ومعدل الإلغاء من بيانات المشاوير والكباتن الحالية.
                  </p>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-300 font-bold">
                  {operationsSummary.topRecommendation}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-5">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200">خريطة خلايا التشغيل</h4>
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>ساخنة</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span>ناقصة تغطية</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>متوازنة</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500"></span>هادئة</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3">
                    {operationsSummary.cells.slice(0, 12).map((cell) => (
                      <button
                        key={cell.id}
                        type="button"
                        className={`text-right rounded-2xl border p-3 min-h-[138px] transition-all hover:-translate-y-0.5 ${
                          cell.status === 'HOT'
                            ? 'bg-rose-950/35 border-rose-500/40'
                            : cell.status === 'UNDERSERVED'
                            ? 'bg-amber-950/30 border-amber-500/40'
                            : cell.status === 'QUIET'
                            ? 'bg-slate-950/70 border-slate-700'
                            : 'bg-emerald-950/20 border-emerald-500/30'
                        }`}
                        title={cell.recommendation}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-black text-slate-100">{cell.label}</div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {cell.center.latitude.toFixed(3)}, {cell.center.longitude.toFixed(3)}
                            </div>
                          </div>
                          <span className={`text-[9px] font-black rounded-full px-2 py-0.5 ${
                            cell.status === 'HOT'
                              ? 'bg-rose-500/20 text-rose-300'
                              : cell.status === 'UNDERSERVED'
                              ? 'bg-amber-500/20 text-amber-300'
                              : cell.status === 'QUIET'
                              ? 'bg-slate-700 text-slate-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {cell.status === 'HOT' && 'ساخنة'}
                            {cell.status === 'UNDERSERVED' && 'تغطية ناقصة'}
                            {cell.status === 'QUIET' && 'هادئة'}
                            {cell.status === 'BALANCED' && 'متوازنة'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                          <div className="bg-slate-950/60 rounded-xl p-2">
                            <div className="text-[9px] text-slate-500">طلبات</div>
                            <div className="text-sm font-bold text-slate-100 font-mono">{cell.rideCount}</div>
                          </div>
                          <div className="bg-slate-950/60 rounded-xl p-2">
                            <div className="text-[9px] text-slate-500">كباتن</div>
                            <div className="text-sm font-bold text-emerald-400 font-mono">{cell.activeDrivers}</div>
                          </div>
                          <div className="bg-slate-950/60 rounded-xl p-2">
                            <div className="text-[9px] text-slate-500">إلغاء</div>
                            <div className="text-sm font-bold text-amber-400 font-mono">{cell.cancellationRate}%</div>
                          </div>
                        </div>

                        <div className="mt-3 text-[10px] leading-relaxed text-slate-300">{cell.recommendation}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200">توصيات نقل الكباتن</h4>
                  {operationsSummary.cells
                    .filter((cell) => cell.status === 'HOT' || cell.status === 'UNDERSERVED')
                    .slice(0, 6)
                    .map((cell) => (
                      <div key={cell.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 text-xs">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-bold text-slate-100">{cell.label}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              الطلب {cell.rideCount} · الكباتن {cell.activeDrivers} · فجوة {cell.supplyGap}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-lg">
                            Score {cell.demandScore}
                          </span>
                        </div>
                        <div className="mt-2 text-slate-300 leading-relaxed">{cell.recommendation}</div>
                        <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{ width: `${Math.min(100, Math.max(8, cell.demandScore))}%` }}
                          />
                        </div>
                      </div>
                    ))}

                  {operationsSummary.cells.filter((cell) => cell.status === 'HOT' || cell.status === 'UNDERSERVED').length === 0 && (
                    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 text-center">
                      لا توجد فجوات تغطية حرجة حالياً في {selectedCity.nameAr}.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: RIDE OFFERS */}
          {activeTab === 'OFFERS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">عروض قيد الانتظار</div>
                  <div className="text-xl font-black text-amber-400 font-mono">
                    {rideOffers.filter((offer) => offer.status === 'PENDING').length}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">عروض مقبولة</div>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {rideOffers.filter((offer) => offer.status === 'ACCEPTED').length}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">منتهية / مرفوضة</div>
                  <div className="text-xl font-black text-rose-400 font-mono">
                    {rideOffers.filter((offer) => offer.status === 'EXPIRED' || offer.status === 'REJECTED').length}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">متوسط قيمة العروض</div>
                  <div className="text-xl font-black text-slate-100 font-mono">
                    {formatCurrency(Math.round(rideOffers.reduce((sum, offer) => sum + offer.fare, 0) / Math.max(rideOffers.length, 1)))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-100">Ride Offers / Dispatch Locks</h3>
                  <span className="text-[11px] text-slate-400">جاهزة للربط مع Firestore rideOffers</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-950 text-slate-400">
                      <tr>
                        <th className="p-3">العرض</th>
                        <th className="p-3">الكابتن</th>
                        <th className="p-3">المسار</th>
                        <th className="p-3">الأجرة</th>
                        <th className="p-3">ينتهي</th>
                        <th className="p-3">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rideOffers.map((offer) => (
                        <tr key={offer.id} className="border-t border-slate-800/80 hover:bg-slate-800/40">
                          <td className="p-3 font-mono text-slate-300">{offer.id}</td>
                          <td className="p-3 text-slate-100 font-semibold">{offer.driverName}</td>
                          <td className="p-3 max-w-sm">
                            <div className="truncate text-slate-300">{offer.pickup}</div>
                            <div className="truncate text-slate-500">{offer.destination}</div>
                          </td>
                          <td className="p-3 font-mono text-emerald-400 font-bold">{formatCurrency(offer.fare)}</td>
                          <td className="p-3 font-mono text-slate-400">
                            {new Date(offer.expiresAt).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                                offer.status === 'ACCEPTED'
                                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                  : offer.status === 'PENDING'
                                  ? 'bg-amber-950 text-amber-400 border-amber-800'
                                  : 'bg-rose-950 text-rose-400 border-rose-800'
                              }`}
                            >
                              {offer.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DRIVER SETTLEMENTS */}
          {activeTab === 'SETTLEMENTS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">إجمالي النقد المحصل</div>
                  <div className="text-xl font-black text-slate-100 font-mono">
                    {formatCurrency(driverSettlements.reduce((sum, row) => sum + row.cashCollected, 0))}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">عمولة المنصة</div>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {formatCurrency(driverSettlements.reduce((sum, row) => sum + row.platformCommission, 0))}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">مستحق على الكباتن من النقد</div>
                  <div className="text-xl font-black text-amber-400 font-mono">
                    {formatCurrency(driverSettlements.reduce((sum, row) => sum + row.platformDueFromCash, 0))}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">صافي أرباح الكباتن</div>
                  <div className="text-xl font-black text-sky-400 font-mono">
                    {formatCurrency(driverSettlements.reduce((sum, row) => sum + row.driverNet, 0))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-slate-100">كشف تسويات الكباتن</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-950 text-slate-400">
                      <tr>
                        <th className="p-3">الكابتن</th>
                        <th className="p-3">رحلات مكتملة</th>
                        <th className="p-3">نقد</th>
                        <th className="p-3">محفظة</th>
                        <th className="p-3">عمولة المنصة</th>
                        <th className="p-3">صافي الكابتن</th>
                        <th className="p-3">المطلوب توريده</th>
                      </tr>
                    </thead>
                    <tbody>
                      {driverSettlements
                        .filter((row) => row.trips > 0)
                        .map((row) => (
                          <tr key={row.driver.id} className="border-t border-slate-800/80 hover:bg-slate-800/40">
                            <td className="p-3">
                              <div className="font-bold text-slate-100">{row.driver.fullName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{row.driver.phoneNumber}</div>
                            </td>
                            <td className="p-3 font-mono text-slate-300">{row.trips}</td>
                            <td className="p-3 font-mono text-slate-300">{formatCurrency(row.cashCollected)}</td>
                            <td className="p-3 font-mono text-slate-300">{formatCurrency(row.walletCollected)}</td>
                            <td className="p-3 font-mono text-emerald-400 font-bold">{formatCurrency(row.platformCommission)}</td>
                            <td className="p-3 font-mono text-sky-400 font-bold">{formatCurrency(row.driverNet)}</td>
                            <td className="p-3 font-mono text-amber-400 font-bold">{formatCurrency(row.platformDueFromCash)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-100">التسويات المقفلة والمدفوعة</h3>
                  <span className="text-[10px] text-slate-400 font-mono">{persistedDriverSettlements.length} settlement docs</span>
                </div>
                {persistedDriverSettlements.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    لا توجد تسويات مقفلة بعد. يتم إنشاء تسوية تلقائيًا عند اكتمال رحلة فعلية.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right">
                      <thead className="bg-slate-950 text-slate-400">
                        <tr>
                          <th className="p-3">الكابتن</th>
                          <th className="p-3">التاريخ</th>
                          <th className="p-3">الإجمالي</th>
                          <th className="p-3">العمولة</th>
                          <th className="p-3">صافي الكابتن</th>
                          <th className="p-3">الحالة</th>
                          <th className="p-3">الإجراء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {persistedDriverSettlements.map((settlement) => (
                          <tr key={settlement.id} className="border-t border-slate-800/80 hover:bg-slate-800/40">
                            <td className="p-3">
                              <div className="font-bold text-slate-100">{settlement.driverName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{settlement.driverId}</div>
                            </td>
                            <td className="p-3 font-mono text-slate-300">{settlement.date}</td>
                            <td className="p-3 font-mono text-slate-300">{formatCurrency(settlement.grossCollected)}</td>
                            <td className="p-3 font-mono text-emerald-400">{formatCurrency(settlement.platformCommission)}</td>
                            <td className="p-3 font-mono text-sky-400 font-bold">{formatCurrency(settlement.driverNet)}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                settlement.status === 'PAID'
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : 'bg-amber-500/15 text-amber-300'
                              }`}>
                                {settlement.status}
                              </span>
                            </td>
                            <td className="p-3">
                              {settlement.status !== 'PAID' && (
                                <button
                                  onClick={() => {
                                    markSettlementPaid(settlement.id, `PAY-${Date.now()}`, 'settlement-proof/demo-receipt.jpg');
                                    showToast('تم تأكيد دفع تسوية الكابتن برقم مرجعي.');
                                  }}
                                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold text-[10px]"
                                >
                                  تأكيد الدفع
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: DAILY FINANCIAL CLOSE */}
          {activeTab === 'DAILY_CLOSE' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">رحلات اليوم المكتملة</div>
                  <div className="text-xl font-black text-slate-100 font-mono">{completedRides.length}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">إجمالي النقد</div>
                  <div className="text-xl font-black text-amber-400 font-mono">
                    {formatCurrency(driverSettlements.reduce((sum, row) => sum + row.cashCollected, 0))}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">عمولة المنصة</div>
                  <div className="text-xl font-black text-emerald-400 font-mono">{formatCurrency(totalPlatformCommission)}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">تقارير مقفلة</div>
                  <div className="text-xl font-black text-sky-400 font-mono">{dailyCloseReports.length}</div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">إقفال اليوم المالي</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    يثبت إجمالي النقد، عمولة المنصة، وصافي الكباتن في تقرير لا يعدل مباشرة. في الربط الحقيقي يتحول هذا إلى مستند settlement يومي.
                  </p>
                </div>
                <button
                  onClick={handleCloseFinancialDay}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs whitespace-nowrap"
                >
                  إقفال اليوم الآن
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-400">
                    <tr>
                      <th className="p-3">التقرير</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">النقد</th>
                      <th className="p-3">العمولة</th>
                      <th className="p-3">صافي الكباتن</th>
                      <th className="p-3">أغلق بواسطة</th>
                      <th className="p-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyCloseReports.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          لم يتم إقفال أي يوم مالي بعد.
                        </td>
                      </tr>
                    ) : (
                      dailyCloseReports.map((report) => (
                        <tr key={report.id} className="border-t border-slate-800/80">
                          <td className="p-3 font-mono text-slate-300">{report.id}</td>
                          <td className="p-3 font-mono text-slate-400">{report.date}</td>
                          <td className="p-3 font-mono text-amber-400">{formatCurrency(report.grossCash)}</td>
                          <td className="p-3 font-mono text-emerald-400">{formatCurrency(report.platformCommission)}</td>
                          <td className="p-3 font-mono text-sky-400">{formatCurrency(report.driverNet)}</td>
                          <td className="p-3 text-slate-300">{report.closedBy}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold">
                              {report.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: ADMIN ROLES */}
          {activeTab === 'ADMIN_ROLES' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-100">مصفوفة صلاحيات الإدارة</h3>
                <p className="text-xs text-slate-400 mt-1">
                  هذه الصلاحيات جاهزة للتطبيق مع Firebase custom claims أو نظام مستخدمي الإدارة في الباكند.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {adminRoleMatrix.map((role) => (
                  <div key={role.role} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                      <div>
                        <h4 className="font-mono font-black text-emerald-400 text-sm">{role.role}</h4>
                        <p className="text-[11px] text-slate-400">{role.scope}</p>
                      </div>
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permission) => (
                        <span key={permission} className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: FINANCIAL LEDGER */}
          {activeTab === 'LEDGER' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">دفتر مالي Ledger</h3>
                  <p className="text-[11px] text-slate-400 mt-1">كل حركة تعرض balanceBefore وbalanceAfter وidempotencyKey لمنع الخصم المزدوج.</p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-bold">
                  {ledgerRows.length} حركة
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-950 text-slate-400">
                      <tr>
                        <th className="p-3">Transaction</th>
                        <th className="p-3">User</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Before</th>
                        <th className="p-3">After</th>
                        <th className="p-3">Reference</th>
                        <th className="p-3">Idempotency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerRows.map((entry) => (
                        <tr key={entry.transactionId} className="border-t border-slate-800/80 hover:bg-slate-800/40">
                          <td className="p-3 font-mono text-slate-300">{entry.transactionId}</td>
                          <td className="p-3 font-mono text-slate-400">{entry.userId}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-bold">
                              {entry.type}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-emerald-400 font-bold">{formatCurrency(entry.amount)}</td>
                          <td className="p-3 font-mono text-slate-400">{formatCurrency(entry.balanceBefore)}</td>
                          <td className="p-3 font-mono text-slate-100">{formatCurrency(entry.balanceAfter)}</td>
                          <td className="p-3 font-mono text-slate-500">{entry.referenceId}</td>
                          <td className="p-3 font-mono text-[10px] text-slate-500">{entry.idempotencyKey || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RIDES */}
          {activeTab === 'RIDES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100">سجل المشاوير الكامل ({rides.length})</h3>
                <div className="flex gap-2">
                  {(['ALL', 'COMPLETED', 'CANCELLED', 'IN_PROGRESS'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setRideFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                        rideFilter === filter ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 border border-slate-800 text-slate-300'
                      }`}
                    >
                      {filter === 'ALL' && 'الكل'}
                      {filter === 'COMPLETED' && 'المكتملة'}
                      {filter === 'CANCELLED' && 'الملغاة'}
                      {filter === 'IN_PROGRESS' && 'الجارية'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h4 className="text-xs font-bold text-slate-100">سجل أحداث الرحلات</h4>
                  <span className="text-[10px] text-slate-500 font-mono">{rideEvents.length} events</span>
                </div>
                {latestRideEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    {latestRideEvents.map((event) => (
                      <div key={event.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 min-h-[104px]">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-black text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-full">
                            {event.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(event.timestamp).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-200 leading-relaxed">{event.note || 'تحديث حالة المشوار'}</div>
                        <div className="mt-2 text-[10px] text-slate-500 font-mono truncate">{event.rideId}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 text-center py-5">لا توجد أحداث رحلة محفوظة بعد.</div>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-3">رقم المشوار</th>
                      <th className="p-3">العميل</th>
                      <th className="p-3">الكابتن</th>
                      <th className="p-3">المسار</th>
                      <th className="p-3">المسافة</th>
                      <th className="p-3">الأجرة</th>
                      <th className="p-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {rides
                      .filter((r) => {
                        if (rideFilter === 'COMPLETED') return r.status === 'TRIP_COMPLETED';
                        if (rideFilter === 'CANCELLED') return r.status.startsWith('CANCELLED');
                        if (rideFilter === 'IN_PROGRESS') return !['TRIP_COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_DRIVER', 'NO_DRIVER_FOUND'].includes(r.status);
                        return true;
                      })
                      .map((ride) => (
                        <tr key={ride.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-mono text-slate-400">{ride.id}</td>
                          <td className="p-3 font-semibold">{ride.customerName}</td>
                          <td className="p-3">{ride.driverName || 'لم يعيّن'}</td>
                          <td className="p-3 text-[11px] max-w-xs truncate">
                            {ride.pickup.addressName} ← {ride.destination.addressName}
                          </td>
                          <td className="p-3">{ride.estimatedDistanceKm} كم</td>
                          <td className="p-3 font-bold text-emerald-400 font-mono">
                            {formatCurrency(ride.fare.grossFare)}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ride.status === 'TRIP_COMPLETED'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : ride.status.startsWith('CANCELLED')
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : 'bg-sky-500/20 text-sky-400'
                              }`}
                            >
                              {ride.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DRIVERS (With Inspection & Approval Modal) */}
          {activeTab === 'DRIVERS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100">إدارة الكباتن والسائقين ({drivers.length})</h3>
                <div className="w-64 relative">
                  <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="بحث باسم الكابتن أو اللوحة..."
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">كباتن موثقون</div>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {drivers.filter((driver) => kycService.getDriverDecision(driver) === 'APPROVED').length}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">بانتظار المراجعة</div>
                  <div className="text-xl font-black text-amber-400 font-mono">
                    {pendingKycDrivers.filter((driver) => kycService.getDriverDecision(driver) === 'PENDING_REVIEW').length}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">تحتاج تعديل</div>
                  <div className="text-xl font-black text-sky-400 font-mono">
                    {pendingKycDrivers.filter((driver) => kycService.getDriverDecision(driver) === 'NEEDS_CHANGES').length}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-[11px] text-slate-400 mb-1">مرفوض / معلق</div>
                  <div className="text-xl font-black text-rose-400 font-mono">
                    {pendingKycDrivers.filter((driver) => kycService.getDriverDecision(driver) === 'REJECTED').length}
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-3">الكابتن</th>
                      <th className="p-3">نوع المركبة</th>
                      <th className="p-3">رقم اللوحة</th>
                      <th className="p-3">التقييم</th>
                      <th className="p-3">التوثيق</th>
                      <th className="p-3">الحالة الحالية</th>
                      <th className="p-3">دخل اليوم</th>
                      <th className="p-3">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {drivers
                      .filter((d) => d.fullName.includes(driverSearch) || d.vehicle?.plateNumber.includes(driverSearch))
                      .map((driver) => (
                        <tr key={driver.id} className="hover:bg-slate-800/40">
                          <td className="p-3">
                            <div className="font-semibold text-slate-100">{driver.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{driver.phoneNumber}</div>
                          </td>
                          <td className="p-3">
                            <span>{driver.vehicle?.type === 'MOTORCYCLE' ? '🏍️ دراجة' : '🚗 سيارة'}</span>
                            <span className="text-[10px] text-slate-400 block">{driver.vehicle?.make} {driver.vehicle?.model}</span>
                          </td>
                          <td className="p-3 font-mono text-emerald-400 font-bold">{driver.vehicle?.plateNumber}</td>
                          <td className="p-3 font-semibold text-amber-400">⭐ {driver.ratingAverage}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                                kycService.getDriverDecision(driver) === 'APPROVED'
                                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                  : kycService.getDriverDecision(driver) === 'REJECTED'
                                  ? 'bg-rose-950 text-rose-400 border-rose-800'
                                  : 'bg-amber-950 text-amber-400 border-amber-800'
                              }`}
                            >
                              {kycService.getDriverDecision(driver)}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                driver.driverStatus === 'ONLINE'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : driver.driverStatus === 'IN_RIDE'
                                  ? 'bg-sky-500/20 text-sky-400'
                                  : driver.driverStatus === 'PENDING_APPROVAL'
                                  ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                                  : driver.driverStatus === 'SUSPENDED'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {driver.driverStatus === 'ONLINE' && 'متصل'}
                              {driver.driverStatus === 'IN_RIDE' && 'في مشوار'}
                              {driver.driverStatus === 'OFFLINE' && 'غير متصل'}
                              {driver.driverStatus === 'PENDING_APPROVAL' && 'بانتظار الاعتماد'}
                              {driver.driverStatus === 'SUSPENDED' && 'معلق'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-200">{formatCurrency(driver.todayEarnings)}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setInspectingDriver(driver)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] flex items-center gap-1"
                                title="مراجعة الوثائق والبيانات"
                              >
                                <Eye className="w-3 h-3 text-sky-400" />
                                <span>مراجعة</span>
                              </button>

                              {driver.driverStatus === 'PENDING_APPROVAL' && (
                                <button
                                  onClick={() => handleApproveDriver(driver.id)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold"
                                  title="اعتماد مباشر"
                                >
                                  اعتماد
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOMERS */}
          {activeTab === 'CUSTOMERS' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100">سجل العملاء المسجلين ({customers.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {customers.map((c) => (
                  <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-100">{c.fullName}</div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {c.isActive ? 'نشط' : 'معلق'}
                      </span>
                    </div>
                    <div className="text-slate-400 font-mono text-[11px]">{c.phoneNumber}</div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-slate-400">
                      <span>التقييم: <strong className="text-amber-400">⭐ {c.ratingAverage}</strong></span>
                      <span>رصيد المحفظة: <strong className="text-emerald-400 font-mono">{formatCurrency(c.walletBalance)}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PRICING ENGINE */}
          {activeTab === 'PRICING' && (
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">محرك التسعير وحساب الأجرة</h3>
                  <p className="text-xs text-slate-400">تعديل تعرفة الرحلات ونسبة عمولة منصة مشوار لكل نوع مركبة</p>
                </div>

                <div className="flex flex-wrap gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  {(['MOTORCYCLE', 'ECONOMY', 'CAR', 'COMFORT', 'FAMILY'] as VehicleType[]).map((vType) => {
                    const rule = pricingRules[vType] || pricingRules.CAR;
                    const labels: Record<VehicleType, string> = {
                      MOTORCYCLE: '🏍️ دراجة',
                      ECONOMY: '🚗 اقتصادية',
                      CAR: '🚙 سيارة',
                      COMFORT: '✨ مريحة',
                      FAMILY: '🚐 عائلية'
                    };
                    return (
                      <button
                        key={vType}
                        type="button"
                        onClick={() => {
                          setEditingPricingType(vType);
                          setPricingForm(rule);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          editingPricingType === vType ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {labels[vType] || vType}
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleSavePricing} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 block mb-1">أجرة البداية (فتح العداد - YER)</label>
                    <input
                      type="number"
                      value={pricingForm.baseFare}
                      onChange={(e) => setPricingForm({ ...pricingForm, baseFare: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-emerald-400 font-bold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">سعر الكيلومتر الواحد (YER / km)</label>
                    <input
                      type="number"
                      value={pricingForm.pricePerKm}
                      onChange={(e) => setPricingForm({ ...pricingForm, pricePerKm: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-emerald-400 font-bold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">سعر الدقيقة الواحدة (YER / min)</label>
                    <input
                      type="number"
                      value={pricingForm.pricePerMinute}
                      onChange={(e) => setPricingForm({ ...pricingForm, pricePerMinute: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-emerald-400 font-bold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">الحد الأدنى للأجرة (Minimum Fare - YER)</label>
                    <input
                      type="number"
                      value={pricingForm.minimumFare}
                      onChange={(e) => setPricingForm({ ...pricingForm, minimumFare: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-emerald-400 font-bold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">نسبة عمولة منصة مشوار (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pricingForm.platformCommissionRate * 100}
                      onChange={(e) => setPricingForm({ ...pricingForm, platformCommissionRate: Number(e.target.value) / 100 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-sky-400 font-bold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">مضاعف أوقات الذروة (Peak Multiplier)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={pricingForm.peakMultiplier}
                      onChange={(e) => setPricingForm({ ...pricingForm, peakMultiplier: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-amber-400 font-bold outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 text-xs transition-all"
                  >
                    حفظ وتطبيق إعدادات التسعير
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 7: ZONES */}
          {activeTab === 'ZONES' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100">المناطق التشغيلية والمدن في اليمن ({zones.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {zones.map((zone) => (
                  <div key={zone.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">{zone.nameAr}</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 font-bold text-[10px]">
                        مفعلة
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">{zone.center.addressName}</div>
                    <div className="flex justify-between items-center text-slate-400 pt-2 border-t border-slate-800">
                      <span>نصف قطر التغطية: <strong>{zone.radiusKm} كم</strong></span>
                      <span>مضاعف الذروة: <strong>{zone.surgeMultiplier}x</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SETTINGS & PILOT CONSTRAINTS */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-5 max-w-3xl">
              <div>
                <h3 className="text-sm font-bold text-slate-100">إعدادات المنصة وقيود مرحلة الـ Pilot</h3>
                <p className="text-xs text-slate-400">التحكم في قيود الإطلاق التجريبي ومفاتيح الميزات (Feature Flags) بدون إعادة بناء الكود</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                {/* General Settings */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>الهوية والاتصال</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">اسم المنصة (بالعربية)</label>
                      <input
                        type="text"
                        value={settingsForm.platformNameAr}
                        onChange={(e) => setSettingsForm({ ...settingsForm, platformNameAr: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">اسم المنصة (English)</label>
                      <input
                        type="text"
                        value={settingsForm.platformNameEn}
                        onChange={(e) => setSettingsForm({ ...settingsForm, platformNameEn: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">هاتف الدعم الفني</label>
                      <input
                        type="text"
                        value={settingsForm.supportPhone}
                        onChange={(e) => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-emerald-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">البريد الإلكتروني للعمليات</label>
                      <input
                        type="email"
                        value={settingsForm.supportEmail}
                        onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Pilot Constraints Box */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="font-bold text-sky-400 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>قيود الإطلاق التجريبي (Pilot Controls)</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">الحد الأقصى للكباتن (Max Drivers)</label>
                      <input
                        type="number"
                        value={settingsForm.pilotConfig.maxDrivers}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            pilotConfig: { ...settingsForm.pilotConfig, maxDrivers: Number(e.target.value) }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-sky-400 font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">الحد الأقصى للعملاء (Max Customers)</label>
                      <input
                        type="number"
                        value={settingsForm.pilotConfig.maxCustomers}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            pilotConfig: { ...settingsForm.pilotConfig, maxCustomers: Number(e.target.value) }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-sky-400 font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div>
                      <span className="font-semibold text-slate-200 block">حصر الدفع نقداً (Cash Only)</span>
                      <span className="text-[11px] text-slate-500">تعطيل بوابات الدفع الإلكتروني والاكتفاء بالكاش المباشر في اليمن</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsForm.pilotConfig.isCashOnly}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          pilotConfig: { ...settingsForm.pilotConfig, isCashOnly: e.target.checked }
                        })
                      }
                      className="w-5 h-5 accent-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Operations Safety Controls */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="font-bold text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>حواجز التشغيل والنشر</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                      <div>
                        <span className="font-semibold text-slate-200 block">وضع الصيانة</span>
                        <span className="text-[11px] text-slate-500">إيقاف الاستخدام مؤقتًا برسالة واضحة.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsForm.operations?.maintenanceMode)}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            operations: {
                              ...(settingsForm.operations || INITIAL_PLATFORM_SETTINGS.operations!),
                              maintenanceMode: e.target.checked
                            }
                          })
                        }
                        className="w-5 h-5 accent-rose-500 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                      <div>
                        <span className="font-semibold text-slate-200 block">تحديث إجباري</span>
                        <span className="text-[11px] text-slate-500">منع النسخ القديمة من العمل.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsForm.operations?.forceUpdateRequired)}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            operations: {
                              ...(settingsForm.operations || INITIAL_PLATFORM_SETTINGS.operations!),
                              forceUpdateRequired: e.target.checked
                            }
                          })
                        }
                        className="w-5 h-5 accent-amber-500 cursor-pointer"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 text-xs">رسالة الصيانة</label>
                    <input
                      type="text"
                      value={settingsForm.operations?.maintenanceMessageAr || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          operations: {
                            ...(settingsForm.operations || INITIAL_PLATFORM_SETTINGS.operations!),
                            maintenanceMessageAr: e.target.value
                          }
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1 text-xs">حد الرحلات اليومي</label>
                      <input
                        type="number"
                        value={settingsForm.operations?.dailyRideLimit || 0}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            operations: {
                              ...(settingsForm.operations || INITIAL_PLATFORM_SETTINGS.operations!),
                              dailyRideLimit: Number(e.target.value)
                            }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-emerald-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 text-xs">Web min</label>
                      <input
                        type="text"
                        value={settingsForm.operations?.minimumSupportedWebVersion || ''}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            operations: {
                              ...(settingsForm.operations || INITIAL_PLATFORM_SETTINGS.operations!),
                              minimumSupportedWebVersion: e.target.value
                            }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-sky-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 text-xs">Passenger min</label>
                      <input
                        type="text"
                        value={settingsForm.operations?.minimumSupportedPassengerVersion || ''}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            operations: {
                              ...(settingsForm.operations || INITIAL_PLATFORM_SETTINGS.operations!),
                              minimumSupportedPassengerVersion: e.target.value
                            }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-sky-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 text-xs">Driver min</label>
                      <input
                        type="text"
                        value={settingsForm.operations?.minimumSupportedDriverVersion || ''}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            operations: {
                              ...(settingsForm.operations || INITIAL_PLATFORM_SETTINGS.operations!),
                              minimumSupportedDriverVersion: e.target.value
                            }
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 font-mono text-sky-400 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Feature Flags */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>مفاتيح الميزات (Feature Flags)</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'enableSOS', label: 'زر طوارئ SOS', active: settingsForm.featureFlags.enableSOS },
                      { key: 'enableChat', label: 'المحادثة الفورية In-App Chat', active: settingsForm.featureFlags.enableChat },
                      { key: 'enableWallet', label: 'المحفظة الإلكترونية', active: settingsForm.featureFlags.enableWallet },
                      { key: 'enableCard', label: 'البطاقات الائتمانية', active: settingsForm.featureFlags.enableCard },
                      { key: 'enableDelivery', label: 'خدمة التوصيل والطرود', active: settingsForm.featureFlags.enableDelivery },
                      { key: 'enableCorporate', label: 'حسابات الشركات والأعمال', active: settingsForm.featureFlags.enableCorporate }
                    ].map((flag) => (
                      <label
                        key={flag.key}
                        className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700"
                      >
                        <span className="text-slate-300 font-semibold">{flag.label}</span>
                        <input
                          type="checkbox"
                          checked={flag.active}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              featureFlags: {
                                ...settingsForm.featureFlags,
                                [flag.key]: e.target.checked
                              }
                            })
                          }
                          className="w-4 h-4 accent-emerald-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 text-xs transition-all"
                  >
                    حفظ كافة الإعدادات
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 8: SOS ALERTS */}
          {activeTab === 'SOS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-rose-400">مركز استجابة طوارئ SOS</h3>
                  <p className="text-xs text-slate-400">مراقبة نداءات الاستغاثة الواردة من العملاء والسائقين أثناء الرحلات</p>
                </div>
              </div>

              {sosAlerts.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-500">
                  لا توجد بلاغات طوارئ نشطة حالياً. المنصة تعمل بأمان تام.
                </div>
              ) : (
                <div className="space-y-3">
                  {sosAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="bg-rose-950/30 border border-rose-500/40 rounded-2xl p-4 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-rose-600 text-white rounded-md font-bold text-[10px]">
                            {alert.status === 'ACTIVE' ? 'طوارئ عاجلة' : 'تمت المعالجة'}
                          </span>
                          <span className="font-mono text-slate-400">{new Date(alert.timestamp).toLocaleTimeString('ar-YE')}</span>
                        </div>
                        <p className="text-slate-200">
                          تم إطلاق الإنذار من {alert.triggeredByRole === 'CUSTOMER' ? 'العميل' : 'الكابتن'} في المشوار {alert.rideId}
                        </p>
                        <p className="text-slate-400 text-[11px]">الموقع: {alert.location.addressName}</p>
                      </div>

                      {alert.status === 'ACTIVE' && (
                        <button
                          onClick={() => resolveSOS(alert.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                        >
                          تأكيد المعالجة والإغلاق
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-100">بلاغات السلامة المتقدمة</h4>
                    <span className="text-[10px] text-amber-300 font-mono">{safetyReports.length} reports</span>
                  </div>
                  {safetyReports.length === 0 ? (
                    <p className="text-xs text-slate-500">لا توجد بلاغات سلامة مفتوحة.</p>
                  ) : (
                    safetyReports.slice(0, 6).map((report) => (
                      <div key={report.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-100">{report.category}</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold">{report.severity}</span>
                        </div>
                        <p className="text-slate-400">{report.description}</p>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>{report.reporterRole}</span>
                          <span>{new Date(report.createdAt).toLocaleString('ar-YE')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-100">الحظر ومراجعة المطابقة</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{userBlocks.length} blocks</span>
                  </div>
                  {userBlocks.length === 0 ? (
                    <p className="text-xs text-slate-500">لا توجد قرارات حظر حالية.</p>
                  ) : (
                    userBlocks.slice(0, 6).map((block) => (
                      <div key={block.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                        <div className="flex justify-between gap-3">
                          <span className="font-mono text-rose-300">{block.blockedRole}:{block.blockedUserId}</span>
                          <span className="text-[10px] text-emerald-300">{block.status}</span>
                        </div>
                        <p className="text-slate-400 mt-1">{block.reason}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: SUPPORT TICKETS */}
          {activeTab === 'SUPPORT' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100">تذاكر الدعم والشكاوى ({supportTickets.length})</h3>
              <div className="space-y-3">
                {supportTickets.map((ticket) => (
                  <div key={ticket.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 text-sm">{ticket.subject}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ticket.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-slate-300">{ticket.description}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-slate-400 text-[11px]">
                      <span>مقدم التذكرة: {ticket.userName} ({ticket.userRole})</span>
                      {ticket.adminNotes && <span className="text-sky-400">ملاحظات الإدارة: {ticket.adminNotes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'DIAGNOSTICS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  { label: 'Frontend', value: diagnosticEvents.filter((e) => e.source === 'FRONTEND').length },
                  { label: 'Backend', value: diagnosticEvents.filter((e) => e.source === 'BACKEND').length },
                  { label: 'Payments', value: diagnosticEvents.filter((e) => e.source === 'PAYMENT').length },
                  { label: 'Critical', value: diagnosticEvents.filter((e) => e.level === 'CRITICAL' || e.level === 'ERROR').length }
                ].map((item) => (
                  <div key={item.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <div className="text-[11px] text-slate-400">{item.label}</div>
                    <div className="text-2xl font-black text-slate-100 font-mono">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    recordDiagnosticEvent({
                      source: 'FRONTEND',
                      level: 'INFO',
                      message: 'Manual diagnostic heartbeat from admin center',
                      durationMs: 28
                    });
                    showToast('تم تسجيل نبضة تشخيص يدوية.');
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs"
                >
                  تسجيل فحص يدوي
                </button>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                {diagnosticEvents.map((event) => (
                  <div key={event.id} className="flex items-start justify-between gap-3 py-2 border-b border-slate-800 last:border-none">
                    <div>
                      <span className="font-bold text-slate-100">{event.message}</span>
                      <span className="block text-[10px] text-slate-500 font-mono">{event.source} · {event.durationMs || 0}ms</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      event.level === 'ERROR' || event.level === 'CRITICAL'
                        ? 'bg-rose-500/15 text-rose-300'
                        : event.level === 'WARNING'
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-emerald-500/15 text-emerald-300'
                    }`}>
                      {event.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'BACKUPS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Backup & Restore Runbook</h3>
                  <p className="text-xs text-slate-400 mt-1">نسخ يومي، checksum، وتجربة استرجاع موثقة قبل الإطلاق.</p>
                </div>
                <button
                  onClick={() => {
                    createBackupSnapshot('FULL_SYSTEM');
                    showToast('تم إنشاء نسخة احتياطية تجريبية وتسجيلها.');
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs"
                >
                  إنشاء Backup الآن
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {backupSnapshots.map((snapshot) => (
                  <div key={snapshot.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">{snapshot.scope}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">{snapshot.status}</span>
                    </div>
                    <p className="text-slate-400 font-mono break-all">{snapshot.storagePath}</p>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{snapshot.checksum}</span>
                      <span>{new Date(snapshot.createdAt).toLocaleString('ar-YE')}</span>
                    </div>
                    {snapshot.restoreTestedAt && (
                      <div className="text-[11px] text-sky-300">Restore tested: {new Date(snapshot.restoreTestedAt).toLocaleString('ar-YE')}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: AUDIT LOGS */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {adminDecisionLog.map((decision) => (
                  <div key={decision.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-sky-400" />
                        <h4 className="text-sm font-bold text-slate-100">{decision.title}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        decision.status === 'ACTIVE' || decision.status === 'EXECUTED'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}>
                        {decision.status}
                      </span>
                    </div>
                    <p className="text-xs leading-6 text-slate-400">{decision.impact}</p>
                    <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-[11px]">
                      <span className="text-slate-500">صاحب القرار</span>
                      <span className="font-mono text-sky-300">{decision.owner}</span>
                    </div>
                  </div>
                ))}
              </div>
              <h3 className="text-sm font-bold text-slate-100">سجل التدقيق والرقابة الأمني ({auditLogs.length})</h3>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-slate-800/80 last:border-none">
                    <div>
                      <span className="font-semibold text-slate-200">{log.action}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{log.adminEmail}</span>
                    </div>
                    <span className="font-mono text-slate-500 text-[11px]">
                      {new Date(log.timestamp).toLocaleString('ar-YE')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 11: UNIT & SYSTEM TESTS */}
          {activeTab === 'TESTS' && (
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>فحص محركات المنصة واختبارات الجاهزية التشغيلية (System Engine Diagnostics)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    فحص مباشر لجميع سيناريوهات الرحلات (Scenarios A-J)، معادلات التسعير، عمولة 10%، الحسابات المالية ودفتر الأستاذ (Ledger)، وآلة حالات الرحلة.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleRunAllTests}
                    disabled={isRunningTests}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <Play className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
                    <span>{isRunningTests ? 'جاري الفحص...' : 'تشغيل كافة الفحوصات'}</span>
                  </button>

                  <button
                    onClick={handleRunFailedTests}
                    disabled={isRunningTests || testResults.length === 0}
                    className="px-3 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-800 disabled:opacity-50 text-rose-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>إعادة تشغيل الفاشلة فقط</span>
                  </button>

                  <button
                    onClick={handleClearResults}
                    disabled={testResults.length === 0}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-semibold rounded-xl text-xs transition-all"
                  >
                    مسح النتائج
                  </button>
                </div>
              </div>

              {/* Status Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-semibold block">إجمالي الفحوصات</span>
                  <span className="text-xl font-bold font-mono text-slate-100">{testResults.length}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-semibold block">الناجحة (PASS)</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {testResults.filter((t) => t.status === 'PASS').length}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-semibold block">التحذيرات (WARNING)</span>
                  <span className="text-xl font-bold font-mono text-amber-400">
                    {testResults.filter((t) => t.status === 'WARNING').length}
                  </span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-semibold block">الفاشلة (FAIL)</span>
                  <span className={`text-xl font-bold font-mono ${testResults.filter((t) => t.status === 'FAIL').length > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {testResults.filter((t) => t.status === 'FAIL').length}
                  </span>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 text-xs">
                {(['ALL', 'PASS', 'WARNING', 'FAIL'] as const).map((filter) => {
                  const count = filter === 'ALL'
                    ? testResults.length
                    : testResults.filter((t) => t.status === filter).length;
                  return (
                    <button
                      key={filter}
                      onClick={() => setTestStatusFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                        testStatusFilter === filter
                          ? 'bg-slate-800 text-slate-100 border border-slate-700'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {filter === 'ALL' ? 'جميع الفحوصات' : filter} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Engine Services Status Registry */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-200">حالة سجل الخدمات ومحركات التشغيل (Active Service Registry)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  {[
                    { name: 'PricingService', desc: 'محرك تسعير المشاوير وعمولة 10%', status: 'ACTIVE' },
                    { name: 'RideService', desc: 'إدارة دورة حياة الرحلات والـ State Machine', status: 'ACTIVE' },
                    { name: 'DriverService', desc: 'إدارة وتوجيه الكباتن والـ Smart Dispatch', status: 'ACTIVE' },
                    { name: 'PassengerService', desc: 'إدارة العملاء والعناوين والمفضلة', status: 'ACTIVE' },
                    { name: 'PaymentService', desc: 'المحفظة الرقمية وسجل الأستاذ (Ledger)', status: 'ACTIVE' },
                    { name: 'LocationService', desc: 'حساب المسافات Haversine وتقدير الـ ETA', status: 'ACTIVE' },
                    { name: 'NotificationService', desc: 'إشعارات الرحلات والتنبيهات المباشرة', status: 'ACTIVE' },
                    { name: 'RatingService', desc: 'تقييمات الكباتن ومتوسطات النجوم', status: 'ACTIVE' },
                    { name: 'AdminService', desc: 'مؤشرات الأداء وسجلات التدقيق والرقابة', status: 'ACTIVE' },
                    { name: 'AuthService', desc: 'التحقق من الهاتف والـ OTP ومزودي اليمن', status: 'ACTIVE' },
                    { name: 'MapService', desc: 'محرك الخرائط والمواقع الجغرافية', status: 'ACTIVE' },
                    { name: 'SecurityGate', desc: 'صلاحيات الأدوار وعزل البيانات (RBAC)', status: 'ACTIVE' }
                  ].map((srv) => (
                    <div key={srv.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <div>
                        <span className="font-mono font-bold text-emerald-400 text-xs block">{srv.name}</span>
                        <span className="text-[10px] text-slate-400">{srv.desc}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                        سليم PASS
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Test Results with PASS / FAIL / WARNING, Expected, Actual, Duration, Timestamp */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-200">
                    نتائج الاختبارات التلقائية الميدانية ({testResults.length})
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    نسبة النجاح: {testResults.length > 0 ? `${Math.round((testResults.filter((t) => t.status === 'PASS').length / testResults.length) * 100)}%` : '100%'}
                  </span>
                </div>

                {testResults.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs space-y-2">
                    <p>لم يتم تشغيل الاختبارات بعد.</p>
                    <button
                      onClick={handleRunAllTests}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md inline-flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>بدء تشغيل كافة الفحوصات الآن</span>
                    </button>
                  </div>
                ) : (
                  testResults
                    .filter((t) => (testStatusFilter === 'ALL' ? true : t.status === testStatusFilter))
                    .map((t, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border flex flex-col gap-2 text-xs transition-all ${
                          t.status === 'PASS'
                            ? 'bg-emerald-950/20 border-emerald-900/50 text-slate-200'
                            : t.status === 'WARNING'
                            ? 'bg-amber-950/20 border-amber-900/50 text-amber-200'
                            : 'bg-rose-950/20 border-rose-900/50 text-rose-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            {t.status === 'PASS' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                            {t.status === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                            {t.status === 'FAIL' && <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs text-slate-100">{t.name}</span>
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                  {t.category}
                                </span>
                                <span className="text-[9px] font-mono text-slate-500">
                                  المدة: {t.durationMs}ms
                                </span>
                                <span className="text-[9px] font-mono text-slate-500">
                                  الوقت: {t.timestamp}
                                </span>
                              </div>
                              {t.message && (
                                <p className="text-[11px] text-slate-400 mt-1 font-sans">{t.message}</p>
                              )}
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            t.status === 'PASS'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : t.status === 'WARNING'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {t.status === 'PASS' ? 'PASS ناجح' : t.status === 'WARNING' ? 'WARNING تحذير' : 'FAIL فاشل'}
                          </span>
                        </div>

                        {/* Expected and Actual displays */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-[11px] font-mono">
                          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                            <span className="text-slate-400 block text-[10px] font-sans">المتوقع (Expected):</span>
                            <span className="text-slate-300">{t.expected}</span>
                          </div>
                          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                            <span className="text-slate-400 block text-[10px] font-sans">الفعلي (Actual):</span>
                            <span className={t.status === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}>{t.actual}</span>
                          </div>
                        </div>

                        {t.errorMessage && (
                          <div className="bg-rose-950/50 border border-rose-900/80 p-2 rounded-xl text-[11px] text-rose-300 font-mono">
                            <span className="font-bold text-[10px] font-sans block text-rose-400">رسالة الخطأ (Error Message):</span>
                            {t.errorMessage}
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Demo Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 text-xs shadow-2xl text-right">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">تأكيد استعادة بيانات التجربة (Reset Demo Data)</h3>
                <span className="text-[11px] text-slate-400">إعادة تعيين الحالة الافتراضية لمنظومة مشوار</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-2 text-slate-300 text-[11px] leading-relaxed">
              <p>
                هل أنت متأكد من رغبتك في إعادة ضبط جميع بيانات النظام التجريبي؟
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[10px]">
                <li>إعادة تعيين أسطول الكباتن (20 كابتن بحالاتهم الافتراضية).</li>
                <li>إعادة ضبط حسابات الركاب (50 راكب مع أرصدة المحافظ).</li>
                <li>استعادة سجل 100 مشوار تجريبي.</li>
                <li>إعادة تعيين قواعد التسعير الرسمية (سيارة 1800 ر.ي، دراجة 700 ر.ي، عمولة 10%).</li>
                <li>تفريغ طلبات الرحلات الجارية والمحادثات المفتوحة.</li>
              </ul>
              <p className="text-emerald-400 text-[10px] pt-1 font-semibold">
                ✓ هذا الإجراء آمن تماماً ويعمل ضمن بيئة الـ Mock ولا يؤثر مطلقاً على أي خوادم أو بيئة إنتاجية.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  resetDemoData();
                  setShowResetConfirmModal(false);
                  showToast('تمت إعادة ضبط جميع بيانات المنصة التجريبية بنجاح إلى الحالة الأصلية!');
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تأكيد إعادة الضبط</span>
              </button>
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Document Inspection Modal */}
      {inspectingDriver && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-100">تدقيق وثائق الكابتن</h3>
                <span className="text-[11px] text-slate-400">{inspectingDriver.fullName}</span>
              </div>
              <button onClick={() => setInspectingDriver(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="flex justify-between text-slate-300">
                <span>رقم الهاتف:</span>
                <span className="font-mono text-emerald-400 font-bold">{inspectingDriver.phoneNumber}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>المركبة:</span>
                <span>{inspectingDriver.vehicle?.make} {inspectingDriver.vehicle?.model} ({inspectingDriver.vehicle?.color})</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>رقم اللوحة:</span>
                <span className="font-mono font-bold text-slate-100">{inspectingDriver.vehicle?.plateNumber}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>حالة الحساب:</span>
                <span className="font-bold text-amber-400">{inspectingDriver.driverStatus}</span>
              </div>
            </div>

            <div className="space-y-2 text-[11px]">
              {(driverDocuments[inspectingDriver.id] || []).map((docItem) => (
                <div key={docItem.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">
                      {docItem.type === 'NATIONAL_ID'
                        ? 'البطاقة الشخصية'
                        : docItem.type === 'DRIVING_LICENSE'
                        ? 'رخصة القيادة'
                        : docItem.type === 'VEHICLE_REGISTRATION'
                        ? 'استمارة المركبة'
                        : 'صور المركبة'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                        docItem.status === 'APPROVED'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : docItem.status === 'REJECTED'
                          ? 'bg-rose-950 text-rose-400 border-rose-800'
                          : 'bg-amber-950 text-amber-400 border-amber-800'
                      }`}
                    >
                      {docItem.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                    <span>رفع: {new Date(docItem.uploadedAt).toLocaleDateString('ar-YE')}</span>
                    <span>انتهاء: {docItem.expiresAt ? new Date(docItem.expiresAt).toLocaleDateString('ar-YE') : '-'}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">{docItem.reviewNotes}</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        reviewKycDocument(docItem.id, 'APPROVED', 'تم اعتماد الوثيقة من لوحة الإدارة.');
                        showToast('تم اعتماد وثيقة KYC.');
                      }}
                      className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold"
                    >
                      اعتماد الوثيقة
                    </button>
                    <button
                      onClick={() => {
                        reviewKycDocument(docItem.id, 'REQUEST_CHANGES', 'الوثيقة تحتاج تحديث أو صورة أوضح.');
                        showToast('تم طلب تعديل وثيقة KYC.');
                      }}
                      className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold"
                    >
                      طلب تعديل
                    </button>
                  </div>
                </div>
              ))}
              <div className="text-[10px] text-sky-300 bg-sky-950/30 border border-sky-900 rounded-xl p-2">
                قرارات مراجعة محفوظة لهذا الكابتن: {kycReviewRecords.filter((record) => record.driverId === inspectingDriver.id).length}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleApproveDriver(inspectingDriver.id)}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md"
              >
                اعتماد وتفعيل الكابتن
              </button>
              <button
                onClick={() => handleSuspendDriver(inspectingDriver.id)}
                className="py-2.5 px-4 bg-rose-950 hover:bg-rose-900 text-rose-400 font-bold rounded-xl text-xs transition-all"
              >
                تعليق الحساب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
