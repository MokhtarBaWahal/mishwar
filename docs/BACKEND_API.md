# Backend API

Base URL defaults to `http://localhost:4000/api`.

## Authentication

Pilot/production requests must send `Authorization: Bearer <Firebase ID token>`.

Demo/development may use `API_TOKEN` or no token only when strict mode is disabled.

## Ride API

- `POST /api/rides`
- `GET /api/rides/:id`
- `POST /api/rides/:id/accept`
- `POST /api/rides/:id/cancel`
- `POST /api/rides/:id/arrived`
- `POST /api/rides/:id/start`
- `POST /api/rides/:id/complete`

`POST /api/rides` requires `x-idempotency-key` and recalculates fare server-side from pickup, destination, vehicle type, passenger count, and current pricing rules.

Legacy routes remain for compatibility:

- `POST /api/rides/create`
- `POST /api/dispatch/accept`
- `POST /api/payments/ride`

## Validation

The backend validates coordinates, vehicle type, passenger count, payment method, and positive payment amounts. Invalid requests return:

```json
{
  "success": false,
  "data": null,
  "message": "Human readable message",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```
