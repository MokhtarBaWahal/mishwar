# MISHWAR (مشوار) - Maps & Geolocation Architecture

## 1. Map Abstraction Layer (`IMapService`)
The application defines an interface `IMapService` in `src/services/mapService.ts` to prevent tight coupling with any single mapping vendor:
- `calculateRoute(pickup, destination): Promise<RouteGeometry>`
- `interpolatePosition(start, end, fraction): { lat, lng, bearing }`

## 2. Dual Provider Strategy
1. **`MockMapService`:**
   - Active when `VITE_USE_MOCK_MAPS=true` or during local development/offline testing.
   - Computes Great-Circle Haversine distance and synthesizes realistic urban road curvature along major Sana'a & Aden arteries (Zubairi, Hadda, Ring Road, Tahrir, Caltex).
   - Zero API costs, zero external dependencies.
2. **`GoogleMapsService`:**
   - Active in `PILOT` mode when a valid `VITE_GOOGLE_MAPS_API_KEY` is provided.
   - Consumes Google Maps Directions API and Distance Matrix.
   - Graceful fallback: If an API quota is exceeded or network fails, automatically falls back to high-precision geometric routing with explicit console warnings.

## 3. Google Maps API Keys Security & Restrictions
To prevent API key theft or quota abuse in production:
- **Web Browser Key:** Restricted by HTTP referrers (e.g., `https://mishwar-ye.com/*`, `https://*.run.app/*`).
- **Android Key:** Restricted by package name (`com.mishwar.customer`, `com.mishwar.driver`) and SHA-1 certificate fingerprint.
- **iOS Key:** Restricted by iOS Bundle Identifier (`com.mishwar.customer`, `com.mishwar.driver`).
- **Server Geocoding Key:** Restricted by IP address of the backend Cloud Run or VPS instance.
