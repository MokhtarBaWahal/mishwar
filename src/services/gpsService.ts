import { GeoPoint } from '../../packages/shared_types/src';

export interface GPSLocationResult {
  success: boolean;
  location?: GeoPoint;
  error?: string;
}

export class GPSService {
  /**
   * Request Current User / Driver GPS Position
   */
  async getCurrentPosition(): Promise<GPSLocationResult> {
    if (!navigator.geolocation) {
      return { success: false, error: 'خدمة تحديد المواقع GPS غير مدعومة في هذا الجهاز.' };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          resolve({
            success: true,
            location: {
              latitude,
              longitude,
              addressName: `موقعي الحالي (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
            }
          });
        },
        (err) => {
          let msg = 'تعذر الوصول إلى الموقع الجغرافي.';
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'تم رفض إذن الوصول للموقع. يرجى تفعيل الـ GPS من إعدادات الهاتف.';
          } else if (err.code === err.TIMEOUT) {
            msg = 'انتهت مهلة البحث عن إشارة GPS. تأكد من جودة الاتصال.';
          }
          resolve({ success: false, error: msg });
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 10000
        }
      );
    });
  }

  /**
   * Watch location changes with throttled battery-aware callback
   */
  watchPosition(
    onLocationUpdate: (point: GeoPoint) => void,
    onError: (err: string) => void
  ): number | null {
    if (!navigator.geolocation) {
      onError('GPS غير مدعوم');
      return null;
    }

    let lastSent = 0;

    return navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        // Battery throttle: minimum 4 seconds between updates
        if (now - lastSent < 4000) return;
        lastSent = now;

        onLocationUpdate({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          addressName: 'موقع الكابتن المباشر'
        });
      },
      (err) => onError(err.message),
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );
  }

  clearWatch(watchId: number): void {
    if (navigator.geolocation && watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
  }
}

export const gpsService = new GPSService();
