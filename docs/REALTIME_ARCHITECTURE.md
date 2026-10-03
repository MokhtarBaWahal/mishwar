# Realtime Architecture

## Goal

Passenger and driver screens should react immediately to ride offers, assignment, status transitions, and driver location changes.

## Providers

- Demo: local simulator state.
- Pilot: Firestore listeners.
- Production: Firestore listeners or a dedicated realtime service if scale requires it.

## Required Subscriptions

- `rides/{rideId}`
- `rideOffers` filtered by `driverId` and `status=PENDING`
- `driver_locations/{driverId}`
- `notifications` filtered by `userId`

Listeners must be unsubscribed when leaving screens.
