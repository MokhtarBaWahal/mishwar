import {
  DriverLiveLocation,
  DriverProfile,
  PaymentRecord,
  Ride,
  RideOffer,
  RideStatus,
  UserProfile,
  WalletLedgerEntry
} from '../../packages/shared_types/src';
import { calculateDistanceKm } from '../../packages/shared_utils/src';
import { MOCK_CUSTOMERS, MOCK_DRIVERS, MOCK_RIDES } from '../data/mockData';
import {
  DispatchRepository,
  DriverRepository,
  PassengerRepository,
  PaymentRepository,
  RepositoryRegistry,
  RideRepository,
  WalletRepository
} from './types';

class MockRideRepository implements RideRepository {
  private rides = [...MOCK_RIDES];

  async createRide(ride: Ride): Promise<Ride> {
    this.rides.unshift(ride);
    return ride;
  }

  async getRideById(rideId: string): Promise<Ride | null> {
    return this.rides.find((ride) => ride.id === rideId) || null;
  }

  async updateRideStatus(rideId: string, status: RideStatus, patch: Partial<Ride> = {}): Promise<Ride | null> {
    const ride = this.rides.find((item) => item.id === rideId);
    if (!ride) return null;
    Object.assign(ride, patch, { status });
    return { ...ride };
  }

  async listPassengerRides(passengerId: string): Promise<Ride[]> {
    return this.rides.filter((ride) => ride.customerId === passengerId);
  }

  async listDriverRides(driverId: string): Promise<Ride[]> {
    return this.rides.filter((ride) => ride.driverId === driverId);
  }
}

class MockDriverRepository implements DriverRepository {
  private drivers = [...MOCK_DRIVERS];

  async getDriverById(driverId: string): Promise<DriverProfile | null> {
    return this.drivers.find((driver) => driver.id === driverId) || null;
  }

  async listAvailableDrivers(params: Parameters<DriverRepository['listAvailableDrivers']>[0]): Promise<DriverProfile[]> {
    return this.drivers
      .filter((driver) => {
        if (!driver.isActive || driver.driverStatus !== 'ONLINE' || !driver.isAcceptingRides || !driver.vehicle) return false;
        if (driver.vehicle.status && driver.vehicle.status !== 'ACTIVE') return false;
        if (params.airConditioningRequired && !driver.vehicle.hasAC) return false;
        if ((driver.vehicle.capacity || 1) < params.passengerCount) return false;
        if (driver.vehicle.type !== params.vehicleType && params.vehicleType === 'MOTORCYCLE') return false;
        return true;
      })
      .sort((a, b) => {
        const aDistance = a.currentLocation ? calculateDistanceKm(params.pickup, a.currentLocation) : Number.MAX_SAFE_INTEGER;
        const bDistance = b.currentLocation ? calculateDistanceKm(params.pickup, b.currentLocation) : Number.MAX_SAFE_INTEGER;
        return aDistance - bDistance;
      });
  }

  async updateDriverStatus(driverId: string, status: DriverProfile['driverStatus']): Promise<void> {
    const driver = this.drivers.find((item) => item.id === driverId);
    if (driver) {
      driver.driverStatus = status;
      driver.isAcceptingRides = status === 'ONLINE';
      driver.updatedAt = new Date().toISOString();
    }
  }

  async updateDriverLocation(location: DriverLiveLocation): Promise<void> {
    const driver = this.drivers.find((item) => item.id === location.driverId);
    if (driver) {
      driver.currentLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        addressName: 'Live driver location'
      };
      driver.lastLocationUpdate = location.updatedAt;
    }
  }
}

class MockPassengerRepository implements PassengerRepository {
  private passengers = [...MOCK_CUSTOMERS];

  async getPassengerById(passengerId: string): Promise<UserProfile | null> {
    return this.passengers.find((passenger) => passenger.id === passengerId) || null;
  }

  async listPassengers(): Promise<UserProfile[]> {
    return [...this.passengers];
  }
}

class MockDispatchRepository implements DispatchRepository {
  private offers: RideOffer[] = [];

  async createRideOffer(offer: RideOffer): Promise<RideOffer> {
    this.offers.unshift(offer);
    return offer;
  }

  async acceptRideOffer(offerId: string, driverId: string): Promise<{ success: boolean; rideOffer?: RideOffer; error?: string }> {
    const offer = this.offers.find((item) => item.id === offerId);
    if (!offer) return { success: false, error: 'RIDE_OFFER_NOT_FOUND' };
    if (offer.driverId !== driverId) return { success: false, error: 'RIDE_OFFER_DRIVER_MISMATCH' };
    if (offer.status !== 'PENDING') return { success: false, error: 'RIDE_OFFER_NOT_PENDING' };

    const hasAcceptedConflict = this.offers.some(
      (item) => item.driverId === driverId && item.status === 'ACCEPTED' && item.rideId !== offer.rideId
    );
    if (hasAcceptedConflict) return { success: false, error: 'DRIVER_ALREADY_ASSIGNED' };

    offer.status = 'ACCEPTED';
    offer.acceptedAt = new Date().toISOString();
    return { success: true, rideOffer: { ...offer } };
  }

  async rejectRideOffer(offerId: string, driverId: string): Promise<void> {
    const offer = this.offers.find((item) => item.id === offerId && item.driverId === driverId);
    if (offer && offer.status === 'PENDING') {
      offer.status = 'REJECTED';
      offer.rejectedAt = new Date().toISOString();
    }
  }

  async getPendingOfferForDriver(driverId: string): Promise<RideOffer | null> {
    return this.offers.find((item) => item.driverId === driverId && item.status === 'PENDING') || null;
  }
}

class MockPaymentRepository implements PaymentRepository {
  private payments: PaymentRecord[] = [];

  async createPayment(payment: PaymentRecord): Promise<PaymentRecord> {
    const existing = this.payments.find((item) => item.idempotencyKey === payment.idempotencyKey);
    if (existing) return existing;
    this.payments.unshift(payment);
    return payment;
  }

  async getPaymentById(paymentId: string): Promise<PaymentRecord | null> {
    return this.payments.find((payment) => payment.paymentId === paymentId) || null;
  }
}

class MockWalletRepository implements WalletRepository {
  private ledger: WalletLedgerEntry[] = [];

  async recordLedgerTransaction(entry: WalletLedgerEntry): Promise<WalletLedgerEntry> {
    const existing = entry.idempotencyKey
      ? this.ledger.find((item) => item.idempotencyKey === entry.idempotencyKey)
      : undefined;
    if (existing) return existing;
    this.ledger.unshift(entry);
    return entry;
  }

  async getLedger(userId: string): Promise<WalletLedgerEntry[]> {
    return this.ledger.filter((entry) => entry.userId === userId);
  }
}

export const createMockRepositories = (): RepositoryRegistry => ({
  rides: new MockRideRepository(),
  drivers: new MockDriverRepository(),
  passengers: new MockPassengerRepository(),
  dispatch: new MockDispatchRepository(),
  payments: new MockPaymentRepository(),
  wallets: new MockWalletRepository()
});
