import { GeoPoint } from '../../packages/shared_types/src';
import { calculateDistanceKm } from '../../packages/shared_utils/src';
import { IMapService, RouteGeometry } from './mapService';

export class GoogleMapsService implements IMapService {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  }

  async calculateRoute(pickup: GeoPoint, destination: GeoPoint): Promise<RouteGeometry> {
    // If API Key is configured, attempt real Google Directions API call
    if (this.apiKey && this.apiKey.length > 10 && !this.apiKey.includes('YOUR_GOOGLE')) {
      try {
        const origin = `${pickup.latitude},${pickup.longitude}`;
        const dest = `${destination.latitude},${destination.longitude}`;
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&mode=driving&key=${this.apiKey}`;
        
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'OK' && data.routes?.[0]?.legs?.[0]) {
          const leg = data.routes[0].legs[0];
          const distanceKm = leg.distance.value / 1000;
          const durationMins = Math.ceil(leg.duration.value / 60);

          // Extract coordinates from steps
          const points: { lat: number; lng: number }[] = [];
          for (const step of leg.steps) {
            points.push({
              lat: step.start_location.lat,
              lng: step.start_location.lng
            });
          }
          points.push({
            lat: leg.end_location.lat,
            lng: leg.end_location.lng
          });

          return { distanceKm, durationMins, points };
        }
      } catch (err) {
        console.warn('[GoogleMapsService] API call failed, falling back to local geometric route:', err);
      }
    }

    // High-precision geometric fallback for Sana'a / Aden streets
    const distanceKm = calculateDistanceKm(
      { latitude: pickup.latitude, longitude: pickup.longitude },
      { latitude: destination.latitude, longitude: destination.longitude }
    );
    const durationMins = Math.max(3, Math.round((distanceKm / 22) * 60));

    const steps = 12;
    const points: { lat: number; lng: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
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

    const y = Math.sin((end.longitude - start.longitude) * Math.PI / 180) * Math.cos(end.latitude * Math.PI / 180);
    const x = Math.cos(start.latitude * Math.PI / 180) * Math.sin(end.latitude * Math.PI / 180) -
              Math.sin(start.latitude * Math.PI / 180) * Math.cos(end.latitude * Math.PI / 180) *
              Math.cos((end.longitude - start.longitude) * Math.PI / 180);
    const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

    return { lat, lng, bearing };
  }
}

export const googleMapsService = new GoogleMapsService();
