import { AuditLog, Ride, UserProfile, DriverProfile } from '../../packages/shared_types/src';
import { MOCK_AUDIT_LOGS } from '../data/mockData';
import { rideService } from './rideService';
import { driverService } from './driverService';
import { passengerService } from './passengerService';

class AdminService {
  private auditLogs: AuditLog[] = [...MOCK_AUDIT_LOGS];

  getDashboardKPIs() {
    const rides = rideService.getAllRides();
    const drivers = driverService.getAllDrivers();
    const customers = passengerService.getAllPassengers();

    const completedRides = rides.filter((r) => r.status === 'TRIP_COMPLETED');
    const cancelledRides = rides.filter((r) => r.status.startsWith('CANCEL'));
    const activeRides = rides.filter((r) => !['TRIP_COMPLETED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_DRIVER', 'NO_DRIVER_FOUND'].includes(r.status));
    const onlineDrivers = drivers.filter((d) => d.driverStatus === 'ONLINE' || d.driverStatus === 'IN_RIDE');

    const totalRevenue = completedRides.reduce((sum, r) => sum + r.fare.grossFare, 0);
    const platformCommission = completedRides.reduce((sum, r) => sum + r.fare.platformCommission, 0);
    const driverEarnings = completedRides.reduce((sum, r) => sum + r.fare.driverNetEarnings, 0);

    const averageRating =
      drivers.reduce((acc, curr) => acc + curr.ratingAverage, 0) / (drivers.length || 1);

    return {
      totalRides: rides.length,
      completedRidesCount: completedRides.length,
      activeRidesCount: activeRides.length,
      cancelledRidesCount: cancelledRides.length,
      onlineDriversCount: onlineDrivers.length,
      totalDriversCount: drivers.length,
      totalCustomersCount: customers.length,
      totalRevenue,
      platformCommission,
      driverEarnings,
      averageRating: Math.round(averageRating * 10) / 10
    };
  }

  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  logAdminAction(
    adminEmail: string,
    action: string,
    targetType: 'DRIVER' | 'CUSTOMER' | 'RIDE' | 'PRICING' | 'ZONE' | 'SYSTEM',
    targetId: string,
    details?: Record<string, unknown>
  ): void {
    const log: AuditLog = {
      id: `log_${Date.now()}`,
      adminId: 'admin_root',
      adminEmail,
      action,
      targetType,
      targetId,
      timestamp: new Date().toISOString(),
      details
    };
    this.auditLogs.unshift(log);
  }
}

export const adminService = new AdminService();
