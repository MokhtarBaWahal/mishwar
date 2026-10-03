import { DriverProfile } from '../../packages/shared_types/src';

export type KycDecision = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES';

export interface KycChecklistItem {
  id: 'NATIONAL_ID' | 'DRIVING_LICENSE' | 'VEHICLE_REGISTRATION' | 'VEHICLE_PHOTOS';
  labelAr: string;
  status: KycDecision;
  required: boolean;
}

class KycService {
  buildDriverChecklist(driver: DriverProfile): KycChecklistItem[] {
    const verifiedVehicle = Boolean(driver.vehicle?.isVerified);
    const approved = driver.driverStatus === 'ONLINE' || driver.driverStatus === 'IN_RIDE';
    const suspended = driver.driverStatus === 'SUSPENDED';
    const status: KycDecision = approved ? 'APPROVED' : suspended ? 'REJECTED' : verifiedVehicle ? 'NEEDS_CHANGES' : 'PENDING_REVIEW';

    return [
      { id: 'NATIONAL_ID', labelAr: 'البطاقة الشخصية', status, required: true },
      { id: 'DRIVING_LICENSE', labelAr: 'رخصة القيادة', status, required: true },
      { id: 'VEHICLE_REGISTRATION', labelAr: 'استمارة المركبة', status: verifiedVehicle ? 'APPROVED' : status, required: true },
      { id: 'VEHICLE_PHOTOS', labelAr: 'صور المركبة', status: verifiedVehicle ? 'APPROVED' : 'PENDING_REVIEW', required: true }
    ];
  }

  getDriverDecision(driver: DriverProfile): KycDecision {
    if (driver.driverStatus === 'SUSPENDED') return 'REJECTED';
    if ((driver.driverStatus === 'ONLINE' || driver.driverStatus === 'IN_RIDE') && driver.vehicle?.isVerified) return 'APPROVED';
    if (driver.vehicle?.isVerified) return 'NEEDS_CHANGES';
    return 'PENDING_REVIEW';
  }
}

export const kycService = new KycService();
