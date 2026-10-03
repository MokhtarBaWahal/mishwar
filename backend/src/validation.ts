import { GeoPoint, PaymentMethod, VehicleType } from '../../packages/shared_types/src';

export class ApiValidationError extends Error {
  constructor(public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export const assertGeoPoint = (value: unknown, fieldName: string): GeoPoint => {
  const point = value as Partial<GeoPoint> | null;
  if (
    !point ||
    typeof point.latitude !== 'number' ||
    typeof point.longitude !== 'number' ||
    point.latitude < -90 ||
    point.latitude > 90 ||
    point.longitude < -180 ||
    point.longitude > 180
  ) {
    throw new ApiValidationError('INVALID_COORDINATES', `${fieldName} coordinates are invalid`, { fieldName });
  }
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    addressName: typeof point.addressName === 'string' ? point.addressName : fieldName
  };
};

export const assertVehicleType = (value: unknown): VehicleType => {
  const allowed: VehicleType[] = ['MOTORCYCLE', 'ECONOMY', 'COMFORT', 'FAMILY', 'CAR'];
  if (!allowed.includes(value as VehicleType)) {
    throw new ApiValidationError('INVALID_VEHICLE_TYPE', 'Vehicle type is invalid', { allowed });
  }
  return value as VehicleType;
};

export const assertPassengerCount = (value: unknown): number => {
  const count = Number(value ?? 1);
  if (!Number.isInteger(count) || count < 1 || count > 6) {
    throw new ApiValidationError('INVALID_PASSENGER_COUNT', 'Passenger count must be between 1 and 6', { count });
  }
  return count;
};

export const assertPaymentMethod = (value: unknown): PaymentMethod => {
  const allowed: PaymentMethod[] = ['CASH', 'WALLET', 'CARD'];
  if (!allowed.includes(value as PaymentMethod)) {
    throw new ApiValidationError('INVALID_PAYMENT_METHOD', 'Payment method is invalid', { allowed });
  }
  return value as PaymentMethod;
};

export const assertPositiveAmount = (value: unknown): number => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiValidationError('INVALID_PAYMENT_AMOUNT', 'Payment amount must be greater than zero', { amount });
  }
  return amount;
};
