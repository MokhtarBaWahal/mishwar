import { Vehicle, VehicleType } from '../../packages/shared_types/src';

class VehicleService {
  private vehicles: Vehicle[] = [
    {
      id: 'veh_01',
      driverId: 'drv_01',
      type: 'MOTORCYCLE',
      vehicleType: 'MOTORCYCLE',
      make: 'Haojue',
      model: 'HJ150',
      year: 2023,
      color: 'أسود مطفي',
      plateNumber: 'صنعاء 48291/د',
      isVerified: true,
      capacity: 1,
      hasAC: false,
      status: 'ACTIVE'
    },
    {
      id: 'veh_02',
      driverId: 'drv_02',
      type: 'ECONOMY',
      vehicleType: 'ECONOMY',
      make: 'Toyota',
      model: 'Yaris',
      year: 2018,
      color: 'أبيض لؤلؤي',
      plateNumber: 'صنعاء 105822/أ',
      isVerified: true,
      capacity: 4,
      hasAC: true,
      status: 'ACTIVE'
    },
    {
      id: 'veh_03',
      driverId: 'drv_03',
      type: 'COMFORT',
      vehicleType: 'COMFORT',
      make: 'Hyundai',
      model: 'Elantra',
      year: 2021,
      color: 'فضي معدني',
      plateNumber: 'صنعاء 88319/أ',
      isVerified: true,
      capacity: 4,
      hasAC: true,
      status: 'ACTIVE'
    },
    {
      id: 'veh_04',
      driverId: 'drv_04',
      type: 'FAMILY',
      vehicleType: 'FAMILY',
      make: 'Toyota',
      model: 'Innova (7 مقاعد)',
      year: 2020,
      color: 'رصاصي',
      plateNumber: 'صنعاء 14902/أ',
      isVerified: true,
      capacity: 6,
      hasAC: true,
      status: 'ACTIVE'
    }
  ];

  getAllVehicles(): Vehicle[] {
    return [...this.vehicles];
  }

  getVehicleByDriverId(driverId: string): Vehicle | undefined {
    return this.vehicles.find((v) => v.driverId === driverId);
  }

  registerVehicle(data: Omit<Vehicle, 'id'>): Vehicle {
    const newVeh: Vehicle = {
      ...data,
      id: `veh_${Date.now()}`
    };
    this.vehicles.push(newVeh);
    return newVeh;
  }

  verifyVehicle(vehicleId: string, isVerified: boolean): void {
    const v = this.vehicles.find((item) => item.id === vehicleId);
    if (v) {
      v.isVerified = isVerified;
    }
  }
}

export const vehicleService = new VehicleService();
