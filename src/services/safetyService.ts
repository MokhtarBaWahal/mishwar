import { City, GeoPoint, Ride } from '../../packages/shared_types/src';

export interface TripSafetyPack {
  otp: string;
  shareUrl: string;
  emergencyContacts: Array<{ labelAr: string; phone: string }>;
  lastKnownLocation: GeoPoint;
}

class SafetyService {
  createTripSafetyPack(ride: Ride, city: City, lastKnownLocation?: GeoPoint): TripSafetyPack {
    return {
      otp: this.generateOtp(ride.id),
      shareUrl: `${window.location.origin}/share/ride/${ride.id}`,
      lastKnownLocation: lastKnownLocation || ride.pickup,
      emergencyContacts: this.getEmergencyContacts(city)
    };
  }

  getEmergencyContacts(city: City): Array<{ labelAr: string; phone: string }> {
    const cityName = city.nameEn.toLowerCase();
    if (cityName.includes('aden')) {
      return [
        { labelAr: 'شرطة عدن', phone: '199' },
        { labelAr: 'إسعاف عدن', phone: '191' },
        { labelAr: 'دعم مشوار', phone: '+967 1 400 000' }
      ];
    }
    return [
      { labelAr: 'شرطة صنعاء', phone: '199' },
      { labelAr: 'إسعاف صنعاء', phone: '191' },
      { labelAr: 'دعم مشوار', phone: '+967 1 400 000' }
    ];
  }

  private generateOtp(seed: string): string {
    const numeric = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), Date.now());
    return String(numeric % 10000).padStart(4, '0');
  }
}

export const safetyService = new SafetyService();
