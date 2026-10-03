import { DriverProfile, UserProfile, UserRole } from '../../packages/shared_types/src';
import { MOCK_CUSTOMERS, MOCK_DRIVERS } from '../data/mockData';
import { validateYemeniPhone } from '../../packages/shared_utils/src';
import { appConfig } from '../config/appConfig';

export interface DemoAccount {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  detail: string;
}

export interface UserSession {
  token: string;
  userId: string;
  phone: string;
  role: UserRole;
  loginTime: string;
  expiresAt: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'cust_01',
    name: 'عادل منصور الأنسي',
    phone: '+967 771 234 567',
    role: 'CUSTOMER',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    detail: 'راكب VIP · رصيد 8,500 ريال'
  },
  {
    id: 'cust_02',
    name: 'سارة عبدالسلام الصنعاني',
    phone: '+967 733 987 654',
    role: 'CUSTOMER',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    detail: 'راكبة دائمة · تقييم 5.0'
  },
  {
    id: 'drv_01',
    name: 'محمد علي الأهدل',
    phone: '+967 774 112 334',
    role: 'DRIVER',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    detail: 'كابتن دراجة نارية · نشط'
  },
  {
    id: 'drv_02',
    name: 'أحمد حسن باصريح',
    phone: '+967 735 998 877',
    role: 'DRIVER',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    detail: 'كابتن سيارة ياريس · نشط'
  },
  {
    id: 'admin_01',
    name: 'مدير عمليات مشوار - صنعاء',
    phone: '+967 777 000 111',
    role: 'ADMIN',
    detail: 'لوحة التحكم والإشراف والأسعار'
  }
];

interface PhoneOtpState {
  code: string;
  sentAt: number;
  expiresAt: number;
  attempts: number;
  lockedUntil: number;
  sendCount: number;
}

class AuthService {
  private otpState: Map<string, PhoneOtpState> = new Map();
  private currentSession: UserSession | null = {
    token: 'sess_init_admin',
    userId: 'admin_01',
    phone: '+967 777 000 111',
    role: 'ADMIN',
    loginTime: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString()
  };

  getDemoAccounts(): DemoAccount[] {
    return DEMO_ACCOUNTS;
  }

  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  logout(): void {
    this.currentSession = null;
  }

  /**
   * Request OTP for a Yemeni mobile number with rate limiting.
   */
  async sendOTP(phone: string): Promise<{ success: boolean; message: string; operator?: string; expiresSecs?: number }> {
    const val = validateYemeniPhone(phone);
    if (!val.isValid) {
      return { success: false, message: 'يرجى إدخال رقم هاتف يمني صحيح (يبدأ بـ 77، 73، 71، 78، أو 70)' };
    }

    const norm = val.normalized;
    const now = Date.now();
    const existing = this.otpState.get(norm);

    // Rate limiting: check lock
    if (existing && existing.lockedUntil > now) {
      const waitSecs = Math.ceil((existing.lockedUntil - now) / 1000);
      return {
        success: false,
        message: `تم حظر المحاولات مؤقتاً بسبب تكرار المحاولات الخاطئة. يرجى الانتظار ${waitSecs} ثانية.`
      };
    }

    // Rate limit sending frequency (max 3 sends per 2 minutes)
    if (existing && now - existing.sentAt < 120000 && existing.sendCount >= 3) {
      return {
        success: false,
        message: 'تم إرسال عدة رسائل مؤخراً. يرجى الانتظار دقيقتين قبل طلب رمز جديد.'
      };
    }

    if (!appConfig.flags.allowDemoOtp) {
      return {
        success: false,
        message: 'OTP التجريبي غير مفعل في هذا الوضع. اربط مزود SMS الحقيقي قبل استخدام Pilot/Production.'
      };
    }

    const code = '123456'; // Standard demo OTP
    const expiresAt = now + 120000; // 2 minutes expiry

    this.otpState.set(norm, {
      code,
      sentAt: now,
      expiresAt,
      attempts: 0,
      lockedUntil: 0,
      sendCount: existing && now - existing.sentAt < 120000 ? existing.sendCount + 1 : 1
    });

    return {
      success: true,
      operator: val.operator,
      expiresSecs: 120,
      message: `تم إرسال رمز التحقق إلى شبكة ${val.operator} (رمز التجربة السريعة: 123456)`
    };
  }

  /**
   * Verify entered OTP with attempts check, expiration check, and lockouts.
   */
  async verifyOTP(
    phone: string,
    otp: string,
    role: UserRole
  ): Promise<{ success: boolean; user?: UserProfile | DriverProfile; message: string; session?: UserSession }> {
    const val = validateYemeniPhone(phone);
    const norm = val.isValid ? val.normalized : phone;
    const now = Date.now();

    const state = this.otpState.get(norm);

    // Check lock
    if (state && state.lockedUntil > now) {
      const waitSecs = Math.ceil((state.lockedUntil - now) / 1000);
      return {
        success: false,
        message: `تم تجاوز الحد الأقصى للمحاولات (3 محاولات). الحساب مقفل مؤقتاً لمدة ${waitSecs} ثانية.`
      };
    }

    // Check expiration if requested with state
    if (state && state.expiresAt < now) {
      return {
        success: false,
        message: 'انتهت صلاحية رمز التحقق (أكثر من دقيقتين). يرجى طلب رمز جديد.'
      };
    }

    // Verify OTP code
    const isDemoOtp = appConfig.flags.allowDemoOtp && (otp === '123456' || otp === '000000');
    const isTestValid = isDemoOtp || (state && state.code === otp);

    if (!isTestValid) {
      if (state) {
        state.attempts += 1;
        if (state.attempts >= 3) {
          state.lockedUntil = now + 60000; // 1 minute lockout
          return {
            success: false,
            message: 'تم إدخال رمز خاطئ 3 مرات متتالية. تم قفل الحساب مؤقتاً لمدة 60 ثانية.'
          };
        }
      }
      return { success: false, message: appConfig.flags.allowDemoOtp ? 'رمز التحقق غير صحيح، يرجى إدخال 123456' : 'رمز التحقق غير صحيح أو أن مزود SMS الحقيقي غير مهيأ.' };
    }

    // Success - reset attempts
    if (state) {
      state.attempts = 0;
      state.lockedUntil = 0;
    }

    // Retrieve or match user
    let user: UserProfile | DriverProfile;
    const cleanDigits = phone.replace(/\D/g, '').slice(-7);

    if (role === 'DRIVER') {
      const match = MOCK_DRIVERS.find((d) => d.phoneNumber.replace(/\D/g, '').includes(cleanDigits));
      user = match || MOCK_DRIVERS[0];
    } else {
      const match = MOCK_CUSTOMERS.find((c) => c.phoneNumber.replace(/\D/g, '').includes(cleanDigits));
      user = match || MOCK_CUSTOMERS[0];
    }

    const session: UserSession = {
      token: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId: user.id,
      phone: user.phoneNumber,
      role,
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 7).toISOString()
    };

    this.currentSession = session;

    return {
      success: true,
      user,
      session,
      message: 'تم تسجيل الدخول والتحقق بنجاح!'
    };
  }

  // Helper for test suite simulation
  simulateExpiredOTP(phone: string): void {
    const val = validateYemeniPhone(phone);
    const norm = val.isValid ? val.normalized : phone;
    this.otpState.set(norm, {
      code: '123456',
      sentAt: Date.now() - 300000,
      expiresAt: Date.now() - 60000, // Expired 1 minute ago
      attempts: 0,
      lockedUntil: 0,
      sendCount: 1
    });
  }

  simulateLockedOutPhone(phone: string): void {
    const val = validateYemeniPhone(phone);
    const norm = val.isValid ? val.normalized : phone;
    this.otpState.set(norm, {
      code: '123456',
      sentAt: Date.now(),
      expiresAt: Date.now() + 120000,
      attempts: 3,
      lockedUntil: Date.now() + 60000,
      sendCount: 1
    });
  }
}

export const authService = new AuthService();
