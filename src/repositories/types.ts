import {
  DriverLiveLocation,
  DriverProfile,
  GeoPoint,
  PaymentRecord,
  Ride,
  RideOffer,
  RideStatus,
  UserProfile,
  VehicleType,
  WalletLedgerEntry
} from '../../packages/shared_types/src';

export interface RideRepository {
  createRide(ride: Ride): Promise<Ride>;
  getRideById(rideId: string): Promise<Ride | null>;
  updateRideStatus(rideId: string, status: RideStatus, patch?: Partial<Ride>): Promise<Ride | null>;
  listPassengerRides(passengerId: string): Promise<Ride[]>;
  listDriverRides(driverId: string): Promise<Ride[]>;
}

export interface DriverRepository {
  getDriverById(driverId: string): Promise<DriverProfile | null>;
  listAvailableDrivers(params: {
    pickup: GeoPoint;
    vehicleType: VehicleType;
    passengerCount: number;
    airConditioningRequired: boolean;
    maxDistanceKm?: number;
  }): Promise<DriverProfile[]>;
  updateDriverStatus(driverId: string, status: DriverProfile['driverStatus']): Promise<void>;
  updateDriverLocation(location: DriverLiveLocation): Promise<void>;
}

export interface PassengerRepository {
  getPassengerById(passengerId: string): Promise<UserProfile | null>;
  listPassengers(): Promise<UserProfile[]>;
}

export interface DispatchRepository {
  createRideOffer(offer: RideOffer): Promise<RideOffer>;
  acceptRideOffer(offerId: string, driverId: string): Promise<{ success: boolean; rideOffer?: RideOffer; error?: string }>;
  rejectRideOffer(offerId: string, driverId: string): Promise<void>;
  getPendingOfferForDriver(driverId: string): Promise<RideOffer | null>;
}

export interface PaymentRepository {
  createPayment(payment: PaymentRecord): Promise<PaymentRecord>;
  getPaymentById(paymentId: string): Promise<PaymentRecord | null>;
}

export interface WalletRepository {
  recordLedgerTransaction(entry: WalletLedgerEntry): Promise<WalletLedgerEntry>;
  getLedger(userId: string): Promise<WalletLedgerEntry[]>;
}

export interface RepositoryRegistry {
  rides: RideRepository;
  drivers: DriverRepository;
  passengers: PassengerRepository;
  dispatch: DispatchRepository;
  payments: PaymentRepository;
  wallets: WalletRepository;
}
