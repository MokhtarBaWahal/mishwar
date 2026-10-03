import { City, GeoPoint, VehicleType } from '../../packages/shared_types/src';
import { calculateDistanceKm, estimateDurationMinutes } from '../../packages/shared_utils/src';
import { POPULAR_LOCATIONS } from '../data/mockData';
import { gpsService } from './gpsService';

export const CITIES_DATA: City[] = [
  {
    id: 'city_sanaa',
    nameAr: 'صنعاء (العاصمة)',
    nameEn: 'Sana\'a',
    countryCode: 'YE',
    center: { latitude: 15.3694, longitude: 44.1910, addressName: 'ميدان التحرير، صنعاء' },
    isActive: true
  },
  {
    id: 'city_aden',
    nameAr: 'عدن (العاصمة الاقتصادية)',
    nameEn: 'Aden',
    countryCode: 'YE',
    center: { latitude: 12.7794, longitude: 45.0367, addressName: 'جولة كالتكس، المنصورة، عدن' },
    isActive: true
  },
  {
    id: 'city_taiz',
    nameAr: 'تعز',
    nameEn: 'Taiz',
    countryCode: 'YE',
    center: { latitude: 13.5789, longitude: 44.0178, addressName: 'جولة الحوض، تعز' },
    isActive: true
  }
];

class LocationService {
  getCities(): City[] {
    return CITIES_DATA;
  }

  getCityById(id: string): City | undefined {
    return CITIES_DATA.find((c) => c.id === id);
  }

  getPopularLocations(cityId?: string): GeoPoint[] {
    // Return Yemeni coordinates
    return POPULAR_LOCATIONS.map((loc) => ({
      latitude: loc.lat,
      longitude: loc.lng,
      addressName: loc.nameAr,
      landmark: loc.nameEn
    }));
  }

  /**
   * Search for locations / landmarks matching query string
   */
  searchLocations(query: string): GeoPoint[] {
    if (!query || !query.trim()) {
      return this.getPopularLocations().slice(0, 5);
    }
    const q = query.trim().toLowerCase();
    const matches = POPULAR_LOCATIONS.filter(
      (loc) => loc.nameAr.toLowerCase().includes(q) || (loc.nameEn && loc.nameEn.toLowerCase().includes(q))
    );
    return matches.map((loc) => ({
      latitude: loc.lat,
      longitude: loc.lng,
      addressName: loc.nameAr,
      landmark: loc.nameEn
    }));
  }

  calculateDistance(from: GeoPoint, to: GeoPoint): number {
    return calculateDistanceKm(
      { latitude: from.latitude, longitude: from.longitude },
      { latitude: to.latitude, longitude: to.longitude }
    );
  }

  estimateDuration(distanceKm: number, vehicleType: VehicleType): number {
    return estimateDurationMinutes(distanceKm, vehicleType);
  }

  async getCurrentDeviceLocation(): Promise<{ success: boolean; location?: GeoPoint; error?: string }> {
    return await gpsService.getCurrentPosition();
  }

  reverseGeocode(lat: number, lng: number): string {
    // Find closest popular landmark if available
    let closestName = `موقع محدد (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
    let minDist = Infinity;

    for (const loc of POPULAR_LOCATIONS) {
      const d = calculateDistanceKm({ latitude: lat, longitude: lng }, { latitude: loc.lat, longitude: loc.lng });
      if (d < 0.3 && d < minDist) {
        minDist = d;
        closestName = `بالقرب من ${loc.nameAr}`;
      }
    }

    return closestName;
  }
}

export const locationService = new LocationService();
