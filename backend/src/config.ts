import dotenv from 'dotenv';

dotenv.config();

export type BackendMode = 'demo' | 'staging' | 'pilot' | 'production';

const normalizeMode = (value?: string): BackendMode => {
  const normalized = (value || 'demo').toLowerCase();
  if (normalized === 'staging' || normalized === 'pilot' || normalized === 'production') return normalized;
  return 'demo';
};

const toBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

export const backendConfig = {
  mode: normalizeMode(process.env.APP_MODE || process.env.APP_ENV || process.env.DATA_MODE),
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4000,
  apiToken: process.env.API_TOKEN || '',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '',
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  firebasePrivateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  useRealDatabase: toBool(process.env.USE_REAL_DATABASE, false),
  useRealAuth: toBool(process.env.USE_REAL_AUTH, false),
  useRealPayment: false
};

export const isDemoBackend = (): boolean => backendConfig.mode === 'demo' || backendConfig.nodeEnv === 'development';
export const isStrictBackend = (): boolean => backendConfig.mode === 'pilot' || backendConfig.mode === 'staging' || backendConfig.mode === 'production';
