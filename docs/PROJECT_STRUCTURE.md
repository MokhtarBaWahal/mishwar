# Project Structure

This repository is organized to separate the product layers and keep deployment concerns isolated.

## Top level

- apps/
  - Flutter customer and driver apps.
  - Each app owns its own pubspec and runtime entry point.
- backend/
  - Express API, demo auth, validation, route logic, and runtime configuration.
- packages/
  - Shared types and reusable logic used by multiple app layers.
- src/
  - React web app and browser-based simulator used for admin and demo flows.
- firebase/
  - Firestore and storage rules and Firebase project configuration.
- docs/
  - Design, deployment, security, readiness, and operations documentation.
- scripts/
  - Maintenance and migration helpers.
- dist/
  - Build output for production artifacts.
- .env.*
  - Environment-specific configuration. Keep secrets out of source control.

## App structure

- apps/customer_app/
  - Customer Flutter app.
- apps/driver_app/
  - Driver Flutter app.
- apps/mishwar_shared/
  - Shared Flutter map and API models used by both apps.

## Backend structure

- backend/src/
  - Server entry point, auth, config, validation, and ride APIs.
- backend/src/server.ts
  - Core backend runtime and route definitions.

## Shared packages

- packages/shared_types/
  - Domain models and enums.
- packages/shared_utils/
  - Reusable validation, pricing, and helper logic.

## Why this layout works

- Product apps stay independent.
- Backend and web app can evolve without conflicting with mobile app configuration.
- Deployment and security assets are kept together.
- Shared logic is centralized instead of duplicated across apps.

## Suggested next cleanup

When the project moves toward production, keep this layout and add:

- config/
  - environment templates and deployment configuration
- infra/
  - IaC and deployment manifests
- tests/
  - cross-platform integration and E2E tests
