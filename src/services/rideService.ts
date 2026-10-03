import {
  DriverProfile,
  FareCalculation,
  GeoPoint,
  PaymentMethod,
  Ride,
  RideStatus,
  UserProfile,
  VehicleType
} from '../../packages/shared_types/src';
import { isValidStateTransition } from '../../packages/shared_utils/src';
import { MOCK_RIDES } from '../data/mockData';

class RideService {
  private rides: Ride[] = [...MOCK_RIDES];
  private activeRide: Ride | null = null;

  getAllRides(): Ride[] {
    return [...this.rides];
  }

  getRideById(id: string): Ride | undefined {
    return this.rides.find((r) => r.id === id);
  }

  getActiveRide(): Ride | null {
    return this.activeRide;
  }

  createRideRequest(params: {
    customer: UserProfile;
    pickup: GeoPoint;
    destination: GeoPoint;
    vehicleType: VehicleType;
    fare: FareCalculation;
    paymentMethod: PaymentMethod;
    passengerCount?: number;
    airConditioningRequired?: boolean;
    scheduledAt?: string;
  }): Ride {
    const rideId = `ride_${Date.now()}`;
    const newRide: Ride = {
      id: rideId,
      rideId,
      customerId: params.customer.id,
      passengerId: params.customer.id,
      customerName: params.customer.fullName,
      customerPhone: params.customer.phoneNumber,
      customerRating: params.customer.ratingAverage,
      customerAvatar: params.customer.avatarUrl,
      vehicleType: params.vehicleType,
      status: 'SEARCHING_DRIVER',
      pickup: params.pickup,
      destination: params.destination,
      passengerCount: params.passengerCount || 1,
      airConditioningRequired: params.airConditioningRequired || false,
      scheduledAt: params.scheduledAt,
      estimatedDistanceKm: params.fare.distanceKm,
      distance: params.fare.distanceKm,
      estimatedDurationMins: params.fare.durationMinutes,
      estimatedDuration: params.fare.durationMinutes,
      fare: params.fare,
      estimatedFare: params.fare.grossFare,
      finalFare: params.fare.grossFare,
      paymentMethod: params.paymentMethod,
      paymentStatus: 'PENDING',
      createdAt: new Date().toISOString()
    };

    this.activeRide = newRide;
    this.rides.unshift(newRide);
    return newRide;
  }

  assignDriver(rideId: string, driver: DriverProfile): Ride | null {
    const ride = this.rides.find((r) => r.id === rideId);
    if (!ride) return null;

    ride.driverId = driver.id;
    ride.driverName = driver.fullName;
    ride.driverPhone = driver.phoneNumber;
    ride.driverRating = driver.ratingAverage;
    ride.driverAvatar = driver.avatarUrl;
    ride.vehicle = driver.vehicle;
    ride.status = 'DRIVER_ASSIGNED';
    ride.assignedAt = new Date().toISOString();

    this.activeRide = { ...ride };
    return this.activeRide;
  }

  updateRideStatus(
    rideId: string,
    nextStatus: RideStatus,
    context?: {
      driver?: DriverProfile;
      reason?: string;
      cancelledByRole?: 'CUSTOMER' | 'DRIVER' | 'ADMIN';
    }
  ): { success: boolean; ride?: Ride; error?: string } {
    const ride = this.rides.find((r) => r.id === rideId);
    if (!ride) {
      return { success: false, error: 'الرحلة غير موجودة' };
    }

    // Guard rails check
    if (!isValidStateTransition(ride.status, nextStatus)) {
      return {
        success: false,
        error: `انتقال غير مسموح من الحالة (${ride.status}) إلى (${nextStatus})`
      };
    }

    ride.status = nextStatus;

    if (nextStatus === 'DRIVER_ARRIVED') {
      ride.arrivedAt = new Date().toISOString();
    } else if (nextStatus === 'TRIP_STARTED') {
      ride.startedAt = new Date().toISOString();
    } else if (nextStatus === 'TRIP_COMPLETED') {
      ride.completedAt = new Date().toISOString();
      ride.paymentStatus = 'PAID';
    } else if (nextStatus === 'CANCELLED_BY_CUSTOMER' || nextStatus === 'CANCELLED_BY_DRIVER' || nextStatus === 'CANCELLED_BY_PASSENGER') {
      ride.cancelledAt = new Date().toISOString();
      ride.cancellationReason = context?.reason || 'تم الإلغاء';
      ride.cancelledByRole = context?.cancelledByRole || 'CUSTOMER';
    }

    if (this.activeRide?.id === rideId) {
      this.activeRide = { ...ride };
    }

    return { success: true, ride: { ...ride } };
  }

  clearActiveRide(): void {
    this.activeRide = null;
  }

  getCustomerRides(customerId: string): Ride[] {
    return this.rides.filter((r) => r.customerId === customerId);
  }

  getDriverRides(driverId: string): Ride[] {
    return this.rides.filter((r) => r.driverId === driverId);
  }
}

export const rideService = new RideService();
