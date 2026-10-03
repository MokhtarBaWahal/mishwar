import React, { useEffect, useState } from 'react';
import { useMishwar } from '../../context/MishwarContext';
import {
  Smartphone,
  LayoutDashboard,
  Zap,
  Globe,
  Bike,
  ShieldAlert,
  Rocket,
  MapPin,
  Users,
  ChevronDown,
  UserCheck,
  Bell,
  Server,
  Wifi,
  WifiOff
} from 'lucide-react';
import { appConfig } from '../../config/appConfig';

type ApiStatus = 'CHECKING' | 'ONLINE' | 'OFFLINE';

const getHealthUrl = (): string => {
  const apiBaseUrl = appConfig.apiBaseUrl || 'http://localhost:4000/api';
  return `${apiBaseUrl.replace(/\/api\/?$/, '')}/health`;
};

export const TopNavHub: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    lang,
    setLang,
    sosAlerts,
    appMode,
    cities,
    selectedCity,
    setSelectedCity,
    demoAccounts,
    switchDemoAccount,
    currentCustomer,
    currentDriver,
    unreadNotifCount
  } = useMishwar();

  const [showAccountsMenu, setShowAccountsMenu] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('CHECKING');
  const [apiLatencyMs, setApiLatencyMs] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkApiHealth = async () => {
      const startedAt = performance.now();
      try {
        const response = await fetch(getHealthUrl(), { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (!isMounted) return;
        setApiStatus('ONLINE');
        setApiLatencyMs(Math.round(performance.now() - startedAt));
      } catch {
        if (!isMounted) return;
        setApiStatus('OFFLINE');
        setApiLatencyMs(null);
      }
    };

    checkApiHealth();
    const intervalId = window.setInterval(checkApiHealth, 20000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-3 lg:px-6 flex items-center justify-between z-40 shrink-0 select-none relative font-['Cairo',sans-serif]">
      {/* Brand & Identity */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setCurrentView('SIMULATOR')}
          title="العودة للمحاكي الرئيسي"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-base shadow-md shadow-emerald-500/20">
            مـ
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-wide text-slate-100">مشـوار</span>
              <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-800/60">
                MISHWAR
              </span>
            </div>
            <span className="text-[9px] text-slate-400 hidden md:block">منصة النقل الذكي في اليمن</span>
          </div>
        </div>

        {/* City Selector */}
        <div className="hidden lg:flex items-center bg-slate-950 border border-slate-800 px-2 py-1 rounded-xl text-xs text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 ml-1" />
          <select
            value={selectedCity.id}
            onChange={(e) => {
              const found = cities.find((c) => c.id === e.target.value);
              if (found) setSelectedCity(found);
            }}
            className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
          >
            {cities.map((city) => (
              <option key={city.id} value={city.id} className="bg-slate-900 text-slate-200">
                {city.nameAr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main View Switcher Pills */}
      <div className="flex items-center bg-slate-950/80 border border-slate-800 p-1 rounded-2xl gap-1">
        <button
          onClick={() => setCurrentView('SIMULATOR')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            currentView === 'SIMULATOR'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">المحاكي المزدوج</span>
        </button>

        <button
          onClick={() => setCurrentView('CUSTOMER')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all relative ${
            currentView === 'CUSTOMER'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>العميل</span>
          {unreadNotifCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1" />
          )}
        </button>

        <button
          onClick={() => setCurrentView('DRIVER')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            currentView === 'DRIVER'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>الكابتن</span>
        </button>

        <button
          onClick={() => setCurrentView('ADMIN')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            currentView === 'ADMIN'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">الإدارة</span>
        </button>
      </div>

      {/* Right controls: Demo Accounts, Mode Switcher & Language */}
      <div className="flex items-center gap-2">
        <div
          className={`hidden xl:flex h-8 items-center gap-2 rounded-xl border px-2.5 text-[11px] font-bold ${
            apiStatus === 'ONLINE'
              ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
              : apiStatus === 'CHECKING'
              ? 'border-amber-500/40 bg-amber-950/30 text-amber-300'
              : 'border-rose-500/40 bg-rose-950/40 text-rose-300'
          }`}
          title={`API: ${getHealthUrl()}`}
        >
          <Server className="h-3.5 w-3.5" />
          {apiStatus === 'ONLINE' ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          <span>
            {apiStatus === 'ONLINE'
              ? `API متصل${apiLatencyMs !== null ? ` · ${apiLatencyMs}ms` : ''}`
              : apiStatus === 'CHECKING'
              ? 'فحص API'
              : 'API غير متصل'}
          </span>
        </div>

        <div className="hidden lg:flex h-8 items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/70 px-2.5 text-[11px] font-bold text-slate-300">
          <Rocket className="h-3.5 w-3.5 text-emerald-400" />
          <span className="font-mono text-emerald-300" title={`Configured mode: ${appConfig.mode}`}>
            {appMode} MODE
          </span>
          <span className="font-mono text-slate-500">
            {appConfig.flags.useRealDatabase ? 'REAL DB' : 'MOCK DB'}
          </span>
        </div>

        {/* Demo Accounts Quick Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAccountsMenu(!showAccountsMenu)}
            className="h-8 px-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            title="تبديل حسابات التجربة التجريبية الجاهزة"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">حسابات Demo</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showAccountsMenu && (
            <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 text-right">
              <div className="text-[10px] text-slate-400 font-bold px-2 py-1 mb-1 border-b border-slate-800">
                اختر حساب للتجربة الفورية:
              </div>
              <div className="space-y-1">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      if (acc.role === 'CUSTOMER' || acc.role === 'DRIVER' || acc.role === 'ADMIN') {
                        switchDemoAccount(acc.role, acc.id);
                      }
                      setShowAccountsMenu(false);
                    }}
                    className={`w-full p-2 rounded-xl text-right flex items-center gap-2.5 transition-colors ${
                      (acc.role === 'CUSTOMER' && currentCustomer.id === acc.id) ||
                      (acc.role === 'DRIVER' && currentDriver.id === acc.id)
                        ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                        : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0 text-slate-300 overflow-hidden">
                      {acc.avatarUrl ? (
                        <img src={acc.avatarUrl} alt={acc.name} className="w-full h-full object-cover" />
                      ) : (
                        acc.name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{acc.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{acc.detail}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SOS Alerts Badge */}
        {sosAlerts.filter((a) => a.status === 'ACTIVE').length > 0 && (
          <button
            onClick={() => setCurrentView('ADMIN')}
            className="flex items-center gap-1 bg-rose-600/30 border border-rose-500 text-rose-400 px-2 py-1 rounded-xl text-xs font-bold animate-pulse"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">طوارئ!</span>
          </button>
        )}

        {/* Language Button */}
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs flex items-center gap-1"
          title="تبديل اللغة"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono font-bold">{lang === 'ar' ? 'EN' : 'عربي'}</span>
        </button>
      </div>
    </header>
  );
};
