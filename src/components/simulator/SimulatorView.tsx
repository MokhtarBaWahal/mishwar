import React from 'react';
import { CustomerAppView } from '../customer/CustomerAppView';
import { DriverAppView } from '../driver/DriverAppView';
import { useMishwar } from '../../context/MishwarContext';
import { Smartphone, Zap, Radio, Bell, ArrowRight, ArrowLeftRight, CheckCircle2 } from 'lucide-react';

export const SimulatorView: React.FC = () => {
  const { activeRide, incomingRequest, setCurrentView } = useMishwar();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-3 lg:p-5 select-none font-['Cairo',sans-serif]">
      {/* Simulation Info Bar */}
      <div className="mb-3 bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-100">محاكي منصة مشوار المزدوج المباشر</h3>
              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-800/60">
                Live Dual Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              شاهد تفاعل العميل مع الكابتن في نفس اللحظة: عند طلب مشوار من الهاتف الأيمن يصل فوراً لهاتف الكابتن الأيسر
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeRide ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-300 font-bold">
                حالة المشوار:{' '}
                {activeRide.status === 'SEARCHING_DRIVER'
                  ? 'جاري البحث عن كابتن'
                  : activeRide.status === 'DRIVER_ASSIGNED'
                  ? 'تم تعيين الكابتن'
                  : activeRide.status === 'DRIVER_ARRIVED'
                  ? 'وصل الكابتن'
                  : activeRide.status === 'TRIP_STARTED'
                  ? 'المشوار جاري الآن'
                  : 'مكتمل'}
              </span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>النظام جاهز لاستقبال مشوار جديد</span>
            </div>
          )}

          <button
            onClick={() => setCurrentView('ADMIN')}
            className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
          >
            <span>لوحة الإدارة</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Side-by-side Dual Mobile Phone Devices */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 lg:gap-10 overflow-y-auto pb-4">
        {/* Device 1: Customer Phone */}
        <div className="flex flex-col items-center">
          <div className="mb-2 text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>هاتف الراكب (Customer App)</span>
          </div>

          {/* Smartphone Frame */}
          <div className="w-[360px] h-[720px] bg-slate-950 border-[5px] border-slate-800 rounded-[44px] shadow-2xl overflow-hidden relative flex flex-col ring-8 ring-slate-900/60 transition-transform">
            {/* Dynamic Island Notch */}
            <div className="absolute top-2 inset-x-0 flex justify-center z-30 pointer-events-none">
              <div className="w-28 h-4 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center gap-1.5 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-slate-950 border border-slate-800" />
                <div className="w-7 h-1 bg-slate-800 rounded-full" />
              </div>
            </div>

            <div className="flex-1 overflow-hidden pt-3">
              <CustomerAppView />
            </div>
          </div>
        </div>

        {/* Central Sync Bridge Icon on Desktop */}
        <div className="hidden lg:flex flex-col items-center justify-center gap-2 text-slate-500">
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-md">
            <ArrowLeftRight className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-semibold">WebSockets / Bus</span>
        </div>

        {/* Device 2: Driver Phone */}
        <div className="flex flex-col items-center">
          <div className="mb-2 text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-sky-400" />
            <span>هاتف الكابتن (Driver App)</span>
          </div>

          {/* Smartphone Frame */}
          <div className="w-[360px] h-[720px] bg-slate-950 border-[5px] border-slate-800 rounded-[44px] shadow-2xl overflow-hidden relative flex flex-col ring-8 ring-slate-900/60 transition-transform">
            {/* Dynamic Island Notch */}
            <div className="absolute top-2 inset-x-0 flex justify-center z-30 pointer-events-none">
              <div className="w-28 h-4 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center gap-1.5 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-slate-950 border border-slate-800" />
                <div className="w-7 h-1 bg-slate-800 rounded-full" />
              </div>
            </div>

            <div className="flex-1 overflow-hidden pt-3">
              <DriverAppView />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
