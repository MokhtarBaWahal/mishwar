# Apps

This folder contains the product applications.

## Flutter apps

- customer_app/
  - Rider experience.
  - Handles booking, map pin selection, fare display, and trip status.
- driver_app/
  - Driver experience.
  - Handles incoming rides, trip state changes, and live location sharing.
- mishwar_shared/
  - Shared map, API client, and cross-app logic.

## Keep app-specific code in app folders

Avoid placing web-only or backend-only code in the mobile app folders. Keep them focused on one concern:

- UI screens
- API calls for that app
- Native runtime behavior
- app-specific configuration
