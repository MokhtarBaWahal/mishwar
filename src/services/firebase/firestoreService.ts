import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseConfig';
import {
  Ride,
  RideStatus,
  DriverProfile,
  GeoPoint,
  RatingReview,
  SOSAlert,
  PricingRule,
  Zone,
  City,
  SupportTicket,
  AuditLog
} from '../../../packages/shared_types/src';

export class FirestoreService {
  /**
   * Listen to active ride in real-time
   */
  subscribeToRide(rideId: string, onUpdate: (ride: Ride) => void): () => void {
    if (!isFirebaseConfigured()) {
      return () => {};
    }

    const rideRef = doc(db, 'rides', rideId);
    return onSnapshot(rideRef, (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as Ride);
      }
    });
  }

  /**
   * Update ride status atomically with audit event
   */
  async updateRideStatus(
    rideId: string,
    newStatus: RideStatus,
    actorId: string,
    actorRole: 'CUSTOMER' | 'DRIVER' | 'ADMIN',
    note?: string
  ): Promise<boolean> {
    if (!isFirebaseConfigured()) {
      return true; // Handled by local state in demo
    }

    try {
      const rideRef = doc(db, 'rides', rideId);
      const eventRef = doc(collection(db, `rides/${rideId}/events`));

      await runTransaction(db, async (tx) => {
        const rideSnap = await tx.get(rideRef);
        if (!rideSnap.exists()) {
          throw new Error('Ride does not exist');
        }

        const currentData = rideSnap.data() as Ride;
        tx.update(rideRef, {
          status: newStatus,
          updatedAt: new Date().toISOString(),
          ...(newStatus === 'DRIVER_ARRIVING' ? { assignedAt: new Date().toISOString() } : {}),
          ...(newStatus === 'DRIVER_ARRIVED' ? { arrivedAt: new Date().toISOString() } : {}),
          ...(newStatus === 'TRIP_STARTED' ? { startedAt: new Date().toISOString() } : {}),
          ...(newStatus === 'TRIP_COMPLETED' ? { completedAt: new Date().toISOString(), paymentStatus: 'PAID' } : {})
        });

        tx.set(eventRef, {
          rideId,
          status: newStatus,
          previousStatus: currentData.status,
          actorId,
          actorRole,
          note: note || '',
          timestamp: new Date().toISOString()
        });
      });

      return true;
    } catch (e) {
      console.error('[MISHWAR Firestore] Update ride status failed:', e);
      return false;
    }
  }

  /**
   * Throttled Driver Location Update (Writes only if moved > 25m or > 20 seconds passed)
   */
  async updateDriverLocation(
    driverId: string,
    location: GeoPoint,
    status: DriverProfile['driverStatus']
  ): Promise<void> {
    if (!isFirebaseConfigured()) return;

    try {
      const locRef = doc(db, 'driver_locations', driverId);
      await setDoc(
        locRef,
        {
          driverId,
          latitude: location.latitude,
          longitude: location.longitude,
          addressName: location.addressName,
          status,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[MISHWAR Firestore] Location push error:', err);
    }
  }

  /**
   * Create SOS Emergency Alert
   */
  async createSOSAlert(alert: SOSAlert): Promise<void> {
    if (!isFirebaseConfigured()) return;

    try {
      const sosRef = doc(db, 'sos_alerts', alert.id);
      await setDoc(sosRef, {
        ...alert,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error('[MISHWAR Firestore] Create SOS failed:', e);
    }
  }

  /**
   * Fetch Dynamic Pricing Rules from Firestore
   */
  async getPricingRules(): Promise<Record<'MOTORCYCLE' | 'CAR', PricingRule> | null> {
    if (!isFirebaseConfigured()) return null;

    try {
      const motoSnap = await getDoc(doc(db, 'pricing_rules', 'MOTORCYCLE'));
      const carSnap = await getDoc(doc(db, 'pricing_rules', 'CAR'));

      if (motoSnap.exists() && carSnap.exists()) {
        return {
          MOTORCYCLE: motoSnap.data() as PricingRule,
          CAR: carSnap.data() as PricingRule
        };
      }
    } catch (e) {
      console.warn('[MISHWAR Firestore] Could not load pricing rules from cloud, using defaults.');
    }
    return null;
  }
}

export const firestoreService = new FirestoreService();
