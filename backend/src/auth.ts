import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../../packages/shared_types/src';
import { backendConfig, isStrictBackend } from './config';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    role: UserRole;
    phone?: string;
    email?: string;
  };
}

type FirebaseAdminModule = {
  apps: unknown[];
  app: () => unknown;
  initializeApp: (options: unknown) => unknown;
  credential: {
    cert: (options: { projectId: string; clientEmail: string; privateKey: string }) => unknown;
  };
  auth: (app?: unknown) => {
    verifyIdToken: (token: string) => Promise<Record<string, unknown>>;
  };
};

let firebaseAdminModule: FirebaseAdminModule | null | undefined;

const loadFirebaseAdmin = async (): Promise<FirebaseAdminModule | null> => {
  if (firebaseAdminModule !== undefined) return firebaseAdminModule;
  try {
    const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<{ default?: FirebaseAdminModule } & FirebaseAdminModule>;
    const imported = await dynamicImport('firebase-admin');
    firebaseAdminModule = imported.default || imported;
  } catch {
    firebaseAdminModule = null;
  }
  return firebaseAdminModule;
};

const getFirebaseAdmin = async (): Promise<{ admin: FirebaseAdminModule; app: unknown } | null> => {
  const admin = await loadFirebaseAdmin();
  if (!admin) return null;
  if (admin.apps.length > 0) return { admin, app: admin.app() };
  if (!backendConfig.firebaseProjectId || !backendConfig.firebaseClientEmail || !backendConfig.firebasePrivateKey) {
    return null;
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: backendConfig.firebaseProjectId,
      clientEmail: backendConfig.firebaseClientEmail,
      privateKey: backendConfig.firebasePrivateKey
    })
  });
  return { admin, app };
};

const sendAuthError = (res: Response, statusCode: number, message: string, code: string) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    error: { code }
  });
};

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring('Bearer '.length) : '';

  const firebaseAdmin = await getFirebaseAdmin();
  if (firebaseAdmin && token) {
    try {
      const decoded = await firebaseAdmin.admin.auth(firebaseAdmin.app).verifyIdToken(token);
      req.user = {
        uid: String(decoded.uid),
        role: (decoded.role as UserRole) || ((req.headers['x-user-role'] as UserRole | undefined) ?? 'CUSTOMER'),
        phone: decoded.phone_number as string | undefined,
        email: decoded.email as string | undefined
      };
      return next();
    } catch {
      return sendAuthError(res, 401, 'Invalid authentication token', 'INVALID_AUTH_TOKEN');
    }
  }

  if (!isStrictBackend() && backendConfig.apiToken && token === backendConfig.apiToken) {
    req.user = {
      uid: (req.headers['x-user-id'] as string | undefined) || 'demo_user',
      role: (req.headers['x-user-role'] as UserRole | undefined) || 'CUSTOMER'
    };
    return next();
  }

  if (!isStrictBackend() && !backendConfig.apiToken) {
    req.user = {
      uid: (req.headers['x-user-id'] as string | undefined) || 'demo_user',
      role: (req.headers['x-user-role'] as UserRole | undefined) || 'CUSTOMER'
    };
    return next();
  }

  return sendAuthError(res, 401, 'Authentication is required', 'AUTH_REQUIRED');
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendAuthError(res, 401, 'Authentication is required', 'AUTH_REQUIRED');
    }
    if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN' || roles.includes(req.user.role)) {
      return next();
    }
    return sendAuthError(res, 403, 'Forbidden for this role', 'FORBIDDEN');
  };
}
