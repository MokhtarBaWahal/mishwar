import { GeoPoint, PricingRule, VehicleType, FareCalculation, VehicleCategoryConfig } from '../../packages/shared_types/src';
import { calculateDistanceKm, calculateFare, estimateDurationMinutes } from '../../packages/shared_utils/src';
import { INITIAL_PRICING_RULES } from '../data/mockData';

export type { VehicleCategoryConfig };

// Base Vehicle Categories Specifications as required
export const BASE_VEHICLE_CATEGORIES: VehicleCategoryConfig[] = [
  {
    id: 'motorcycle',
    name: 'Motorcycle',
    type: 'MOTORCYCLE',
    nameAr: 'دراجة نارية (موتور)',
    nameEn: 'Motorcycle',
    descriptionAr: 'الأسرع لتجاوز ازدحام شوارع صنعاء وضواحيها',
    capacity: 1, // Sized for 1 passenger
    baseFare: 500,
    pricePerKm: 150,
    pricePerMinute: 25,
    minimumFare: 700,
    supportsAC: false, // Motorcycles do not support AC
    iconName: 'Bike',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&auto=format&fit=crop&q=80',
    badge: 'الأسرع والأوفر'
  },
  {
    id: 'economy',
    name: 'Economy',
    type: 'ECONOMY',
    nameAr: 'سيارة اقتصادية',
    nameEn: 'Economy',
    descriptionAr: 'توفير واقتصادي للمشاوير اليومية',
    capacity: 4, // 4 passengers
    baseFare: 1200,
    pricePerKm: 350,
    pricePerMinute: 45,
    minimumFare: 1800,
    supportsAC: true,
    iconName: 'Car',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=300&auto=format&fit=crop&q=80',
    badge: 'الأكثر طلباً'
  },
  {
    id: 'car',
    name: 'Car',
    type: 'CAR',
    nameAr: 'سيارة عادية',
    nameEn: 'Standard Car',
    descriptionAr: 'سيارات سيدان مريحة للمشاوير الشخصية والعائلية',
    capacity: 4, // 4 passengers
    baseFare: 1200,
    pricePerKm: 350,
    pricePerMinute: 45,
    minimumFare: 1800,
    supportsAC: true,
    iconName: 'Car',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=300&auto=format&fit=crop&q=80',
    badge: 'سيدان مريح'
  },
  {
    id: 'comfort',
    name: 'Comfort',
    type: 'COMFORT',
    nameAr: 'سيارة مريحة',
    nameEn: 'Comfort',
    descriptionAr: 'سيارات حديثة ومكيفة مع أمهر الكباتن',
    capacity: 4, // 4 passengers
    baseFare: 1600,
    pricePerKm: 420,
    pricePerMinute: 55,
    minimumFare: 2400,
    supportsAC: true,
    iconName: 'Sparkles',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300&auto=format&fit=crop&q=80',
    badge: 'راحة إضافية'
  },
  {
    id: 'family',
    name: 'Family XL',
    type: 'FAMILY',
    nameAr: 'عائلي كبير (Family XL)',
    nameEn: 'Family XL',
    descriptionAr: 'سيارات عائلية واسعة (فان / دفع رباعي) سعة 6 ركاب',
    capacity: 6, // 6 passengers
    baseFare: 2200,
    pricePerKm: 550,
    pricePerMinute: 70,
    minimumFare: 3200,
    supportsAC: true,
    iconName: 'Users',
    image: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=300&auto=format&fit=crop&q=80',
    badge: 'سعة 6 ركاب'
  }
];

class PricingService {
  private rules: Record<string, PricingRule> = { ...INITIAL_PRICING_RULES };

  getPricingRules(): Record<string, PricingRule> {
    return { ...this.rules };
  }

  getPricingRule(vehicleType: VehicleType): PricingRule {
    return this.rules[vehicleType] || this.rules.ECONOMY || this.rules.CAR || INITIAL_PRICING_RULES.CAR;
  }

  updatePricingRule(rule: PricingRule): void {
    this.rules[rule.vehicleType] = {
      ...rule,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Retrieves vehicle categories merged dynamically with the latest admin pricing rules.
   */
  getVehicleCategories(customRules?: Record<string, PricingRule>): VehicleCategoryConfig[] {
    const activeRules = customRules || this.rules;
    return BASE_VEHICLE_CATEGORIES.map((cat) => {
      const rule = activeRules[cat.type] || activeRules.ECONOMY || activeRules.CAR;
      if (rule) {
        return {
          ...cat,
          baseFare: rule.baseFare,
          pricePerKm: rule.pricePerKm,
          pricePerMinute: rule.pricePerMinute,
          minimumFare: rule.minimumFare
        };
      }
      return cat;
    });
  }

  getCategoryByType(type: VehicleType, customRules?: Record<string, PricingRule>): VehicleCategoryConfig {
    const list = this.getVehicleCategories(customRules);
    return list.find((c) => c.type === type) || list[1]; // default to economy
  }

  /**
   * Calculate ride fare estimate.
   * If AC surcharge or extra passenger surcharge are defined in pricing rules by admin, applies them.
   */
  calculateEstimate(
    pickup: GeoPoint,
    destination: GeoPoint,
    vehicleType: VehicleType,
    surgeMultiplier: number = 1.0,
    options?: {
      passengerCount?: number;
      airConditioningRequired?: boolean;
    }
  ): FareCalculation {
    const distanceKm = calculateDistanceKm(
      { latitude: pickup.latitude, longitude: pickup.longitude },
      { latitude: destination.latitude, longitude: destination.longitude }
    );
    const durationMinutes = estimateDurationMinutes(distanceKm, vehicleType);
    const rule = this.getPricingRule(vehicleType);

    const baseCalculation = calculateFare(distanceKm, durationMinutes, rule, surgeMultiplier);

    // Future-ready extensible surcharge support only if defined in rule
    let additionalFees = 0;
    if (options?.airConditioningRequired && rule.acSurcharge && rule.acSurcharge > 0) {
      additionalFees += rule.acSurcharge;
    }
    if (options?.passengerCount && options.passengerCount > 4 && rule.extraPassengerSurcharge && rule.extraPassengerSurcharge > 0) {
      additionalFees += rule.extraPassengerSurcharge;
    }

    if (additionalFees > 0) {
      const updatedGross = baseCalculation.grossFare + additionalFees;
      const commission = Math.round(updatedGross * (rule.platformCommissionRate || 0.10));
      return {
        ...baseCalculation,
        grossFare: updatedGross,
        platformCommission: commission,
        driverNetEarnings: updatedGross - commission
      };
    }

    return baseCalculation;
  }
}

export const pricingService = new PricingService();
