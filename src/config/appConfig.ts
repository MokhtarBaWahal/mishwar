export type AppMode = 'demo' | 'staging' | 'pilot' | 'production';

export interface RuntimeFlags {
  useMockData: boolean;
  useRealDatabase: boolean;
  useRealAuth: boolean;
  useRealGps: boolean;
  useRealMaps: boolean;
  useRealNotifications: boolean;
  useRealPayment: boolean;
  allowDemoOtp: boolean;
  allowDemoAccounts: boolean;
  allowLocalPersistence: boolean;
}

export interface AppConfig {
  mode: AppMode;
  apiBaseUrl: string;
  apiToken: string;
  firebaseProjectId: string;
  googleMapsApiKey: string;
  flags: RuntimeFlags;
}

const getEnv = (): Record<string, string | undefined> => {
  return ((import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {});
};

const toBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const normalizeMode = (value: string | undefined): AppMode => {
  const normalized = (value || 'demo').toLowerCase();
  if (normalized === 'staging' || normalized === 'pilot' || normalized === 'production') {
    return normalized;
  }
  return 'demo';
};

const env = getEnv();
const mode = normalizeMode(env.VITE_APP_MODE || env.APP_MODE || env.DATA_MODE);
const isDemo = mode === 'demo';
const isProduction = mode === 'production';

export const appConfig: AppConfig = {
  mode,
  apiBaseUrl: env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  apiToken: env.VITE_API_TOKEN || '',
  firebaseProjectId: env.VITE_FIREBASE_PROJECT_ID || '',
  googleMapsApiKey: env.VITE_GOOGLE_MAPS_API_KEY || '',
  flags: {
    useMockData: toBool(env.VITE_USE_MOCK_DATA, isDemo),
    useRealDatabase: toBool(env.VITE_USE_REAL_DATABASE, !isDemo),
    useRealAuth: toBool(env.VITE_USE_REAL_AUTH, !isDemo),
    useRealGps: toBool(env.VITE_USE_REAL_GPS, !isDemo),
    useRealMaps: toBool(env.VITE_USE_REAL_MAPS, !isDemo && Boolean(env.VITE_GOOGLE_MAPS_API_KEY)),
    useRealNotifications: toBool(env.VITE_USE_REAL_NOTIFICATIONS, !isDemo),
    useRealPayment: false,
    allowDemoOtp: toBool(env.VITE_ALLOW_DEMO_OTP, isDemo),
    allowDemoAccounts: toBool(env.VITE_ALLOW_DEMO_ACCOUNTS, isDemo),
    allowLocalPersistence: toBool(env.VITE_ALLOW_LOCAL_PERSISTENCE, isDemo)
  }
};

export const assertRuntimeSafety = (): void => {
  if (!isProduction) return;

  const unsafeFlags = [
    appConfig.flags.useMockData && 'VITE_USE_MOCK_DATA',
    appConfig.flags.allowDemoOtp && 'VITE_ALLOW_DEMO_OTP',
    appConfig.flags.allowDemoAccounts && 'VITE_ALLOW_DEMO_ACCOUNTS',
    appConfig.flags.allowLocalPersistence && 'VITE_ALLOW_LOCAL_PERSISTENCE',
    appConfig.flags.useRealPayment && 'VITE_USE_REAL_PAYMENT'
  ].filter(Boolean);

  if (unsafeFlags.length > 0) {
    throw new Error(`Unsafe production configuration: ${unsafeFlags.join(', ')}`);
  }
};

export const isDemoMode = (): boolean => appConfig.mode === 'demo';
export const isPilotLikeMode = (): boolean => appConfig.mode === 'pilot' || appConfig.mode === 'staging' || appConfig.mode === 'production';
