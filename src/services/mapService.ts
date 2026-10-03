import { GeoPoint } from '../../packages/shared_types/src';
import { calculateDistanceKm } from '../../packages/shared_utils/src';

export interface RouteGeometry {
  distanceKm: number;
  durationMins: number;
  points: { lat: number; lng: number }[];
}

export interface IMapService {
  calculateRoute(pickup: GeoPoint, destination: GeoPoint): Promise<RouteGeometry>;
  interpolatePosition(start: GeoPoint, end: GeoPoint, fraction: number): { lat: number; lng: number; bearing: number };
}

/**
 * Clean Map Service Abstraction (can seamlessly switch to Google Maps Directions API or Mapbox in production)
 */
export class MockMapService implements IMapService {
  async calculateRoute(pickup: GeoPoint, destination: GeoPoint): Promise<RouteGeometry> {
    const distanceKm = calculateDistanceKm(
      { latitude: pickup.latitude, longitude: pickup.longitude },
      { latitude: destination.latitude, longitude: destination.longitude }
    );
    
    // Average urban speed in Sana'a (~22 km/h)
    const durationMins = Math.max(3, Math.round((distanceKm / 22) * 60));

    // Generate intermediate waypoints to simulate road curves
    const steps = 12;
    const points: { lat: number; lng: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      // Add slight organic road deviation
      const curve = Math.sin(f * Math.PI) * 0.003;
      points.push({
        lat: pickup.latitude + (destination.latitude - pickup.latitude) * f + curve,
        lng: pickup.longitude + (destination.longitude - pickup.longitude) * f - curve * 0.5
      });
    }

    return {
      distanceKm: Math.max(0.8, distanceKm),
      durationMins,
      points
    };
  }

  interpolatePosition(start: GeoPoint, end: GeoPoint, fraction: number): { lat: number; lng: number; bearing: number } {
    const clamped = Math.max(0, Math.min(1, fraction));
    const lat = start.latitude + (end.latitude - start.latitude) * clamped;
    const lng = start.longitude + (end.longitude - start.longitude) * clamped;

    // Calculate heading/bearing
    const y = Math.sin((end.longitude - start.longitude) * Math.PI / 180) * Math.cos(end.latitude * Math.PI / 180);
    const x = Math.cos(start.latitude * Math.PI / 180) * Math.sin(end.latitude * Math.PI / 180) -
              Math.sin(start.latitude * Math.PI / 180) * Math.cos(end.latitude * Math.PI / 180) *
              Math.cos((end.longitude - start.longitude) * Math.PI / 180);
    const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

    return { lat, lng, bearing };
  }
}

export const mapService = new MockMapService();
