import React, { useState } from 'react';
import { useMishwar } from '../../context/MishwarContext';
import { InteractiveMap } from '../common/InteractiveMap';
import { POPULAR_LOCATIONS } from '../../data/mockData';
import { GeoPoint, VehicleType } from '../../../packages/shared_types/src';
import { formatCurrency } from '../../../packages/shared_utils/src';
import { locationService } from '../../services/locationService';
import {
  MapPin,
  Navigation,
  Star,
  Phone,
  MessageSquare,
  AlertTriangle,
  X,
  Send,
  Shield,
  Clock,
  Car,
  Bike,
  History,
  HelpCircle,
  CreditCard,
  User,
  ChevronRight,
  CheckCircle2,
  LifeBuoy,
  Compass,
  KeyRound,
  LogIn,
  ArrowRight,
  ShieldCheck,
  Share2,
  ThumbsUp,
  Wallet,
  Building2,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Edit3,
  Snowflake,
  Wind,
  Users,
  Check,
  Sparkles
} from 'lucide-react';

export const CustomerAppView: React.FC = () => {
  const {
    currentCustomer,
    setCurrentCustomer,
    customers,
    activeRide,
    activeDriverPosition,
    estimateRideFare,
    requestRide,
    cancelActiveRide,
    rateRide,
    chatMessages,
    sendChatMessage,
    triggerSOS,
    shareActiveRide,
    createSafetyReport,
    blockRideUser,
    pricingRules,
    vehicleCategories,
    rides,
    getCurrentDeviceLocation,
    loginWithPhone,
    appMode,
    selectedCity,
    notifications,
    unreadNotifCount,
    markNotificationRead,
    markAllNotificationsRead,
    favoriteLocations,
    topUpWallet
  } = useMishwar();

  // Booking Form State
  const [pickup, setPickup] = useState<GeoPoint>({
    latitude: POPULAR_LOCATIONS[0].lat,
    longitude: POPULAR_LOCATIONS[0].lng,
    addressName: POPULAR_LOCATIONS[0].nameAr
  });
  const [destination, setDestination] = useState<GeoPoint>({
    latitude: POPULAR_LOCATIONS[1].lat,
    longitude: POPULAR_LOCATIONS[1].lng,
    addressName: POPULAR_LOCATIONS[1].nameAr
  });
  const [vehicleType, setVehicleType] = useState<VehicleType>('ECONOMY');
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [airConditioningRequired, setAirConditioningRequired] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'WALLET'>('CASH');
  const [selectionMode, setSelectionMode] = useState<'pickup' | 'destination' | null>(null);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Manual Edit Modals
  const [showLocationModal, setShowLocationModal] = useState<'pickup' | 'destination' | null>(null);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [showManualEditModal, setShowManualEditModal] = useState<'pickup' | 'destination' | null>(null);
  const [manualInputName, setManualInputName] = useState('');

  // Authentication State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPhone, setAuthPhone] = useState('771234567');
  const [authOtp, setAuthOtp] = useState('');
  const [authStep, setAuthStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // Modals & Panels
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('تغيير الخطط');
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [selectedTip, setSelectedTip] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'BOOK' | 'HISTORY' | 'WALLET' | 'SUPPORT'>('BOOK');
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(5000);
  const [topUpProvider, setTopUpProvider] = useState<'KURAIMI' | 'FLOOSAK' | 'JAIB'>('KURAIMI');

  // Customer rides history
  const customerRides = rides.filter((r) => r.customerId === currentCustomer.id);

  // Distance & Duration (ETA) calculation via locationService
  const tripDistanceKm = locationService.calculateDistance(pickup, destination);
  const tripDurationMins = locationService.estimateDuration(tripDistanceKm, vehicleType);

  // Active Category Details
  const activeCategory = vehicleCategories.find((c) => c.type === vehicleType) || vehicleCategories[1] || {
    id: 'economy',
    name: 'Economy',
    type: 'ECONOMY' as VehicleType,
    nameAr: 'سيارة اقتصادية',
    nameEn: 'Economy',
    descriptionAr: 'توفير واقتصادي للمشاوير اليومية',
    capacity: 4,
    baseFare: 1200,
    pricePerKm: 350,
    pricePerMinute: 45,
    minimumFare: 1800,
    supportsAC: true,
    iconName: 'Car'
  };

  // Live estimate for active selection with options
  const activeFare = estimateRideFare(pickup, destination, vehicleType, {
    passengerCount,
    airConditioningRequired
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectVehicle = (catType: VehicleType) => {
    setVehicleType(catType);
    const cat = vehicleCategories.find((c) => c.type === catType);
    if (cat) {
      if (passengerCount > cat.capacity) {
        setPassengerCount(cat.capacity);
        showToast(`تم ضبط عدد الركاب إلى ${cat.capacity} ليناسب سعة ${cat.nameAr}`);
      }
      if (!cat.supportsAC && airConditioningRequired) {
        setAirConditioningRequired(false);
        showToast('الدراجات النارية غير مزودة بمكيف');
      }
    }
  };

  const handleSelectPassengerCount = (count: number) => {
    if (count > activeCategory.capacity) {
      showToast(`الحد الأقصى لسعة ${activeCategory.nameAr} هو ${activeCategory.capacity} ركاب`);
      return;
    }
    setPassengerCount(count);
  };

  const handleToggleAC = (req: boolean) => {
    if (req && !activeCategory.supportsAC) {
      showToast('هذه الفئة (دراجة نارية) غير مزودة بمكيف');
      return;
    }
    setAirConditioningRequired(req);
  };

  const handleMapClick = (pt: { lat: number; lng: number }) => {
    const addressName = locationService.reverseGeocode(pt.lat, pt.lng);
    if (selectionMode === 'pickup') {
      setPickup({
        latitude: pt.lat,
        longitude: pt.lng,
        addressName
      });
      setSelectionMode(null);
      showToast('تم تحديد موقع الانطلاق على الخريطة');
    } else if (selectionMode === 'destination') {
      setDestination({
        latitude: pt.lat,
        longitude: pt.lng,
        addressName
      });
      setSelectionMode(null);
      showToast('تم تحديد مكان الوصول على الخريطة');
    }
  };

  const handleSelectSearchedLocation = (loc: GeoPoint) => {
    if (showLocationModal === 'pickup') {
      setPickup(loc);
      showToast(`تم تعيين موقع الانطلاق: ${loc.addressName}`);
    } else if (showLocationModal === 'destination') {
      setDestination(loc);
      showToast(`تم تعيين الوجهة: ${loc.addressName}`);
    }
    setShowLocationModal(null);
    setLocationSearchQuery('');
  };

  const handleSaveManualEdit = () => {
    if (!manualInputName.trim()) return;
    if (showManualEditModal === 'pickup') {
      setPickup((prev) => ({ ...prev, addressName: manualInputName.trim() }));
      showToast('تم تعديل موقع الانطلاق بنجاح');
    } else if (showManualEditModal === 'destination') {
      setDestination((prev) => ({ ...prev, addressName: manualInputName.trim() }));
      showToast('تم تعديل الوجهة بنجاح');
    }
    setShowManualEditModal(null);
    setManualInputName('');
  };

  const handleRealGPSClick = async () => {
    setIsLocatingGPS(true);
    const result = await getCurrentDeviceLocation();
    setIsLocatingGPS(false);
    if (result.success && result.location) {
      setPickup(result.location);
      showToast('تم تحديد موقعك بدقة عبر GPS الجهاز');
    } else {
      showToast(result.error || 'تعذر تحديد الموقع الحالي عبر GPS');
    }
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (authPhone.length < 8) {
      setAuthMessage('يرجى إدخال رقم هاتف يمني صحيح');
      return;
    }
    setAuthStep('OTP');
    setAuthMessage('تم إرسال رمز التحقق (رمز الاختبار: 123456)');
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await loginWithPhone(authPhone, authOtp, 'CUSTOMER');
    if (res.success) {
      setShowAuthModal(false);
      setAuthStep('PHONE');
      setAuthOtp('');
      setAuthMessage(null);
      showToast('تم تسجيل الدخول بنجاح');
    } else {
      setAuthMessage(res.message);
    }
  };

  const handleOrder = async () => {
    await requestRide(pickup, destination, vehicleType, {
      passengerCount,
      airConditioningRequired,
      paymentMethod
    });
    showToast('جاري البحث عن أقرب كابتن مشوار...');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput, 'CUSTOMER');
    setChatInput('');
  };

  const handleConfirmCancel = () => {
    cancelActiveRide(cancelReason, 'CUSTOMER');
    setShowCancelModal(false);
    showToast('تم إلغاء الرحلة');
  };

  const handleConfirmSOS = () => {
    triggerSOS('CUSTOMER');
    setSosSent(true);
    setTimeout(() => {
      setShowSOSModal(false);
      setSosSent(false);
      showToast('تم إرسال بلاغ الطوارئ إلى مركز عمليات مشوار');
    }, 2000);
  };

  const handleShareRide = async () => {
    const trackingUrl = shareActiveRide();
    if (!trackingUrl) return;
    try {
      await navigator.clipboard?.writeText(trackingUrl);
      showToast('تم نسخ رابط مشاركة الرحلة');
    } catch {
      showToast(`رابط مشاركة الرحلة: ${trackingUrl}`);
    }
  };

  const handleSafetyReport = () => {
    createSafetyReport({
      reporterRole: 'CUSTOMER',
      category: 'UNSAFE_DRIVING',
      description: 'بلاغ سلامة من الراكب أثناء الرحلة',
      severity: 'HIGH'
    });
    showToast('تم إرسال بلاغ السلامة إلى مركز العمليات');
  };

  const handleBlockDriver = () => {
    blockRideUser('DRIVER', 'طلب الراكب عدم المطابقة مع هذا الكابتن مرة أخرى');
    showToast('تم حظر الكابتن لهذا الراكب وإرسال القرار للمراجعة');
  };

  const handleFinishRating = () => {
    rateRide(ratingStars, ratingComment);
    setRatingComment('');
    setRatingStars(5);
    setSelectedTip(0);
    showToast('شكراً لك! تم تسجيل تقييمك للكابتن');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden relative font-['Cairo',sans-serif]">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-14 inset-x-3 z-50 p-2.5 bg-emerald-950/95 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 text-center shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Top Mobile Bar - Sleek & Clean */}
      <header className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between z-20 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAuthModal(true)}
            className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold text-emerald-400 overflow-hidden shrink-0 active:scale-95 transition-transform"
            title="الحساب وتسجيل الدخول"
          >
            {currentCustomer.avatarUrl ? (
              <img
                src={currentCustomer.avatarUrl}
                alt={currentCustomer.fullName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{currentCustomer.fullName.charAt(0)}</span>
            )}
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-slate-100 leading-tight">{currentCustomer.fullName}</h2>
              {appMode === 'PILOT' && (
                <span className="text-[9px] font-mono font-bold text-sky-400 bg-sky-950/80 px-1 py-0.2 rounded border border-sky-800/50">
                  Pilot
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-0.5 text-amber-400">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{currentCustomer.ratingAverage}</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-400 font-semibold font-mono tabular-nums">
                {formatCurrency(currentCustomer.walletBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Action: Notifications & Switch User / Login */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowNotificationsModal(true)}
            className="h-8 w-8 bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 border border-slate-700/60 rounded-xl text-xs flex items-center justify-center transition-colors active:scale-95 relative"
            title="الإشعارات"
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            {unreadNotifCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
            )}
          </button>

          <button
            onClick={() => setShowTopUpModal(true)}
            className="h-8 px-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors active:scale-95"
            title="شحن المحفظة"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ شحن</span>
          </button>

          <button
            onClick={() => setShowAuthModal(true)}
            className="h-8 px-2.5 bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 border border-slate-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-400" />
            <span>دخول</span>
          </button>
        </div>
      </header>

      {/* Main Tab Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* ================= TAB 1: BOOK RIDE ================= */}
        {activeTab === 'BOOK' && (
          <div className="flex-1 relative flex flex-col overflow-hidden">
            {/* Map Canvas Viewport */}
            <div className="flex-1 relative">
              <InteractiveMap
                center={{ lat: selectedCity.center.latitude, lng: selectedCity.center.longitude }}
                pickup={pickup}
                destination={destination}
                driverPosition={activeDriverPosition}
                vehicleType={activeRide ? activeRide.vehicleType : vehicleType}
                isSearching={activeRide?.status === 'SEARCHING_DRIVER'}
                selectionMode={selectionMode}
                onMapClick={handleMapClick}
              />

              {/* Floating Real GPS button */}
              <button
                onClick={handleRealGPSClick}
                disabled={isLocatingGPS}
                className="absolute top-3 left-3 z-10 h-10 px-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 rounded-2xl shadow-xl flex items-center gap-1.5 text-xs text-slate-200 backdrop-blur-md transition-all active:scale-95"
                title="تحديد موقعي الفعلي عبر GPS"
              >
                <Compass className={`w-4 h-4 text-emerald-400 ${isLocatingGPS ? 'animate-spin' : ''}`} />
                <span className="text-[11px] font-bold">{isLocatingGPS ? 'جاري التحديد...' : 'موقعي GPS'}</span>
              </button>

              {/* Selection Mode Notice if picking point on map */}
              {selectionMode && (
                <div className="absolute top-3 inset-x-14 z-20 p-2 bg-emerald-950/95 border border-emerald-500/70 rounded-xl text-xs text-emerald-200 text-center shadow-lg font-bold animate-pulse">
                  {selectionMode === 'pickup'
                    ? '📍 اضغط على الخريطة لتحديد موقع الالتقاط'
                    : '🎯 اضغط على الخريطة لتحديد الوجهة'}
                </div>
              )}
            </div>

            {/* Bottom Sheet Container */}
            <div className="bg-slate-900/95 border-t border-slate-800 rounded-t-3xl shadow-2xl p-4 backdrop-blur-md z-20 max-h-[55vh] overflow-y-auto">
              {/* Drag Handle Bar */}
              <div className="w-10 h-1 bg-slate-700/80 rounded-full mx-auto mb-3" />

              {/* STAGE A: Pre-Booking Configuration */}
              {!activeRide && (
                <div className="space-y-4">
                  {/* Locations Input Card */}
                  <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-3.5 space-y-3 shadow-md">
                    {/* 1. PICKUP LOCATION ("اختر مكان الانطلاق") */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                          <span className="text-xs font-bold text-slate-100">اختر مكان الانطلاق</span>
                        </div>
                        {selectionMode === 'pickup' && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40 animate-pulse">
                            حدد النقطة على الخريطة
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-xs font-semibold text-slate-200 truncate">
                            {pickup.addressName}
                          </span>
                        </div>
                      </div>

                      {/* Pickup Action Controls */}
                      <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={handleRealGPSClick}
                          disabled={isLocatingGPS}
                          className="h-8 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-emerald-400 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
                          title="تحديد موقعي الحالي عبر GPS"
                        >
                          <Compass className={`w-3.5 h-3.5 ${isLocatingGPS ? 'animate-spin' : ''}`} />
                          <span>{isLocatingGPS ? 'تحديد...' : 'موقعي'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setLocationSearchQuery('');
                            setShowLocationModal('pickup');
                          }}
                          className="h-8 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1 transition-all active:scale-95"
                        >
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                          <span>بحث</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectionMode(selectionMode === 'pickup' ? null : 'pickup')}
                          className={`h-8 px-2 border rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 ${
                            selectionMode === 'pickup'
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>الخريطة</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setManualInputName(pickup.addressName);
                            setShowManualEditModal('pickup');
                          }}
                          className="h-8 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1 transition-all active:scale-95"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                          <span>تعديل</span>
                        </button>
                      </div>
                    </div>

                    <div className="h-[1px] bg-slate-800/80 mx-1" />

                    {/* 2. DESTINATION ("اختر مكان الوصول") */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/20" />
                          <span className="text-xs font-bold text-slate-100">اختر مكان الوصول</span>
                        </div>
                        {selectionMode === 'destination' && (
                          <span className="text-[10px] text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-500/40 animate-pulse">
                            حدد الوجهة على الخريطة
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Navigation className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="text-xs font-semibold text-slate-200 truncate">
                            {destination.addressName}
                          </span>
                        </div>
                      </div>

                      {/* Destination Action Controls */}
                      <div className="grid grid-cols-3 gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setLocationSearchQuery('');
                            setShowLocationModal('destination');
                          }}
                          className="h-8 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                          <span>بحث عن وجهة</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectionMode(selectionMode === 'destination' ? null : 'destination')}
                          className={`h-8 px-2 border rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                            selectionMode === 'destination'
                              ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>من الخريطة</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setManualInputName(destination.addressName);
                            setShowManualEditModal('destination');
                          }}
                          className="h-8 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                          <span>تعديل يدوي</span>
                        </button>
                      </div>

                      {/* Quick Popular Destination Chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">سريعة:</span>
                        {POPULAR_LOCATIONS.slice(0, 5).map((loc) => (
                          <button
                            key={loc.nameAr}
                            type="button"
                            onClick={() => {
                              setDestination({ latitude: loc.lat, longitude: loc.lng, addressName: loc.nameAr });
                              showToast(`تم تعيين الوجهة: ${loc.nameAr}`);
                            }}
                            className={`px-2.5 py-1 rounded-xl text-[11px] whitespace-nowrap transition-colors border ${
                              destination.addressName === loc.nameAr
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 font-bold'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                            }`}
                          >
                            {loc.nameAr}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Trip Metrics Banner: Distance and ETA */}
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border border-slate-800/90 rounded-xl text-xs mt-1">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Navigation className="w-3.5 h-3.5 text-sky-400" />
                        <span className="text-[11px] text-slate-400">المسافة التقريبية:</span>
                        <span className="font-mono font-bold text-slate-100">{tripDistanceKm.toFixed(1)} كم</span>
                      </div>
                      <div className="h-3 w-[1px] bg-slate-800" />
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[11px] text-slate-400">الوقت التقريبي (ETA):</span>
                        <span className="font-mono font-bold text-amber-300">~{tripDurationMins} دقيقة</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. VEHICLE TYPE SELECTION ("نوع المركبة") */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-100">اختر نوع المركبة</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        الحد الأدنى يبدأ من {formatCurrency(700)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {vehicleCategories.map((cat) => {
                        const isSelected = vehicleType === cat.type;
                        const catFare = estimateRideFare(pickup, destination, cat.type, {
                          passengerCount,
                          airConditioningRequired
                        });

                        return (
                          <button
                            key={cat.id || cat.type}
                            type="button"
                            onClick={() => handleSelectVehicle(cat.type)}
                            className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between relative overflow-hidden ${
                              isSelected
                                ? 'bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            {cat.badge && (
                              <div className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-950/90 text-emerald-400 border border-emerald-500/30">
                                {cat.badge}
                              </div>
                            )}

                            <div className="flex items-center gap-2.5 mb-2">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'bg-emerald-500 text-slate-950'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {cat.type === 'MOTORCYCLE' ? (
                                  <Bike className="w-5 h-5" />
                                ) : cat.type === 'COMFORT' ? (
                                  <Sparkles className="w-5 h-5" />
                                ) : cat.type === 'FAMILY' ? (
                                  <Users className="w-5 h-5" />
                                ) : (
                                  <Car className="w-5 h-5" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                                  <span>{cat.nameAr}</span>
                                  {cat.supportsAC && (
                                    <span className="text-[10px] text-sky-400" title="مكيفة">❄️</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {cat.descriptionAr}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
                              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <Users className="w-3 h-3 text-slate-500" />
                                <span>سعة {cat.capacity}</span>
                              </div>

                              <div className="text-right">
                                <span className="text-xs font-bold text-emerald-400 font-mono tabular-nums">
                                  {formatCurrency(catFare.grossFare)}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. NUMBER OF PASSENGERS & 5. AIR CONDITIONING */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5">
                    {/* 4. NUMBER OF PASSENGERS ("عدد الركاب") */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs font-bold text-slate-100">عدد الركاب</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          (سعة {activeCategory.nameAr}: {activeCategory.capacity})
                        </span>
                      </div>

                      <div className="grid grid-cols-6 gap-1">
                        {[1, 2, 3, 4, 5, 6].map((count) => {
                          const isAllowed = count <= activeCategory.capacity;
                          const isSelected = passengerCount === count;

                          return (
                            <button
                              key={count}
                              type="button"
                              disabled={!isAllowed}
                              onClick={() => handleSelectPassengerCount(count)}
                              title={
                                isAllowed
                                  ? `${count} ركاب`
                                  : `يتجاوز سعة المركبة الحالية (${activeCategory.capacity})`
                              }
                              className={`h-9 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                                !isAllowed
                                  ? 'opacity-30 cursor-not-allowed bg-slate-900 text-slate-500 border-slate-800/70 line-through'
                                  : isSelected
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/70'
                              }`}
                            >
                              <span>{count}</span>
                              <span className="text-[8px] font-normal leading-none">
                                {count === 1 ? 'راكب' : 'ركاب'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 5. AIR CONDITIONING ("التكييف") */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Snowflake className="w-3.5 h-3.5 text-sky-400" />
                          <span className="text-xs font-bold text-slate-100">التكييف</span>
                        </div>
                        {!activeCategory.supportsAC && (
                          <span className="text-[10px] text-amber-400">غير متاح للدراجات</span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                        <button
                          type="button"
                          disabled={!activeCategory.supportsAC}
                          onClick={() => handleToggleAC(true)}
                          className={`h-8 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            !activeCategory.supportsAC
                              ? 'opacity-40 cursor-not-allowed text-slate-500'
                              : airConditioningRequired
                              ? 'bg-sky-500 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Snowflake className="w-3.5 h-3.5" />
                          <span>❄️ تكييف</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleAC(false)}
                          className={`h-8 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            !airConditioningRequired
                              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Wind className="w-3.5 h-3.5" />
                          <span>🌬️ بدون تكييف</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selector & Summary */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <span className="text-[11px] text-slate-400">طريقة الدفع:</span>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod(paymentMethod === 'CASH' ? 'WALLET' : 'CASH')}
                        className="text-xs font-bold text-slate-100 underline decoration-emerald-500 decoration-2 underline-offset-4"
                      >
                        {paymentMethod === 'CASH' ? 'كاش (نقداً)' : 'محفظة مشوار'}
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      <span>الإجمالي التقديري: </span>
                      <span className="text-emerald-400 font-mono font-bold text-xs tabular-nums">
                        {formatCurrency(activeFare.grossFare)}
                      </span>
                    </div>
                  </div>

                  {/* ONE MAIN ACTION: Book Ride Button */}
                  <button
                    type="button"
                    onClick={handleOrder}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
                  >
                    <span>اطلب مشوار الآن</span>
                    <span className="font-mono tabular-nums text-xs bg-slate-950/20 px-2.5 py-0.5 rounded-lg">
                      {formatCurrency(activeFare.grossFare)}
                    </span>
                  </button>
                </div>
              )}

              {/* STAGE B: Searching for Driver */}
              {activeRide?.status === 'SEARCHING_DRIVER' && (
                <div className="space-y-4 py-2 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mx-auto flex items-center justify-center relative">
                    <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
                    {vehicleType === 'MOTORCYCLE' ? (
                      <Bike className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <Car className="w-8 h-8 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">جاري البحث عن أقرب كابتن...</h3>
                    <p className="text-xs text-slate-400 mt-1">يتم إرسال طلبك الآن للكباتن المتاحين في منطقة صنعاء</p>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-right space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>نقطة الالتقاط:</span>
                      <span className="text-slate-200 font-semibold">{pickup.addressName}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>الوجهة:</span>
                      <span className="text-slate-200 font-semibold">{destination.addressName}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 border-t border-slate-800/80 pt-1.5">
                      <span>الأجرة التقديرية:</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        {formatCurrency(activeRide.fare.grossFare)}
                      </span>
                    </div>
                  </div>

                  {/* Cancel Request Action */}
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors"
                  >
                    إلغاء الطلب
                  </button>
                </div>
              )}

              {/* STAGE C: Driver Assigned or Arrived */}
              {activeRide &&
                (activeRide.status === 'DRIVER_ASSIGNED' ||
                  activeRide.status === 'DRIVER_ARRIVING' ||
                  activeRide.status === 'DRIVER_ARRIVED') && (
                  <div className="space-y-3.5">
                    {/* Status Alert Banner */}
                    <div
                      className={`p-3 rounded-2xl flex items-center justify-between ${
                        activeRide.status === 'DRIVER_ARRIVED'
                          ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                          : 'bg-sky-500/15 border border-sky-500/40 text-sky-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <div>
                          <div className="text-xs font-bold">
                            {activeRide.status === 'DRIVER_ARRIVED'
                              ? 'الكابتن وصل إلى موقعك الآن!'
                              : 'الكابتن في الطريق إليك'}
                          </div>
                          <div className="text-[10px] text-slate-300">
                            {activeRide.status === 'DRIVER_ARRIVED'
                              ? 'يرجى التوجه إلى نقطة الالتقاط'
                              : 'وصول متوقع خلال 3-5 دقائق'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-xs">
                        {formatCurrency(activeRide.fare.grossFare)}
                      </div>
                    </div>

                    {/* Driver & Vehicle Card */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 overflow-hidden">
                          {activeRide.driverAvatar ? (
                            <img
                              src={activeRide.driverAvatar}
                              alt={activeRide.driverName || 'الكابتن'}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <User className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-100">{activeRide.driverName || 'كابتن مشوار'}</h4>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <div className="text-[11px] text-slate-400">
                            <span>{activeRide.vehicle?.make || 'مركبة مشوار'}</span>
                            <span className="mx-1">·</span>
                            <span className="text-slate-300 font-semibold">{activeRide.vehicle?.plateNumber || ''}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-amber-400 mt-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{activeRide.driverRating || 5.0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Contact Actions */}
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${activeRide.driverPhone || '774112334'}`}
                          className="min-h-[40px] min-w-[40px] rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center transition-colors"
                          title="اتصال هاتفي"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => setShowChat(true)}
                          className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center relative transition-colors"
                          title="محادثة داخل التطبيق"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {chatMessages.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Secondary Actions: SOS & Cancel */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setShowSOSModal(true)}
                        className="flex-1 h-10 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-600/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>طوارئ SOS</span>
                      </button>
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="h-10 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={handleShareRide}
                        className="h-9 rounded-xl bg-sky-950/60 hover:bg-sky-900/70 border border-sky-600/30 text-sky-300 text-[11px] font-bold flex items-center justify-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>مشاركة</span>
                      </button>
                      <button
                        onClick={handleSafetyReport}
                        className="h-9 rounded-xl bg-amber-950/60 hover:bg-amber-900/70 border border-amber-600/30 text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1.5"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>بلاغ</span>
                      </button>
                      <button
                        onClick={handleBlockDriver}
                        className="h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold flex items-center justify-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>حظر</span>
                      </button>
                    </div>
                  </div>
                )}

              {/* STAGE D: Trip In Progress */}
              {activeRide?.status === 'TRIP_STARTED' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <div>
                        <div className="text-xs font-bold text-emerald-300">المشوار جاري الآن</div>
                        <div className="text-[10px] text-slate-400">متجهون نحو: {activeRide.destination.addressName}</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                      {formatCurrency(activeRide.fare.grossFare)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-emerald-400" />
                      <span>المسافة المتبقية: </span>
                      <span className="font-mono font-bold text-slate-200">~2.1 كم</span>
                    </div>
                    <button
                      onClick={() => setShowSOSModal(true)}
                      className="text-xs text-rose-400 font-bold flex items-center gap-1 bg-rose-950/40 px-2 py-1 rounded-lg border border-rose-500/30"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>SOS طوارئ</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE E: Trip Completed & Rating */}
              {activeRide?.status === 'TRIP_COMPLETED' && (
                <div className="space-y-4 py-2 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">وصلت بالسلامة! اكتمل المشوار</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      المبلغ المطلوب سداده للكابتن:{' '}
                      <span className="font-mono font-bold text-emerald-400">
                        {formatCurrency(activeRide.fare.grossFare)}
                      </span>
                    </p>
                  </div>

                  {/* Rating Stars */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="text-xs font-semibold text-slate-300">كيف كانت تجربتك مع الكابتن؟</div>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRatingStars(star)}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${
                              star <= ratingStars ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    {/* Quick feedback tags */}
                    <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                      {['قيادة ممتازة', 'سيارة نظيفة', 'سريع ومحترم', 'طريق مباشر'].map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setRatingComment((prev) => (prev ? `${prev} · ${tag}` : tag))}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 hover:bg-slate-700 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    {/* Tip Options */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="text-[11px] text-slate-400 mb-1.5">إكرامية اختيارية للكابتن:</div>
                      <div className="flex justify-center gap-2">
                        {[100, 250, 500].map((tip) => (
                          <button
                            key={tip}
                            onClick={() => setSelectedTip(selectedTip === tip ? 0 : tip)}
                            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all border ${
                              selectedTip === tip
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                                : 'bg-slate-800/50 text-slate-400 border-slate-700'
                            }`}
                          >
                            +{tip} ريال
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submit Rating Button */}
                  <button
                    onClick={handleFinishRating}
                    className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                  >
                    تأكيد التقييم وإنهاء المشوار
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: RIDE HISTORY ================= */}
        {activeTab === 'HISTORY' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-100">سجل رحلاتي السابقة</h3>
              <span className="text-xs text-slate-400">{customerRides.length} رحلة</span>
            </div>

            {customerRides.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <History className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs">لم تقم بأي رحلات بعد</p>
              </div>
            ) : (
              customerRides.map((ride) => (
                <div
                  key={ride.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                        {ride.vehicleType === 'MOTORCYCLE' ? (
                          <Bike className="w-4 h-4" />
                        ) : (
                          <Car className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          {ride.vehicleType === 'MOTORCYCLE' ? 'دراجة نارية' : 'سيارة'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(ride.createdAt).toLocaleDateString('ar-YE', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                        {formatCurrency(ride.fare.grossFare)}
                      </span>
                      <div
                        className={`text-[9px] font-semibold ${
                          ride.status === 'TRIP_COMPLETED'
                            ? 'text-emerald-400'
                            : ride.status.startsWith('CANCEL')
                            ? 'text-rose-400'
                            : 'text-sky-400'
                        }`}
                      >
                        {ride.status === 'TRIP_COMPLETED'
                          ? 'مكتملة'
                          : ride.status.startsWith('CANCEL')
                          ? 'ملغاة'
                          : 'قيد التنفيذ'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 rounded-xl p-2 text-xs space-y-1 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="truncate">{ride.pickup.addressName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span className="truncate">{ride.destination.addressName}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ================= TAB 3: WALLET ================= */}
        {activeTab === 'WALLET' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Wallet Balance Hero Card */}
            <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-3xl p-5 text-center relative overflow-hidden shadow-lg">
              <div className="text-xs text-slate-400 mb-1">الرصيد المتاح في المحفظة</div>
              <div className="text-3xl font-black text-slate-100 font-mono tabular-nums tracking-tight">
                {formatCurrency(currentCustomer.walletBalance)}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-[11px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-800/60 font-semibold">
                  حساب معتمد · يمن موبايل / الكريمي
                </span>
              </div>
            </div>

            {/* Quick Deposit Options */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300">شحن المحفظة عبر الخدمات اليمنية:</h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => showToast('خدمة شحن الكريمي مفعّلة في نسخة الإطلاق التجريبي')}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 flex flex-col items-center gap-1.5 transition-colors"
                >
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-[11px] font-bold text-slate-200">الكريمي جوال</span>
                </button>
                <button
                  onClick={() => showToast('خدمة شحن فلوسك كاك بنك جاهزة')}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 flex flex-col items-center gap-1.5 transition-colors"
                >
                  <Coins className="w-5 h-5 text-sky-400" />
                  <span className="text-[11px] font-bold text-slate-200">فلوسك</span>
                </button>
                <button
                  onClick={() => showToast('خدمة شحن محفظة جيب كاش')}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 flex flex-col items-center gap-1.5 transition-colors"
                >
                  <Wallet className="w-5 h-5 text-amber-400" />
                  <span className="text-[11px] font-bold text-slate-200">جيب</span>
                </button>
              </div>
            </div>

            {/* Transactions Log */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300">آخر الحركات المالية:</h4>
              <div className="space-y-2">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">إيداع رصيد تجريبي (Pilot Bonus)</div>
                      <div className="text-[10px] text-slate-400">2026/09/24</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">+15,000 ريال</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: SUPPORT & PROFILE ================= */}
        {activeTab === 'SUPPORT' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {/* Customer Profile Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 text-lg">
                  {currentCustomer.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100">{currentCustomer.fullName}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{currentCustomer.phoneNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-xs text-emerald-400 font-semibold hover:underline"
              >
                تغيير
              </button>
            </div>

            {/* Emergency Hotline Banner */}
            <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-rose-300">خط طوارئ مشوار المباشر</div>
                  <div className="text-[10px] text-slate-400">متاح 24/7 لسلامة الركاب في اليمن</div>
                </div>
              </div>
              <a
                href="tel:199"
                className="h-8 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center"
              >
                اتصل 199
              </a>
            </div>

            {/* Quick FAQs */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300">الأسئلة الشائعة:</h4>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 text-xs">
                <div className="p-3">
                  <div className="font-semibold text-slate-200 mb-0.5">كيف يتم احتساب الأجرة؟</div>
                  <div className="text-[11px] text-slate-400">
                    أجرة فتح العداد + مسافة الكيلومترات المقطوعة وفق تسعيرة مشوار المعتمدة في صنعاء.
                  </div>
                </div>
                <div className="p-3">
                  <div className="font-semibold text-slate-200 mb-0.5">هل يمكن الدفع نقداً؟</div>
                  <div className="text-[11px] text-slate-400">
                    نعم، الدفع كاش متاح دائماً ومباشرة للكابتن عند نهاية كل مشوار.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modern Bottom Navigation Bar (4 Standard Destinations) */}
      <nav className="h-14 bg-slate-900/95 border-t border-slate-800/90 grid grid-cols-4 items-center z-30 select-none backdrop-blur-md">
        <button
          onClick={() => setActiveTab('BOOK')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'BOOK' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span className="text-[10px] mt-1">اطلب مشوار</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'HISTORY' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span className="text-[10px] mt-1">رحلاتي</span>
        </button>

        <button
          onClick={() => setActiveTab('WALLET')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'WALLET' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span className="text-[10px] mt-1">المحفظة</span>
        </button>

        <button
          onClick={() => setActiveTab('SUPPORT')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'SUPPORT' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span className="text-[10px] mt-1">حسابي</span>
        </button>
      </nav>

      {/* ================= IN-APP CHAT DRAWER ================= */}
      {showChat && (
        <div className="absolute inset-0 bg-slate-950/90 z-50 flex flex-col backdrop-blur-md animate-in fade-in duration-150">
          <header className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-100">
                محادثة مع الكابتن ({activeRide?.driverName || 'الكابتن'})
              </span>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {chatMessages.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                ابدأ المحادثة مع الكابتن لتوضيح موقعك أو أي تفاصيل خاصة بالمشوار
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.senderRole === 'CUSTOMER' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs ${
                      msg.senderRole === 'CUSTOMER'
                        ? 'bg-emerald-500 text-slate-950 font-medium rounded-bl-sm'
                        : 'bg-slate-800 text-slate-100 rounded-br-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-0.5">
                    {new Date(msg.timestamp).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="اكتب رسالة للكابتن..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 text-xs text-slate-100 outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="min-h-[40px] min-w-[40px] rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
        </div>
      )}

      {/* ================= CANCEL MODAL ================= */}
      {showCancelModal && (
        <div className="absolute inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3.5 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">تأكيد إلغاء المشوار</h3>
            <p className="text-xs text-slate-400">يرجى تحديد سبب الإلغاء لمساعدتنا في تحسين الخدمة:</p>

            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 outline-none"
            >
              <option value="تغيير الخطط">تغيير الخطط الشخصية</option>
              <option value="الكابتن بعيد جداً">الكابتن استغرق وقتاً طويلاً</option>
              <option value="تم العثور على وسيلة أخرى">وجدت وسيلة مواصلات أخرى</option>
              <option value="خطأ في تحديد العنوان">خطأ في تحديد العنوان</option>
            </select>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleConfirmCancel}
                className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                تأكيد الإلغاء
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 h-10 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SOS EMERGENCY MODAL ================= */}
      {showSOSModal && (
        <div className="absolute inset-0 bg-rose-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-slate-950 border-2 border-rose-500 rounded-3xl p-5 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-600/30 text-rose-400 mx-auto flex items-center justify-center border-2 border-rose-500 animate-pulse">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-rose-200">زر الطوارئ SOS</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              عند الضغط، سيتم إرسال إحداثيات موقعك الفعلي فوراً لغرفة طوارئ مشوار وإبلاغ جهات المساعدة.
            </p>

            {sosSent ? (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-xs text-emerald-300 font-bold">
                تم استلام بلاغ الطوارئ وجاري المتابعة الآن!
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleConfirmSOS}
                  className="w-full h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-lg shadow-rose-600/40"
                >
                  إرسال نداء استغاثة الآن!
                </button>
                <button
                  onClick={() => setShowSOSModal(false)}
                  className="w-full h-10 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
                >
                  إلغاء التنبيه
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= PHONE AUTHENTICATION MODAL ================= */}
      {showAuthModal && (
        <div className="absolute inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3.5 shadow-2xl relative">
            <button
              onClick={() => {
                setShowAuthModal(false);
                setAuthStep('PHONE');
                setAuthMessage(null);
              }}
              className="absolute top-4 left-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">تسجيل الدخول برقم الهاتف</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Firebase Phone OTP Authentication</p>
            </div>

            {authStep === 'PHONE' ? (
              <form onSubmit={handleSendOTP} className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">رقم الهاتف اليمني (77 / 78 / 73 / 71)</label>
                  <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2">
                    <span className="text-xs text-slate-400 font-mono pl-2 border-l border-slate-800 ml-2">
                      +967
                    </span>
                    <input
                      type="tel"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="771234567"
                      className="bg-transparent flex-1 text-xs text-slate-100 font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  إرسال رمز التحقق SMS
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    أدخل رمز التحقق المكون من 6 أرقام
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={authOtp}
                    onChange={(e) => setAuthOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center tracking-widest text-base font-mono font-bold bg-slate-950 border border-slate-700 rounded-xl py-2 text-emerald-400 outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  تأكيد الدخول
                </button>
              </form>
            )}

            {authMessage && (
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-emerald-400 text-center">
                {authMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SEARCH LOCATION MODAL (PICKUP / DESTINATION) ================= */}
      {showLocationModal && (
        <div className="absolute inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => {
                setShowLocationModal(null);
                setLocationSearchQuery('');
              }}
              className="absolute top-4 left-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-right">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                <span>
                  {showLocationModal === 'pickup' ? 'البحث عن موقع الانطلاق' : 'البحث عن مكان الوصول'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ابحث عن أي شارع، جولة، معلم، أو منطقة في صنعاء
              </p>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700/80 rounded-2xl px-3 py-2.5">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={locationSearchQuery}
                onChange={(e) => setLocationSearchQuery(e.target.value)}
                placeholder="اكتب اسم الموقع (مثلاً: حدة، التحرير، السبعين...)"
                className="bg-transparent flex-1 text-xs text-slate-100 outline-none"
              />
              {locationSearchQuery && (
                <button
                  type="button"
                  onClick={() => setLocationSearchQuery('')}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[160px] max-h-[300px] pr-0.5">
              {locationService.searchLocations(locationSearchQuery).length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  لا توجد نتائج مطابقة لبحثك. يمكنك استخدام "تعديل يدوي" لكتابة اسم الموقع بحرية.
                </div>
              ) : (
                locationService.searchLocations(locationSearchQuery).map((loc) => (
                  <button
                    key={loc.addressName}
                    type="button"
                    onClick={() => handleSelectSearchedLocation(loc)}
                    className="w-full text-right p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 hover:border-emerald-500/40 flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-400 flex items-center justify-center transition-colors">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                          {loc.addressName}
                        </div>
                        {loc.landmark && (
                          <div className="text-[10px] text-slate-400">{loc.landmark}</div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </button>
                ))
              )}
            </div>

            {/* Quick action button to use current GPS if pickup */}
            {showLocationModal === 'pickup' && (
              <button
                type="button"
                onClick={() => {
                  setShowLocationModal(null);
                  handleRealGPSClick();
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Compass className="w-4 h-4" />
                <span>استخدام موقعي الحالي عبر GPS</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================= MANUAL EDIT MODAL (PICKUP / DESTINATION) ================= */}
      {showManualEditModal && (
        <div className="absolute inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => {
                setShowManualEditModal(null);
                setManualInputName('');
              }}
              className="absolute top-4 left-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-right">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <span>
                  {showManualEditModal === 'pickup' ? 'تعديل موقع الانطلاق يدويًا' : 'تعديل مكان الوصول يدويًا'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                يمكنك كتابة العنوان المخصص بدقة لتوجيه الكابتن
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 block font-medium">اسم أو وصف الموقع:</label>
              <input
                type="text"
                autoFocus
                value={manualInputName}
                onChange={(e) => setManualInputName(e.target.value)}
                placeholder="مثال: أمام سوبرماركت الهدى، شارع حدة"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-medium outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveManualEdit}
                className="flex-1 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                حفظ التعديل
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowManualEditModal(null);
                  setManualInputName('');
                }}
                className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
