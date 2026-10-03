import React, { useState } from 'react';
import { useMishwar } from '../../context/MishwarContext';
import { InteractiveMap } from '../common/InteractiveMap';
import { formatCurrency } from '../../../packages/shared_utils/src';
import { VehicleType } from '../../../packages/shared_types/src';
import {
  Power,
  Navigation,
  Star,
  DollarSign,
  TrendingUp,
  MapPin,
  Check,
  X,
  Phone,
  MessageSquare,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ChevronRight,
  Clock,
  Car,
  Bike,
  Compass,
  UserPlus,
  LogIn,
  KeyRound,
  ShieldAlert,
  Wallet,
  ArrowUpRight,
  Send,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const DriverAppView: React.FC = () => {
  const {
    currentDriver,
    setCurrentDriver,
    drivers,
    toggleDriverOnline,
    activeRide,
    activeDriverPosition,
    incomingRequest,
    incomingTimeoutSecs,
    acceptIncomingRide,
    declineIncomingRide,
    driverArrived,
    startTrip,
    completeTrip,
    cancelActiveRide,
    triggerSOS,
    createSafetyReport,
    blockRideUser,
    chatMessages,
    sendChatMessage,
    getCurrentDeviceLocation,
    loginWithPhone,
    registerDriverOnboarding,
    appMode,
    selectedCity
  } = useMishwar();

  const [activeTab, setActiveTab] = useState<'HOME' | 'EARNINGS' | 'DOCS' | 'PROFILE'>('HOME');
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication Dialog
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPhone, setAuthPhone] = useState('774112334');
  const [authOtp, setAuthOtp] = useState('');
  const [authStep, setAuthStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // Driver Onboarding Form Modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('77');
  const [regType, setRegType] = useState<VehicleType>('MOTORCYCLE');
  const [regMake, setRegMake] = useState('Haojue');
  const [regModel, setRegModel] = useState('HJ150');
  const [regPlate, setRegPlate] = useState('صنعاء 99881/د');
  const [regColor, setRegColor] = useState('أسود');
  const [regStatusMessage, setRegStatusMessage] = useState<string | null>(null);

  const isOnline = currentDriver.driverStatus === 'ONLINE' || currentDriver.driverStatus === 'IN_RIDE';
  const isPendingApproval = currentDriver.driverStatus === 'PENDING_APPROVAL';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput, 'DRIVER');
    setChatInput('');
  };

  const handleDriverSafetyReport = () => {
    createSafetyReport({
      reporterRole: 'DRIVER',
      category: 'NO_SHOW',
      description: 'بلاغ سلامة/تشغيل من الكابتن أثناء الرحلة',
      severity: 'MEDIUM'
    });
    showToast('تم إرسال البلاغ إلى مركز العمليات');
  };

  const handleBlockPassenger = () => {
    blockRideUser('CUSTOMER', 'طلب الكابتن عدم المطابقة مع هذا الراكب مرة أخرى');
    showToast('تم حظر الراكب لهذا الكابتن وإرساله للمراجعة');
  };

  const handleRealGPSClick = async () => {
    setIsLocatingGPS(true);
    await getCurrentDeviceLocation();
    setIsLocatingGPS(false);
    showToast('تم تحديث موقع الكابتن عبر GPS');
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthStep('OTP');
    setAuthMessage('تم إرسال رمز التحقق (رمز الاختبار: 123456)');
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await loginWithPhone(authPhone, authOtp, 'DRIVER');
    if (res.success) {
      setShowAuthModal(false);
      setAuthStep('PHONE');
      setAuthOtp('');
      setAuthMessage(null);
      showToast('تم تسجيل دخول الكابتن بنجاح');
    } else {
      setAuthMessage(res.message);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await registerDriverOnboarding({
      fullName: regName,
      phoneNumber: regPhone,
      vehicleType: regType,
      make: regMake,
      model: regModel,
      plateNumber: regPlate,
      color: regColor
    });
    setRegStatusMessage(res.message);
    if (res.success) {
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegStatusMessage(null);
        showToast('تم إرسال طلب انضمام الكابتن للإدارة');
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden relative font-['Cairo',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-14 inset-x-3 z-50 p-2.5 bg-emerald-950/95 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 text-center shadow-lg backdrop-blur-md animate-in fade-in duration-200">
          {toastMessage}
        </div>
      )}

      {/* Driver Header */}
      <header className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between z-20 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/80 overflow-hidden flex items-center justify-center font-bold text-slate-300"
              title="ملف الكابتن"
            >
              {currentDriver.avatarUrl ? (
                <img
                  src={currentDriver.avatarUrl}
                  alt={currentDriver.fullName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{currentDriver.fullName.charAt(0)}</span>
              )}
            </button>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                isOnline ? 'bg-emerald-500' : isPendingApproval ? 'bg-amber-500' : 'bg-slate-500'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-slate-100 leading-tight">{currentDriver.fullName}</h2>
              <span className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded font-medium">
                {currentDriver.vehicle?.type === 'MOTORCYCLE' ? 'دراجة' : 'سيارة'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="flex items-center gap-0.5 text-amber-400">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{currentDriver.ratingAverage}</span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 font-mono text-[10px]">{currentDriver.vehicle?.plateNumber}</span>
            </div>
          </div>
        </div>

        {/* Quick Online Switch / Login */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="h-8 px-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-colors"
            title="تسجيل كابتن جديد"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">انضم ككابتن</span>
          </button>
        </div>
      </header>

      {/* Main Tab View */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* ================= TAB 1: HOME (MAP & DISPATCH) ================= */}
        {activeTab === 'HOME' && (
          <div className="flex-1 relative flex flex-col overflow-hidden">
            {/* Map Canvas */}
            <div className="flex-1 relative">
              <InteractiveMap
                center={{ lat: selectedCity.center.latitude, lng: selectedCity.center.longitude }}
                pickup={activeRide?.pickup || null}
                destination={activeRide?.destination || null}
                driverPosition={activeDriverPosition}
                vehicleType={currentDriver.vehicle?.type || 'CAR'}
                interactive={false}
              />

              {/* Floating Real GPS button */}
              <button
                onClick={handleRealGPSClick}
                disabled={isLocatingGPS}
                className="absolute top-3 left-3 z-10 h-10 px-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 rounded-2xl shadow-xl flex items-center gap-1.5 text-xs text-slate-200 backdrop-blur-md transition-all active:scale-95"
                title="تحديث موقع الكابتن الحالي"
              >
                <Compass className={`w-4 h-4 text-emerald-400 ${isLocatingGPS ? 'animate-spin' : ''}`} />
                <span className="text-[11px] font-bold">{isLocatingGPS ? 'تحديد...' : 'موقعي GPS'}</span>
              </button>

              {/* Offline Warning Banner Over Map */}
              {!isOnline && !activeRide && (
                <div className="absolute top-3 inset-x-12 z-10 p-2 bg-slate-950/90 border border-slate-800 rounded-2xl text-center text-xs text-slate-300 backdrop-blur-md shadow-lg">
                  أنت في وضع غير متصل الآن · لن تستقبل طلبات جديدة
                </div>
              )}
            </div>

            {/* Bottom Driver Control Panel */}
            <div className="bg-slate-900/95 border-t border-slate-800 rounded-t-3xl shadow-2xl p-4 backdrop-blur-md z-20 space-y-3">
              {/* Drag Handle Bar */}
              <div className="w-10 h-1 bg-slate-700/80 rounded-full mx-auto" />

              {/* STATE 1: IDLE - Big Online/Offline Toggle & Daily Performance */}
              {!activeRide && (
                <div className="space-y-3">
                  {/* Big Tactile Online Toggle Button */}
                  <button
                    onClick={() => {
                      toggleDriverOnline(currentDriver.id);
                      showToast(isOnline ? 'تم التحويل إلى غير متصل' : 'أنت متصل الآن - جاهز لاستقبال الطلبات!');
                    }}
                    className={`w-full h-14 rounded-2xl flex items-center justify-between px-5 font-bold text-sm shadow-lg transition-all active:scale-[0.98] ${
                      isOnline
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isOnline ? 'bg-slate-950 text-emerald-400' : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <div className="leading-tight">{isOnline ? 'أنت متصل الآن' : 'أنت غير متصل'}</div>
                        <div className="text-[10px] opacity-80 font-normal">
                          {isOnline ? 'جاهز لاستقبال طلبات مشوار في صنعاء' : 'اضغط للاتصال وبدء استقبال المشاوير'}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-xl font-mono font-bold ${
                        isOnline ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {isOnline ? 'متاح' : 'مغلق'}
                    </span>
                  </button>

                  {/* Daily Driver Metrics Strip */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-2.5">
                      <div className="text-[10px] text-slate-400 mb-0.5">أرباح اليوم</div>
                      <div className="text-xs font-bold text-emerald-400 font-mono tabular-nums">
                        {formatCurrency(currentDriver.todayEarnings)}
                      </div>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-2.5">
                      <div className="text-[10px] text-slate-400 mb-0.5">الرحلات المكتملة</div>
                      <div className="text-xs font-bold text-slate-100 font-mono tabular-nums">
                        {currentDriver.todayTripsCount} مشوار
                      </div>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-2.5">
                      <div className="text-[10px] text-slate-400 mb-0.5">نسبة القبول</div>
                      <div className="text-xs font-bold text-sky-400 font-mono tabular-nums">98%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 2: ACTIVE RIDE IN PROGRESS - Step by Step Flow */}
              {activeRide && (
                <div className="space-y-3">
                  {/* Active Ride Stage Header */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center font-bold text-slate-200 overflow-hidden">
                        {activeRide.customerAvatar ? (
                          <img
                            src={activeRide.customerAvatar}
                            alt={activeRide.customerName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          activeRide.customerName.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">{activeRide.customerName}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{activeRide.customerRating}</span>
                          <span>·</span>
                          <span className="text-emerald-400 font-semibold font-mono">
                            {formatCurrency(activeRide.fare.grossFare)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Actions for Driver */}
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${activeRide.customerPhone || '771234567'}`}
                        className="min-h-[40px] min-w-[40px] rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center"
                        title="اتصال هاتفي بالراكب"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => setShowChat(true)}
                        className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center relative"
                        title="محادثة الراكب"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {chatMessages.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Route Target Info */}
                  <div className="bg-slate-950/60 rounded-xl p-2.5 text-xs space-y-1.5 border border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-[10px] text-slate-400 shrink-0">نقطة الالتقاط:</span>
                      <span className="text-slate-200 font-semibold truncate">{activeRide.pickup.addressName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                      <span className="text-[10px] text-slate-400 shrink-0">الوجهة:</span>
                      <span className="text-slate-200 font-semibold truncate">{activeRide.destination.addressName}</span>
                    </div>
                  </div>

                  {/* ONE MAIN ACTION: Context-Aware Progression Button */}
                  {activeRide.status === 'DRIVER_ASSIGNED' && (
                    <button
                      onClick={() => {
                        driverArrived();
                        showToast('تم إشعار الراكب بوصولك إلى الموقع');
                      }}
                      className="w-full h-13 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>وصلت إلى موقع الراكب</span>
                    </button>
                  )}

                  {activeRide.status === 'DRIVER_ARRIVED' && (
                    <button
                      onClick={() => {
                        startTrip();
                        showToast('بدأ المشوار! تمنياتنا برحلة آمنة');
                      }}
                      className="w-full h-13 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>بدء المشوار الآن</span>
                    </button>
                  )}

                  {activeRide.status === 'TRIP_STARTED' && (
                    <button
                      onClick={() => {
                        completeTrip();
                        showToast('تم إنهاء المشوار بنجاح وإضافة الأرباح لمحفظتك');
                      }}
                      className="w-full h-13 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>إنهاء المشوار وتأكيد استلام المبلغ</span>
                    </button>
                  )}

                  {/* Emergency SOS & Cancel options */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      onClick={() => setShowSOSModal(true)}
                      className="flex-1 h-9 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-600/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>SOS طوارئ الكابتن</span>
                    </button>
                    <button
                      onClick={() => {
                        cancelActiveRide('إلغاء من طرف الكابتن لظرف طارئ', 'DRIVER');
                        showToast('تم إلغاء الرحلة');
                      }}
                      className="h-9 px-3 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold"
                    >
                      إلغاء المشوار
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDriverSafetyReport}
                      className="h-9 rounded-xl bg-amber-950/60 hover:bg-amber-900/70 border border-amber-600/30 text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>بلاغ سلامة</span>
                    </button>
                    <button
                      onClick={handleBlockPassenger}
                      className="h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold flex items-center justify-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>حظر الراكب</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: EARNINGS & WALLET ================= */}
        {activeTab === 'EARNINGS' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Earnings Hero Card */}
            <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-3xl p-5 text-center relative overflow-hidden shadow-lg">
              <div className="text-xs text-slate-400 mb-1">صافي أرباح الكابتن المتاحة</div>
              <div className="text-3xl font-black text-slate-100 font-mono tabular-nums tracking-tight">
                {formatCurrency(currentDriver.walletBalance)}
              </div>
              <div className="mt-2 text-xs text-emerald-400 font-semibold font-mono">
                أرباح اليوم: {formatCurrency(currentDriver.todayEarnings)}
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
                <div className="text-[11px] text-slate-400">إجمالي المشاوير المكتملة</div>
                <div className="text-lg font-bold text-slate-100 font-mono mt-1">
                  {currentDriver.todayTripsCount} مشوار اليوم
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
                <div className="text-[11px] text-slate-400">تقييم الكابتن</div>
                <div className="text-lg font-bold text-amber-400 font-mono mt-1 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{currentDriver.ratingAverage}</span>
                </div>
              </div>
            </div>

            {/* Platform Commission Terms */}
            <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs space-y-2">
              <div className="font-bold text-slate-200">عمولة مشوار الشفافة:</div>
              <div className="text-slate-400 leading-relaxed text-[11px]">
                عمولة المنصة هي 15% فقط على رحلات السيارات و 12% على رحلات الدراجات النارية. يتم تسوية المبالغ
                النقدية عبر محفظة الكريمي أو نقداً أسبوعياً.
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: DOCUMENTS & VERIFICATION ================= */}
        {activeTab === 'DOCS' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            <h3 className="text-sm font-bold text-slate-100">وثائق الكابتن والمركبة</h3>

            <div className="space-y-2.5">
              {/* National ID */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">البطاقة الشخصية / جواز السفر</div>
                    <div className="text-[10px] text-emerald-400 font-semibold">معتمدة ومفحوصة أمنياً</div>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-lg font-bold">
                  سارية
                </span>
              </div>

              {/* Driving License */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">رخصة القيادة اليمنية</div>
                    <div className="text-[10px] text-emerald-400 font-semibold">فئة خاصة / دراجة</div>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-lg font-bold">
                  سارية
                </span>
              </div>

              {/* Vehicle Registration */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">كرت تسجيل المركبة (الملكية)</div>
                    <div className="text-[10px] text-slate-400">لوحة: {currentDriver.vehicle?.plateNumber}</div>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-lg font-bold">
                  سارية
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: PROFILE ================= */}
        {activeTab === 'PROFILE' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 text-lg">
                  {currentDriver.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100">{currentDriver.fullName}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{currentDriver.phoneNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-xs text-emerald-400 font-semibold hover:underline"
              >
                تبديل الحساب
              </button>
            </div>

            {/* Vehicle Details */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
              <h4 className="font-bold text-slate-200">بيانات المركبة المسجلة:</h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-950 p-2 rounded-xl">
                  <span className="text-slate-400 block">الموديل</span>
                  <span className="text-slate-100 font-semibold">
                    {currentDriver.vehicle?.make} {currentDriver.vehicle?.model}
                  </span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl">
                  <span className="text-slate-400 block">رقم اللوحة</span>
                  <span className="text-slate-100 font-semibold">{currentDriver.vehicle?.plateNumber}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl">
                  <span className="text-slate-400 block">اللون</span>
                  <span className="text-slate-100 font-semibold">{currentDriver.vehicle?.color}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl">
                  <span className="text-slate-400 block">سنة الصنع</span>
                  <span className="text-slate-100 font-semibold">{currentDriver.vehicle?.year}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Driver Bottom Navigation Bar */}
      <nav className="h-14 bg-slate-900/95 border-t border-slate-800/90 grid grid-cols-4 items-center z-30 select-none backdrop-blur-md">
        <button
          onClick={() => setActiveTab('HOME')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'HOME' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span className="text-[10px] mt-1">الرئيسية</span>
        </button>

        <button
          onClick={() => setActiveTab('EARNINGS')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'EARNINGS' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span className="text-[10px] mt-1">الأرباح</span>
        </button>

        <button
          onClick={() => setActiveTab('DOCS')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'DOCS' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="text-[10px] mt-1">المستندات</span>
        </button>

        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'PROFILE' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span className="text-[10px] mt-1">الملف</span>
        </button>
      </nav>

      {/* ================= URGENT INCOMING RIDE REQUEST MODAL ================= */}
      {incomingRequest && (
        <div className="absolute inset-0 bg-slate-950/90 z-50 flex items-end sm:items-center justify-center p-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-emerald-500 rounded-3xl p-5 space-y-4 shadow-2xl relative overflow-hidden">
            {/* Countdown Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="text-sm font-black text-slate-100">طلب مشوار جديد وارد!</h3>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center border border-emerald-500/50">
                {incomingTimeoutSecs}
              </div>
            </div>

            {/* Ride Details Summary */}
            <div className="bg-slate-950/80 rounded-2xl p-3.5 space-y-2 border border-slate-800 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">صافي أرباح الكابتن:</span>
                <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                  {formatCurrency(incomingRequest.fare.driverNetEarnings)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-slate-400 shrink-0">الالتقاط:</span>
                <span className="font-semibold truncate">{incomingRequest.pickup.addressName}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                <span className="text-slate-400 shrink-0">الوجهة:</span>
                <span className="font-semibold truncate">{incomingRequest.destination.addressName}</span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 flex justify-between">
                <span>المسافة الإجمالية:</span>
                <span className="text-slate-200 font-mono font-bold">{incomingRequest.fare.distanceKm} كم</span>
              </div>
            </div>

            {/* Giant Accept & Decline Buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => {
                  acceptIncomingRide();
                  showToast('تم قبول الطلب! توجه الآن لموقع الراكب');
                }}
                className="flex-1 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>قبول المشوار</span>
              </button>
              <button
                onClick={() => {
                  declineIncomingRide();
                  showToast('تم رفض الطلب');
                }}
                className="h-14 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-xs transition-colors"
              >
                رفض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DRIVER SOS MODAL ================= */}
      {showSOSModal && (
        <div className="absolute inset-0 bg-rose-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-slate-950 border-2 border-rose-500 rounded-3xl p-5 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-600/30 text-rose-400 mx-auto flex items-center justify-center border-2 border-rose-500 animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-rose-200">طوارئ الكابتن SOS</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              إرسال استغاثة فورية لغرفة عمليات مشوار وإشعار الدوريات الأمنية بموقعك المباشر.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  triggerSOS('DRIVER');
                  setShowSOSModal(false);
                  showToast('تم إرسال استغاثة الكابتن لمركز العمليات');
                }}
                className="w-full h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-lg shadow-rose-600/40"
              >
                تأكيد إرسال الاستغاثة
              </button>
              <button
                onClick={() => setShowSOSModal(false)}
                className="w-full h-10 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DRIVER ONBOARDING MODAL ================= */}
      {showRegisterModal && (
        <div className="absolute inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3.5 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center">
              <h3 className="text-sm font-bold text-slate-100">انضم ككابتن في أسطول مشوار</h3>
              <p className="text-[11px] text-slate-400">سجل سيارتك أو دراجتك النارية وابدأ العمل فوراً</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-2.5 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">الاسم الثلاثي للكابتن</label>
                <input
                  type="text"
                  required
                  placeholder="محمد علي الأهدل"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">رقم الهاتف (يمن موبايل / YOU / سبأفون)</label>
                <input
                  type="tel"
                  required
                  placeholder="77XXXXXXXX"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">نوع المركبة</label>
                  <select
                    value={regType}
                    onChange={(e) => setRegType(e.target.value as VehicleType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200 outline-none"
                  >
                    <option value="MOTORCYCLE">دراجة نارية</option>
                    <option value="CAR">سيارة</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">رقم اللوحة</label>
                  <input
                    type="text"
                    required
                    placeholder="صنعاء 12345/د"
                    value={regPlate}
                    onChange={(e) => setRegPlate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-slate-100 outline-none"
                  />
                </div>
              </div>

              {regStatusMessage && (
                <div className="p-2 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-[10px] text-emerald-300 text-center font-bold">
                  {regStatusMessage}
                </div>
              )}

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md mt-2 transition-all"
              >
                تقديم طلب التسجيل
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= DRIVER PHONE AUTH MODAL ================= */}
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
              <h3 className="text-sm font-bold text-slate-100">تسجيل دخول الكابتن</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Firebase Phone OTP Authentication</p>
            </div>

            {authStep === 'PHONE' ? (
              <form onSubmit={handleSendOTP} className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">رقم هاتف الكابتن المسجل</label>
                  <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2">
                    <span className="text-xs text-slate-400 font-mono pl-2 border-l border-slate-800 ml-2">
                      +967
                    </span>
                    <input
                      type="tel"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="774112334"
                      className="bg-transparent flex-1 text-xs text-slate-100 font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  إرسال كود التحقق
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    أدخل كود التحقق (كود الاختبار: 123456)
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
                  تأكيد ودخول الحساب
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
    </div>
  );
};
