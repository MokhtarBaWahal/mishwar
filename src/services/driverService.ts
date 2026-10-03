import { DispatchCandidateScore, DriverProfile, DriverStatus, GeoPoint, Ride, VehicleType } from '../../packages/shared_types/src';
import { calculateDistanceKm, estimateDurationMinutes } from '../../packages/shared_utils/src';
import { MOCK_DRIVERS } from '../data/mockData';

class DriverService {
  private drivers: DriverProfile[] = [...MOCK_DRIVERS];
  private dispatchLocks: Map<string, string> = new Map(); // driverId -> rideId

  getAllDrivers(): DriverProfile[] {
    return [...this.drivers];
  }

  getDriverById(id: string): DriverProfile | undefined {
    return this.drivers.find((d) => d.id === id);
  }

  setDriverOnlineStatus(driverId: string, isOnline: boolean): DriverProfile | undefined {
    const driver = this.drivers.find((d) => d.id === driverId);
    if (driver) {
      driver.driverStatus = isOnline ? 'ONLINE' : 'OFFLINE';
      driver.isAcceptingRides = isOnline;
      driver.updatedAt = new Date().toISOString();
      return { ...driver };
    }
    return undefined;
  }

  updateDriverStatus(driverId: string, status: DriverStatus): void {
    const driver = this.drivers.find((d) => d.id === driverId);
    if (driver) {
      driver.driverStatus = status;
      driver.isAcceptingRides = status === 'ONLINE';
      driver.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Smart Proximity Dispatch Algorithm (Requirement 7)
   * Validates:
   * 1. Driver Online & Accepting: d.isActive && d.driverStatus === 'ONLINE' && d.isAcceptingRides
   * 2. Driver Not Busy: d.driverStatus !== 'IN_RIDE' && !this.dispatchLocks.has(d.id)
   * 3. Vehicle Active: !d.vehicle.status || d.vehicle.status === 'ACTIVE'
   * 4. Vehicle Type Match: Matches requested type or compatible tier
   * 5. Vehicle Capacity: d.vehicle.capacity >= requested passengerCount
   * 6. AC Support: if airConditioningRequired === true, vehicle must have hasAC === true
   * 7. Allowed Distance: Driver within allowed maximum radius (e.g. 25 km)
   * 
   * Then sorts candidates by proximity using Haversine calculation.
   */
  findNearestAvailableDriver(
    pickup: GeoPoint,
    requestedVehicleType: VehicleType,
    options?: {
      passengerCount?: number;
      airConditioningRequired?: boolean;
      maxDistanceKm?: number;
    }
  ): DriverProfile | null {
    const ranked = this.rankAvailableDrivers(pickup, requestedVehicleType, options);
    return ranked[0]?.driver || null;
  }

  rankAvailableDrivers(
    pickup: GeoPoint,
    requestedVehicleType: VehicleType,
    options?: {
      passengerCount?: number;
      airConditioningRequired?: boolean;
      maxDistanceKm?: number;
      recentRides?: Ride[];
      hotCellDriverIds?: string[];
    }
  ): Array<DispatchCandidateScore & { driver: DriverProfile }> {
    const requiredCapacity = options?.passengerCount ?? 1;
    const acRequired = !!options?.airConditioningRequired;
    const maxRadius = options?.maxDistanceKm ?? 25;
    const now = Date.now();

    return this.drivers
      .filter((d) => this.isDispatchEligible(d, requestedVehicleType, requiredCapacity, acRequired))
      .map((driver) => {
        const loc = driver.currentLocation || { latitude: 15.35, longitude: 44.20, addressName: '' };
        const distanceKm = calculateDistanceKm(pickup, loc);
        const etaMinutes = estimateDurationMinutes(distanceKm, driver.vehicle?.type || requestedVehicleType);
        if (distanceKm > maxRadius) return null;

        const recentCompletedRide = options?.recentRides?.find(
          (ride) =>
            ride.driverId === driver.id &&
            ride.completedAt &&
            now - new Date(ride.completedAt).getTime() < 20 * 60 * 1000
        );

        const ratingScore = Math.round(driver.ratingAverage * 12);
        const etaScore = Math.max(0, 40 - etaMinutes * 2);
        const acceptanceRate = Math.min(0.98, 0.7 + driver.todayTripsCount * 0.015);
        const acceptanceScore = Math.round(acceptanceRate * 20);
        const vehicleScore = this.getVehicleMatchScore(driver.vehicle?.type || 'CAR', requestedVehicleType);
        const freshnessPenalty = recentCompletedRide ? 12 : 0;
        const balanceScore = options?.hotCellDriverIds?.includes(driver.id) ? -8 : 6;
        const totalScore = ratingScore + etaScore + acceptanceScore + vehicleScore + balanceScore - freshnessPenalty;
        const reasons = [
          `تقييم ${driver.ratingAverage.toFixed(1)}`,
          `ETA ${etaMinutes} دقيقة`,
          `قبول متوقع ${Math.round(acceptanceRate * 100)}%`,
          vehicleScore >= 20 ? 'مطابقة مركبة ممتازة' : 'مطابقة مركبة مقبولة'
        ];

        if (recentCompletedRide) reasons.push('أنهى رحلة مؤخراً، تم تخفيف أولوية الإسناد');
        if (balanceScore > 0) reasons.push('يساعد على توازن تغطية المناطق الساخنة');

        return {
          driver,
          driverId: driver.id,
          driverName: driver.fullName,
          distanceKm,
          etaMinutes,
          ratingScore,
          acceptanceScore,
          vehicleScore,
          freshnessPenalty,
          balanceScore,
          totalScore,
          reasons
        };
      })
      .filter((candidate): candidate is DispatchCandidateScore & { driver: DriverProfile } => Boolean(candidate))
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  private isDispatchEligible(
    driver: DriverProfile,
    requestedVehicleType: VehicleType,
    requiredCapacity: number,
    acRequired: boolean
  ): boolean {
    if (!driver.isActive) return false;
    if (driver.driverStatus !== 'ONLINE' || !driver.isAcceptingRides) return false;
    if (!driver.vehicle) return false;
    if (this.dispatchLocks.has(driver.id)) return false;
    if (driver.vehicle.status && driver.vehicle.status !== 'ACTIVE') return false;
    if (this.getVehicleMatchScore(driver.vehicle.type, requestedVehicleType) <= 0) return false;

    const vehCapacity = driver.vehicle.capacity || (driver.vehicle.type === 'MOTORCYCLE' ? 1 : driver.vehicle.type === 'FAMILY' ? 6 : 4);
    if (vehCapacity < requiredCapacity) return false;
    if (acRequired && !driver.vehicle.hasAC) return false;
    return true;
  }

  private getVehicleMatchScore(actual: VehicleType, requested: VehicleType): number {
    if (actual === requested) return 28;
    if (requested === 'ECONOMY' && (actual === 'CAR' || actual === 'COMFORT')) return 22;
    if (requested === 'CAR' && (actual === 'ECONOMY' || actual === 'COMFORT')) return 22;
    if (requested === 'COMFORT' && actual === 'CAR') return 12;
    return 0;
  }

  lockDriverForDispatch(driverId: string, rideId: string): boolean {
    if (this.dispatchLocks.has(driverId)) {
      return false; // Already locked by another ride
    }
    this.dispatchLocks.set(driverId, rideId);
    return true;
  }

  unlockDriver(driverId: string): void {
    this.dispatchLocks.delete(driverId);
  }

  isDriverLocked(driverId: string): boolean {
    return this.dispatchLocks.has(driverId);
  }

  updateDriverLocation(driverId: string, location: GeoPoint): void {
    const driver = this.drivers.find((d) => d.id === driverId);
    if (driver) {
      driver.currentLocation = location;
      driver.lastLocationUpdate = new Date().toISOString();
    }
  }

  addEarnings(driverId: string, netAmount: number): void {
    const driver = this.drivers.find((d) => d.id === driverId);
    if (driver) {
      driver.todayEarnings += netAmount;
      driver.walletBalance += netAmount;
      driver.todayTripsCount += 1;
      driver.updatedAt = new Date().toISOString();
    }
  }

  registerDriver(data: {
    fullName: string;
    phoneNumber: string;
    vehicleType: VehicleType;
    make: string;
    model: string;
    plateNumber: string;
    color: string;
  }): { success: boolean; message: string; driver?: DriverProfile } {
    const newId = `drv_${Date.now()}`;
    const newDriver: DriverProfile = {
      id: newId,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      role: 'DRIVER',
      isActive: true,
      ratingAverage: 5.0,
      ratingCount: 0,
      walletBalance: 0,
      driverStatus: 'PENDING_APPROVAL',
      isAcceptingRides: false,
      todayEarnings: 0,
      todayTripsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      vehicle: {
        id: `veh_${Date.now()}`,
        driverId: newId,
        type: data.vehicleType,
        vehicleType: data.vehicleType,
        make: data.make,
        model: data.model,
        year: 2023,
        color: data.color,
        plateNumber: data.plateNumber,
        isVerified: false,
        capacity: data.vehicleType === 'MOTORCYCLE' ? 1 : 4,
        hasAC: data.vehicleType !== 'MOTORCYCLE',
        status: 'ACTIVE'
      },
      currentLocation: { latitude: 15.35, longitude: 44.20, addressName: 'صنعاء' }
    };

    this.drivers.unshift(newDriver);
    return {
      success: true,
      message: 'تم تسجيل السائق بنجاح وهو بانتظار موافقة الإدارة',
      driver: newDriver
    };
  }

  resetDemoDrivers(): void {
    this.drivers = [...MOCK_DRIVERS];
    this.dispatchLocks.clear();
  }
}

export const driverService = new DriverService();
