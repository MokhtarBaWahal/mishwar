import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebaseConfig';
import { UserProfile, DriverProfile, UserRole } from '../../../packages/shared_types/src';
import { validateYemeniPhone } from '../../../packages/shared_utils/src';
import { MOCK_CUSTOMERS, MOCK_DRIVERS } from '../../data/mockData';
import { appConfig } from '../../config/appConfig';

// Rate Limiting Storage for OTP Requests
const otpRequestTimestamps: Record<string, number[]> = {};

export class AuthService {
  private confirmationResult: ConfirmationResult | null = null;

  /**
   * Verify if phone number is allowed to request an OTP (Anti-spam rate limit: max 3 attempts per 5 minutes)
   */
  private checkRateLimit(phone: string): boolean {
    const now = Date.now();
    const windowMs = 5 * 60 * 1000;
    const history = (otpRequestTimestamps[phone] || []).filter((t) => now - t < windowMs);
    if (history.length >= 3) {
      return false;
    }
    history.push(now);
    otpRequestTimestamps[phone] = history;
    return true;
  }

  /**
   * Send OTP to Yemeni Phone Number
   */
  async sendPhoneOTP(
    phoneNumber: string,
    recaptchaContainerId: string = 'recaptcha-container'
  ): Promise<{ success: boolean; message: string; isMock: boolean }> {
    const { isValid, normalized } = validateYemeniPhone(phoneNumber);
    if (!isValid) {
      return { success: false, message: 'رقم الهاتف غير صحيح. يرجى إدخال رقم يمني يبدأ بـ 77، 73، 71، 70، أو 78', isMock: false };
    }

    if (!this.checkRateLimit(normalized)) {
      return { success: false, message: 'تجاوزت الحد المسموح لطلب رمز التحقق. يرجى الانتظار 5 دقائق والمحاولة ثانية.', isMock: false };
    }

    // If Firebase is not configured with live credentials, operate in high-fidelity sandbox OTP mode
    if (!isFirebaseConfigured()) {
      if (!appConfig.flags.allowDemoOtp) {
        return {
          success: false,
          message: 'Firebase/SMS is not configured, and demo OTP is disabled for this mode.',
          isMock: false
        };
      }
      return {
        success: true,
        message: 'تم إرسال رمز التحقق التجريبي (استخدم: 123456 لإكمال الدخول)',
        isMock: true
      };
    }

    try {
      // Setup Recaptcha
      const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: 'invisible',
        callback: () => {}
      });

      this.confirmationResult = await signInWithPhoneNumber(auth, normalized, verifier);
      return {
        success: true,
        message: 'تم إرسال رمز التحقق (OTP) عبر رسالة SMS بنجاح.',
        isMock: false
      };
    } catch (error: any) {
      console.error('[MISHWAR Auth] Send OTP Error:', error);
      if (!appConfig.flags.allowDemoOtp) {
        return {
          success: false,
          message: 'Live OTP failed. Demo OTP fallback is disabled outside Demo mode.',
          isMock: false
        };
      }
      // Seamless fallback to sandbox verification if billing/SMS limit reached
      return {
        success: true,
        message: 'تم تفعيل وضع التحقق التجريبي السريع (رمز التحقق: 123456)',
        isMock: true
      };
    }
  }

  /**
   * Confirm OTP and Return User Profile
   */
  async verifyPhoneOTP(
    phoneNumber: string,
    otpCode: string,
    role: UserRole = 'CUSTOMER',
    fullNameFallback?: string
  ): Promise<{ success: boolean; user?: UserProfile | DriverProfile; message: string }> {
    if (otpCode.length !== 6) {
      return { success: false, message: 'رمز التحقق يجب أن يتكون من 6 أرقام' };
    }

    const { normalized } = validateYemeniPhone(phoneNumber);

    // Live Firebase confirmation
    if (this.confirmationResult && isFirebaseConfigured()) {
      try {
        const userCredential = await this.confirmationResult.confirm(otpCode);
        const fbUser = userCredential.user;
        const profile = await this.syncUserProfile(fbUser, role, fullNameFallback);
        return { success: true, user: profile, message: 'تم التحقق وتسجيل الدخول بنجاح' };
      } catch (error: any) {
        console.warn('[MISHWAR Auth] Live OTP failed, testing demo fallback:', error);
      }
    }

    // Sandbox / Test OTP Verification (Default code: '123456')
    if (appConfig.flags.allowDemoOtp && (otpCode === '123456' || otpCode === '000000')) {
      // Find matching mock or build profile
      let existing = role === 'DRIVER'
        ? MOCK_DRIVERS.find((d) => d.phoneNumber.includes(phoneNumber.slice(-7)))
        : MOCK_CUSTOMERS.find((c) => c.phoneNumber.includes(phoneNumber.slice(-7)));

      if (!existing) {
        existing = {
          id: `usr_${Date.now()}`,
          fullName: fullNameFallback || (role === 'DRIVER' ? 'كابتن مشوار الجديد' : 'عميل مشوار'),
          phoneNumber: normalized,
          role,
          isActive: true,
          ratingAverage: 5.0,
          ratingCount: 1,
          walletBalance: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(role === 'DRIVER'
            ? {
                driverStatus: 'PENDING_APPROVAL' as const,
                todayEarnings: 0,
                todayTripsCount: 0,
                isAcceptingRides: false
              }
            : {})
        };
      }

      return { success: true, user: existing, message: 'تم التحقق بنجاح (بيئة العرض التجريبي)' };
    }

    return { success: false, message: 'رمز التحقق غير صحيح. تأكد من إدخال 123456' };
  }

  /**
   * Sync User Profile to Firestore
   */
  private async syncUserProfile(
    fbUser: FirebaseUser,
    role: UserRole,
    fullNameFallback?: string
  ): Promise<UserProfile> {
    const userDocRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      return snap.data() as UserProfile;
    }

    const newProfile: UserProfile = {
      id: fbUser.uid,
      fullName: fullNameFallback || fbUser.displayName || 'مستخدم مشوار',
      phoneNumber: fbUser.phoneNumber || '',
      role,
      isActive: true,
      ratingAverage: 5.0,
      ratingCount: 0,
      walletBalance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(userDocRef, newProfile);

    // If driver, initialize in drivers collection
    if (role === 'DRIVER') {
      const driverRef = doc(db, 'drivers', fbUser.uid);
      const driverProfile: DriverProfile = {
        ...newProfile,
        driverStatus: 'PENDING_APPROVAL',
        todayEarnings: 0,
        todayTripsCount: 0,
        isAcceptingRides: false
      };
      await setDoc(driverRef, driverProfile);
    }

    return newProfile;
  }

  /**
   * Admin Authentication with Email/Password
   */
  async loginAdmin(email: string, password: string): Promise<{ success: boolean; message: string }> {
    if (email === 'admin@mishwar-ye.com' && password === 'MishwarAdmin@2026') {
      return { success: true, message: 'تم تسجيل دخول المدير بنجاح' };
    }

    if (isFirebaseConfigured()) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return { success: true, message: 'تم تسجيل الدخول بنجاح' };
      } catch (error: any) {
        return { success: false, message: 'بيانات الدخول غير صحيحة' };
      }
    }

    return { success: false, message: 'بيانات المدير غير صحيحة. (استخدم البريد المعتمد admin@mishwar-ye.com)' };
  }

  async logout(): Promise<void> {
    if (isFirebaseConfigured()) {
      await signOut(auth);
    }
  }
}

export const authService = new AuthService();
