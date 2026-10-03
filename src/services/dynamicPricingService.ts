import { City, DriverProfile, GeoPoint, Ride, VehicleType, Zone } from '../../packages/shared_types/src';
import { calculateDistanceKm } from '../../packages/shared_utils/src';

export interface DynamicPricingContext {
  multiplier: number;
  label: string;
  reasons: string[];
}

class DynamicPricingService {
  calculateContext(params: {
    pickup: GeoPoint;
    vehicleType: VehicleType;
    selectedCity: City;
    zones: Zone[];
    rides: Ride[];
    drivers: DriverProfile[];
    now?: Date;
  }): DynamicPricingContext {
    const now = params.now || new Date();
    const hour = now.getHours();
    const reasons: string[] = [];
    let multiplier = 1.0;

    if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 20)) {
      multiplier += 0.12;
      reasons.push('وقت ذروة');
    }

    const zone = params.zones
      .filter((z) => z.isActive)
      .find((z) => calculateDistanceKm(params.pickup, z.center) <= z.radiusKm);
    if (zone && zone.surgeMultiplier > 1) {
      multiplier += Math.min(0.25, zone.surgeMultiplier - 1);
      reasons.push(`منطقة نشطة: ${zone.nameAr}`);
    }

    const nearbyDemand = params.rides.filter(
      (ride) =>
        calculateDistanceKm(params.pickup, ride.pickup) <= 4 &&
        !['TRIP_COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_DRIVER', 'NO_DRIVER_FOUND', 'NO_DRIVER_AVAILABLE'].includes(ride.status)
    ).length;

    const nearbySupply = params.drivers.filter(
      (driver) =>
        driver.currentLocation &&
        driver.driverStatus === 'ONLINE' &&
        driver.isAcceptingRides &&
        calculateDistanceKm(params.pickup, driver.currentLocation) <= 4
    ).length;

    if (nearbyDemand > nearbySupply) {
      multiplier += Math.min(0.25, (nearbyDemand - nearbySupply) * 0.05);
      reasons.push('طلب أعلى من المعروض');
    }

    if (params.vehicleType === 'FAMILY' || params.vehicleType === 'COMFORT') {
      multiplier += 0.05;
      reasons.push('فئة مركبة محدودة');
    }

    const bounded = Math.min(1.65, Math.max(1.0, Math.round(multiplier * 100) / 100));
    return {
      multiplier: bounded,
      label: bounded > 1 ? `تسعير ديناميكي x${bounded}` : 'تسعير عادي',
      reasons: reasons.length > 0 ? reasons : ['لا توجد عوامل رفع نشطة']
    };
  }
}

export const dynamicPricingService = new DynamicPricingService();
