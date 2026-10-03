import React from 'react';
import { MishwarProvider, useMishwar } from './context/MishwarContext';
import { TopNavHub } from './components/navigation/TopNavHub';
import { SimulatorView } from './components/simulator/SimulatorView';
import { CustomerAppView } from './components/customer/CustomerAppView';
import { DriverAppView } from './components/driver/DriverAppView';
import { AdminDashboardView } from './components/admin/AdminDashboardView';

const AppContent: React.FC = () => {
  const { currentView, lang, platformSettings } = useMishwar();
  const operations = platformSettings.operations;
  const blockingMessage = operations?.forceUpdateRequired
    ? 'يتطلب هذا الإصدار تحديثًا إجباريًا قبل متابعة استخدام مشوار.'
    : operations?.maintenanceMode
    ? operations.maintenanceMessageAr
    : null;

  return (
    <div
      className={`h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-['Cairo',sans-serif] select-none ${
        lang === 'ar' ? 'rtl' : 'ltr'
      }`}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Universal Top Navigation Header */}
      <TopNavHub />

      {blockingMessage && (
        <div className="absolute inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center font-black text-xl mb-4">
              !
            </div>
            <h1 className="text-base font-black text-slate-100 mb-2">
              {operations?.forceUpdateRequired ? 'تحديث إجباري مطلوب' : 'وضع الصيانة مفعل'}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">{blockingMessage}</p>
            {operations?.forceUpdateRequired && (
              <p className="mt-3 text-xs text-slate-500">
                الحد الأدنى: Web {operations.minimumSupportedWebVersion} / Passenger {operations.minimumSupportedPassengerVersion} / Driver {operations.minimumSupportedDriverVersion}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Viewport Container */}
      <div className="flex-1 flex overflow-hidden">
        {currentView === 'SIMULATOR' && <SimulatorView />}
        {currentView === 'CUSTOMER' && (
          <div className="flex-1 flex justify-center bg-slate-950 p-0 sm:p-4 overflow-hidden">
            <div className="w-full max-w-md h-full bg-slate-900 sm:rounded-3xl sm:border sm:border-slate-800 overflow-hidden shadow-2xl">
              <CustomerAppView />
            </div>
          </div>
        )}
        {currentView === 'DRIVER' && (
          <div className="flex-1 flex justify-center bg-slate-950 p-0 sm:p-4 overflow-hidden">
            <div className="w-full max-w-md h-full bg-slate-900 sm:rounded-3xl sm:border sm:border-slate-800 overflow-hidden shadow-2xl">
              <DriverAppView />
            </div>
          </div>
        )}
        {currentView === 'ADMIN' && <AdminDashboardView />}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <MishwarProvider>
      <AppContent />
    </MishwarProvider>
  );
}
