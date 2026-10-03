# MISHWAR (مشوار) - API Documentation

## Standard Unified Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "error": null
}
```

Error format:
```json
{
  "success": false,
  "data": null,
  "message": "Detailed Arabic/English message",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

## Endpoints

### 1. `POST /api/pricing/calculate`
Calculates server-authoritative fare estimate.
- **Payload:**
  - `pickup`: `{ latitude, longitude }`
  - `destination`: `{ latitude, longitude }`
  - `vehicleType`: `'MOTORCYCLE' | 'CAR'`
  - `pricingRule`: PricingRule object
- **Response:**
  - `fare`: `{ baseFare, distanceKm, distanceFare, durationMinutes, timeFare, grossFare, platformCommission, driverNetEarnings, currency }`

### 2. `POST /api/rides/create`
Idempotent ride booking endpoint.
- **Headers:** `x-idempotency-key: <unique-client-uuid>`
- **Payload:**
  - `customerId`: string
  - `pickup`: GeoPoint
  - `destination`: GeoPoint
  - `vehicleType`: `'MOTORCYCLE' | 'CAR'`

### 3. `POST /api/sos/trigger`
Emergency panic button endpoint.
- **Payload:**
  - `rideId`: string
  - `triggeredByRole`: `'CUSTOMER' | 'DRIVER'`
  - `location`: GeoPoint
