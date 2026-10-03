import { City, DriverProfile, GeoPoint, Ride } from '../../packages/shared_types/src';
import { calculateDistanceKm } from '../../packages/shared_utils/src';

export type OperationsCellStatus = 'HOT' | 'BALANCED' | 'UNDERSERVED' | 'QUIET';

export interface OperationsCell {
  id: string;
  label: string;
  center: GeoPoint;
  rideCount: number;
  activeDrivers: number;
  completedRides: number;
  cancelledRides: number;
  averageFare: number;
  cancellationRate: number;
  demandScore: number;
  supplyGap: number;
  status: OperationsCellStatus;
  recommendation: string;
}

export interface OperationsSummary {
  cells: OperationsCell[];
  hotCells: number;
  underservedCells: number;
  totalDemand: number;
  totalActiveDrivers: number;
  averageFare: number;
  cancellationRate: number;
  topRecommendation: string;
}

const CELL_SIZE_KM = 2.5;
const KM_PER_LAT = 111;

const toCellId = (point: GeoPoint, city: City): string => {
  const latKm = (point.latitude - city.center.latitude) * KM_PER_LAT;
  const lngKm = (point.longitude - city.center.longitude) * KM_PER_LAT * Math.cos((city.center.latitude * Math.PI) / 180);
  const q = Math.round(lngKm / CELL_SIZE_KM);
  const r = Math.round((latKm - q * CELL_SIZE_KM * 0.5) / CELL_SIZE_KM);
  return `${q}:${r}`;
};

const cellCenter = (id: string, city: City): GeoPoint => {
  const [q, r] = id.split(':').map(Number);
  const latKm = (r + q * 0.5) * CELL_SIZE_KM;
  const lngKm = q * CELL_SIZE_KM;

  return {
    latitude: city.center.latitude + latKm / KM_PER_LAT,
    longitude: city.center.longitude + lngKm / (KM_PER_LAT * Math.cos((city.center.latitude * Math.PI) / 180)),
    addressName: `خلية تشغيل ${q}, ${r}`
  };
};

const isRelevantToCity = (point: GeoPoint, city: City): boolean => {
  return calculateDistanceKm(point, city.center) <= 35;
};

const classifyCell = (rideCount: number, activeDrivers: number, cancellationRate: number): OperationsCellStatus => {
  if (rideCount >= 8 && activeDrivers <= 1) return 'HOT';
  if (rideCount >= 4 && activeDrivers === 0) return 'UNDERSERVED';
  if (rideCount <= 1 && activeDrivers >= 3) return 'QUIET';
  if (cancellationRate >= 30 && rideCount >= 3) return 'HOT';
  return 'BALANCED';
};

const recommendationFor = (status: OperationsCellStatus, supplyGap: number, cancellationRate: number): string => {
  if (status === 'HOT') {
    return supplyGap > 0
      ? `انقل ${supplyGap} كابتن إلى هذه المنطقة خلال الذروة القادمة`
      : 'راقب المنطقة وارفع أولوية التوزيع فيها';
  }
  if (status === 'UNDERSERVED') return 'منطقة طلب بدون تغطية كافية، رشح أقرب كابتن متاح';
  if (status === 'QUIET') return 'المعروض أعلى من الطلب، يمكن سحب كابتن لمنطقة أكثر نشاطاً';
  if (cancellationRate >= 20) return 'راجع أسباب الإلغاء أو زمن الوصول في هذه المنطقة';
  return 'التوازن جيد، استمر بالمراقبة';
};

class OperationsAnalyticsService {
  buildSummary(params: {
    city: City;
    rides: Ride[];
    drivers: DriverProfile[];
  }): OperationsSummary {
    const { city, rides, drivers } = params;
    const cellMap = new Map<string, {
      rides: Ride[];
      drivers: DriverProfile[];
    }>();

    const ensureCell = (id: string) => {
      if (!cellMap.has(id)) {
        cellMap.set(id, { rides: [], drivers: [] });
      }
      return cellMap.get(id)!;
    };

    rides
      .filter((ride) => isRelevantToCity(ride.pickup, city))
      .forEach((ride) => {
        ensureCell(toCellId(ride.pickup, city)).rides.push(ride);
      });

    drivers
      .filter((driver) => driver.currentLocation && isRelevantToCity(driver.currentLocation, city))
      .forEach((driver) => {
        ensureCell(toCellId(driver.currentLocation!, city)).drivers.push(driver);
      });

    const cells = Array.from(cellMap.entries()).map(([id, value]) => {
      const rideCount = value.rides.length;
      const completedRides = value.rides.filter((ride) => ride.status === 'TRIP_COMPLETED').length;
      const cancelledRides = value.rides.filter((ride) => ride.status.startsWith('CANCELLED')).length;
      const activeDrivers = value.drivers.filter(
        (driver) => driver.driverStatus === 'ONLINE' || driver.driverStatus === 'IN_RIDE'
      ).length;
      const totalFare = value.rides.reduce((sum, ride) => sum + (ride.finalFare || ride.estimatedFare || ride.fare.grossFare), 0);
      const averageFare = rideCount > 0 ? Math.round(totalFare / rideCount) : 0;
      const cancellationRate = rideCount > 0 ? Math.round((cancelledRides / rideCount) * 100) : 0;
      const demandScore = rideCount * 10 + cancellationRate - activeDrivers * 4;
      const suggestedDrivers = Math.max(1, Math.ceil(rideCount / 4));
      const supplyGap = Math.max(0, suggestedDrivers - activeDrivers);
      const status = classifyCell(rideCount, activeDrivers, cancellationRate);

      return {
        id,
        label: `خلية ${id}`,
        center: cellCenter(id, city),
        rideCount,
        activeDrivers,
        completedRides,
        cancelledRides,
        averageFare,
        cancellationRate,
        demandScore,
        supplyGap,
        status,
        recommendation: recommendationFor(status, supplyGap, cancellationRate)
      };
    });

    const sortedCells = cells.sort((a, b) => b.demandScore - a.demandScore);
    const totalDemand = sortedCells.reduce((sum, cell) => sum + cell.rideCount, 0);
    const totalActiveDrivers = sortedCells.reduce((sum, cell) => sum + cell.activeDrivers, 0);
    const totalFare = sortedCells.reduce((sum, cell) => sum + cell.averageFare * cell.rideCount, 0);
    const totalCancelled = sortedCells.reduce((sum, cell) => sum + cell.cancelledRides, 0);
    const hotCells = sortedCells.filter((cell) => cell.status === 'HOT').length;
    const underservedCells = sortedCells.filter((cell) => cell.status === 'UNDERSERVED').length;
    const topRecommendation =
      sortedCells.find((cell) => cell.status === 'HOT' || cell.status === 'UNDERSERVED')?.recommendation ||
      'توزيع الأسطول متوازن حالياً';

    return {
      cells: sortedCells,
      hotCells,
      underservedCells,
      totalDemand,
      totalActiveDrivers,
      averageFare: totalDemand > 0 ? Math.round(totalFare / totalDemand) : 0,
      cancellationRate: totalDemand > 0 ? Math.round((totalCancelled / totalDemand) * 100) : 0,
      topRecommendation
    };
  }
}

export const operationsAnalyticsService = new OperationsAnalyticsService();
