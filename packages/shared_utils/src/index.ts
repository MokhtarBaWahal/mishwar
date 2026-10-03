/**
 * MISHWAR (مشوار) - Shared Utilities & Engines
 * Mathematical formulas, State Machine verification, and Yemeni phone helpers.
 */

import {
  FareCalculation,
  GeoPoint,
  PricingRule,
  RideStatus,
  VehicleType
} from '../../shared_types/src';

/**
 * Calculates Great-Circle Distance between two coordinates in Kilometers using the Haversine formula.
 */
export function calculateDistanceKm(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.latitude * Math.PI) / 180) *
      Math.cos((to.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // 2 decimal precision
}

/**
 * Estimates duration in minutes based on traffic & urban speed in Yemeni cities (average 20-30 km/h)
 */
export function estimateDurationMinutes(distanceKm: number, vehicleType: VehicleType): number {
  // Speed variations based on traffic in Yemeni cities
  let avgSpeedKmH = 20;
  if (vehicleType === 'MOTORCYCLE') {
    avgSpeedKmH = 26; // Motorcycles navigate crowded alleys and traffic faster
  } else if (vehicleType === 'COMFORT') {
    avgSpeedKmH = 22;
  } else if (vehicleType === 'FAMILY') {
    avgSpeedKmH = 18;
  }
  const rawMinutes = (distanceKm / avgSpeedKmH) * 60;
  return Math.max(3, Math.ceil(rawMinutes));
}

/**
 * Pure Pricing Engine calculation
 * Formula:
 * grossFare = max(minimumFare, (baseFare + (distance * pricePerKm) + (duration * pricePerMinute)) * peakMultiplier)
 * platformCommission = grossFare * platformCommissionRate
 * driverNetEarnings = grossFare - platformCommission
 */
export function calculateFare(
  distanceKm: number,
  durationMinutes: number,
  pricingRule: PricingRule,
  zoneMultiplier: number = 1.0
): FareCalculation {
  const effectiveMultiplier = (pricingRule.peakMultiplier || 1.0) * zoneMultiplier;
  const distanceFare = Math.round(distanceKm * pricingRule.pricePerKm);
  const timeFare = Math.round(durationMinutes * pricingRule.pricePerMinute);
  
  const rawCalculated = Math.round((pricingRule.baseFare + distanceFare + timeFare) * effectiveMultiplier);
  const grossFare = Math.max(pricingRule.minimumFare, rawCalculated);
  
  // Commission calculation (e.g., 10%)
  const platformCommission = Math.round(grossFare * (pricingRule.platformCommissionRate || 0.10));
  const driverNetEarnings = grossFare - platformCommission;

  return {
    baseFare: pricingRule.baseFare,
    distanceKm: Math.round(distanceKm * 100) / 100,
    distanceFare,
    durationMinutes,
    timeFare,
    surgeMultiplier: Math.round(effectiveMultiplier * 100) / 100,
    grossFare,
    platformCommission,
    driverNetEarnings,
    currency: pricingRule.currency || 'YER'
  };
}

/**
 * Ride State Machine
 * Defines all allowable state transitions to prevent race conditions & illegal leaps
 */
export const ALLOWED_STATE_TRANSITIONS: Record<RideStatus, RideStatus[]> = {
  REQUESTED: ['SEARCHING_DRIVER', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PASSENGER'],
  SEARCHING_DRIVER: ['DRIVER_ASSIGNED', 'NO_DRIVER_FOUND', 'NO_DRIVER_AVAILABLE', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PASSENGER'],
  DRIVER_ASSIGNED: ['DRIVER_ARRIVING', 'DRIVER_ON_THE_WAY', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'],
  DRIVER_ARRIVING: ['DRIVER_ARRIVED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'],
  DRIVER_ON_THE_WAY: ['DRIVER_ARRIVED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'],
  DRIVER_ARRIVED: ['TRIP_STARTED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'],
  TRIP_STARTED: ['TRIP_COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'],
  TRIP_COMPLETED: [], // Terminal
  CANCELLED_BY_CUSTOMER: [], // Terminal
  CANCELLED_BY_PASSENGER: [], // Terminal
  CANCELLED_BY_DRIVER: [], // Terminal
  NO_DRIVER_FOUND: [], // Terminal
  NO_DRIVER_AVAILABLE: [] // Terminal
};

export function isValidStateTransition(current: RideStatus, next: RideStatus): boolean {
  return ALLOWED_STATE_TRANSITIONS[current]?.includes(next) ?? false;
}

/**
 * Yemeni Phone Number Validation & Formatting
 * Validates prefixes: 77 (Yemen Mobile), 73 (YOU/MTN), 71 (Sabafon), 70 (Y Telecom), 78 (Yemen Mobile 4G)
 */
export function validateYemeniPhone(phone: string): { isValid: boolean; normalized: string; operator: string } {
  // Strip spaces, dashes, +967 or 00967
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('967')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Yemeni local numbers are 9 digits starting with 7
  if (cleaned.length !== 9 || !cleaned.startsWith('7')) {
    return { isValid: false, normalized: phone, operator: 'Unknown' };
  }

  const prefix = cleaned.substring(0, 2);
  let operator = 'General';
  if (prefix === '77' || prefix === '78') operator = 'Yemen Mobile';
  else if (prefix === '73') operator = 'YOU (MTN)';
  else if (prefix === '71') operator = 'Sabafon';
  else if (prefix === '70') operator = 'Y Telecom';

  return {
    isValid: true,
    normalized: `+967 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`,
    operator
  };
}

/**
 * Format Yemeni Rial currency display
 */
export function formatCurrency(amount: number, locale: 'ar' | 'en' = 'ar'): string {
  const formatted = amount.toLocaleString('en-US');
  return locale === 'ar' ? `${formatted} ر.ي` : `${formatted} YER`;
}

/**
 * Generate unique IDs for local mock operations and idempotency checks
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}
