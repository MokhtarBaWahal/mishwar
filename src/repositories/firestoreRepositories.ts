import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
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
import { calculateDistanceKm } from '../../packages/shared_utils/src';
import { db } from '../services/firebase/firebaseConfig';
import {
  DispatchRepository,
  DriverRepository,
  PassengerRepository,
  PaymentRepository,
  RepositoryRegistry,
  RideRepository,
  WalletRepository
} from './types';

class FirestoreRideRepository implements RideRepository {
  async createRide(ride: Ride): Promise<Ride> {
    await setDoc(doc(db, 'rides', ride.id), { ...ride, createdAt: ride.createdAt || serverTimestamp() });
    return ride;
  }

  async getRideById(rideId: string): Promise<Ride | null> {
    const snap = await getDoc(doc(db, 'rides', rideId));
    return snap.exists() ? (snap.data() as Ride) : null;
  }

  async updateRideStatus(rideId: string, status: RideStatus, patch: Partial<Ride> = {}): Promise<Ride | null> {
    const rideRef = doc(db, 'rides', rideId);
    await updateDoc(rideRef, { ...patch, status, updatedAt: serverTimestamp() });
    return this.getRideById(rideId);
  }

  async listPassengerRides(passengerId: string): Promise<Ride[]> {
    const snap = await getDocs(query(collection(db, 'rides'), where('customerId', '==', passengerId), limit(50)));
    return snap.docs.map((item) => item.data() as Ride);
  }

  async listDriverRides(driverId: string): Promise<Ride[]> {
    const snap = await getDocs(query(collection(db, 'rides'), where('driverId', '==', driverId), limit(50)));
    return snap.docs.map((item) => item.data() as Ride);
  }
}

class FirestoreDriverRepository implements DriverRepository {
  async getDriverById(driverId: string): Promise<DriverProfile | null> {
    const snap = await getDoc(doc(db, 'drivers', driverId));
    return snap.exists() ? (snap.data() as DriverProfile) : null;
  }

  async listAvailableDrivers(params: {
    pickup: GeoPoint;
    vehicleType: VehicleType;
    passengerCount: number;
    airConditioningRequired: boolean;
    maxDistanceKm?: number;
  }): Promise<DriverProfile[]> {
    const snap = await getDocs(
      query(collection(db, 'drivers'), where('driverStatus', '==', 'ONLINE'), where('isAcceptingRides', '==', true), limit(50))
    );
    const maxDistanceKm = params.maxDistanceKm ?? 25;
    return snap.docs
      .map((item) => item.data() as DriverProfile)
      .filter((driver) => {
        if (!driver.isActive || !driver.vehicle || driver.vehicle.status === 'INACTIVE') return false;
        if (params.airConditioningRequired && !driver.vehicle.hasAC) return false;
        if ((driver.vehicle.capacity || 1) < params.passengerCount) return false;
        if (params.vehicleType === 'MOTORCYCLE' && driver.vehicle.type !== 'MOTORCYCLE') return false;
        if (!driver.currentLocation) return false;
        return calculateDistanceKm(params.pickup, driver.currentLocation) <= maxDistanceKm;
      })
      .sort((a, b) => {
        const aDistance = calculateDistanceKm(params.pickup, a.currentLocation!);
        const bDistance = calculateDistanceKm(params.pickup, b.currentLocation!);
        return aDistance - bDistance;
      });
  }

  async updateDriverStatus(driverId: string, status: DriverProfile['driverStatus']): Promise<void> {
    await updateDoc(doc(db, 'drivers', driverId), {
      driverStatus: status,
      isAcceptingRides: status === 'ONLINE',
      updatedAt: serverTimestamp()
    });
  }

  async updateDriverLocation(location: DriverLiveLocation): Promise<void> {
    await setDoc(doc(db, 'driver_locations', location.driverId), { ...location, updatedAt: serverTimestamp() }, { merge: true });
  }
}

class FirestorePassengerRepository implements PassengerRepository {
  async getPassengerById(passengerId: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, 'passengers', passengerId));
    if (snap.exists()) return snap.data() as UserProfile;
    const userSnap = await getDoc(doc(db, 'users', passengerId));
    return userSnap.exists() ? (userSnap.data() as UserProfile) : null;
  }

  async listPassengers(): Promise<UserProfile[]> {
    const snap = await getDocs(query(collection(db, 'passengers'), limit(100)));
    return snap.docs.map((item) => item.data() as UserProfile);
  }
}

class FirestoreDispatchRepository implements DispatchRepository {
  async createRideOffer(offer: RideOffer): Promise<RideOffer> {
    await setDoc(doc(db, 'rideOffers', offer.id), { ...offer, createdAt: serverTimestamp() });
    return offer;
  }

  async acceptRideOffer(offerId: string, driverId: string): Promise<{ success: boolean; rideOffer?: RideOffer; error?: string }> {
    const offerRef = doc(db, 'rideOffers', offerId);
    try {
      const acceptedOffer = await runTransaction(db, async (tx) => {
        const offerSnap = await tx.get(offerRef);
        if (!offerSnap.exists()) throw new Error('RIDE_OFFER_NOT_FOUND');
        const offer = offerSnap.data() as RideOffer;
        if (offer.driverId !== driverId) throw new Error('RIDE_OFFER_DRIVER_MISMATCH');
        if (offer.status !== 'PENDING') throw new Error('RIDE_OFFER_NOT_PENDING');

        const rideRef = doc(db, 'rides', offer.rideId);
        const rideSnap = await tx.get(rideRef);
        if (!rideSnap.exists()) throw new Error('RIDE_NOT_FOUND');
        const ride = rideSnap.data() as Ride;
        if (ride.driverId && ride.driverId !== driverId) throw new Error('RIDE_ALREADY_ASSIGNED');

        const acceptedAt = new Date().toISOString();
        tx.update(offerRef, { status: 'ACCEPTED', acceptedAt });
        tx.update(rideRef, {
          driverId,
          status: 'DRIVER_ASSIGNED',
          assignedAt: acceptedAt,
          updatedAt: serverTimestamp()
        });
        tx.update(doc(db, 'drivers', driverId), {
          driverStatus: 'IN_RIDE',
          isAcceptingRides: false,
          updatedAt: serverTimestamp()
        });
        return { ...offer, status: 'ACCEPTED' as const, acceptedAt };
      });
      return { success: true, rideOffer: acceptedOffer };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'RIDE_OFFER_ACCEPT_FAILED' };
    }
  }

  async rejectRideOffer(offerId: string, driverId: string): Promise<void> {
    await updateDoc(doc(db, 'rideOffers', offerId), {
      driverId,
      status: 'REJECTED',
      rejectedAt: new Date().toISOString()
    });
  }

  async getPendingOfferForDriver(driverId: string): Promise<RideOffer | null> {
    const snap = await getDocs(
      query(collection(db, 'rideOffers'), where('driverId', '==', driverId), where('status', '==', 'PENDING'), limit(1))
    );
    return snap.docs[0]?.data() as RideOffer | null;
  }
}

class FirestorePaymentRepository implements PaymentRepository {
  async createPayment(payment: PaymentRecord): Promise<PaymentRecord> {
    await setDoc(doc(db, 'payments', payment.paymentId), { ...payment, createdAt: serverTimestamp() });
    return payment;
  }

  async getPaymentById(paymentId: string): Promise<PaymentRecord | null> {
    const snap = await getDoc(doc(db, 'payments', paymentId));
    return snap.exists() ? (snap.data() as PaymentRecord) : null;
  }
}

class FirestoreWalletRepository implements WalletRepository {
  async recordLedgerTransaction(entry: WalletLedgerEntry): Promise<WalletLedgerEntry> {
    await setDoc(doc(db, 'walletTransactions', entry.transactionId), { ...entry, createdAt: serverTimestamp() });
    return entry;
  }

  async getLedger(userId: string): Promise<WalletLedgerEntry[]> {
    const snap = await getDocs(query(collection(db, 'walletTransactions'), where('userId', '==', userId), limit(100)));
    return snap.docs.map((item) => item.data() as WalletLedgerEntry);
  }
}

export const createFirestoreRepositories = (): RepositoryRegistry => ({
  rides: new FirestoreRideRepository(),
  drivers: new FirestoreDriverRepository(),
  passengers: new FirestorePassengerRepository(),
  dispatch: new FirestoreDispatchRepository(),
  payments: new FirestorePaymentRepository(),
  wallets: new FirestoreWalletRepository()
});
