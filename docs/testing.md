# MISHWAR (مشوار) - Testing & Quality Assurance

## 1. Automated Unit Tests Run
The unit tests verify:
- **Haversine Distance**: Correct kilometer calculation between locations in Sana'a (Hadda, Tahrir, Sixty).
- **Pricing Formula**: Base fare + distance fare + time fare with minimum fare threshold and 10% commission.
- **Ride State Machine**: Complete flow enforcement and invalid transition prevention.
- **Yemeni Carriers Phone Validation**: Ensures numbers start with 77, 78, 73, 71, 70 with 9 digits.

## 2. End-to-End Simulation Test Sequence
1. **Customer Login / Profile**: Active customer selected.
2. **Location Selection**: Pickup: شارع حدة; Destination: ميدان التحرير.
3. **Vehicle Selection**: Motorcycle (🏍️) / Car (🚗) $\to$ Instant Fare calculation in YER.
4. **Order Ride**: Dispatch engine activates, locks nearby online driver.
5. **Incoming Request**: Driver receives notification with 15s timer and earnings breakdown.
6. **Accept**: Status transitions to `DRIVER_ARRIVING`, driver vehicle moves on live map.
7. **Arrive**: Driver clicks "وصلت إلى العميل", status updates to `DRIVER_ARRIVED`.
8. **Start Trip**: Driver clicks "بدء المشوار", status transitions to `TRIP_STARTED`.
9. **In-Trip Features**: Live in-app chat, calling, and SOS emergency button.
10. **Complete Trip**: Driver marks trip completed, collects cash fare in YER.
11. **Driver Earnings**: 90% net earnings credited to driver wallet, 10% recorded as platform commission.
12. **Customer Rating**: 1-5 star review submitted, updates driver aggregate rating.
13. **Admin Monitoring**: Real-time KPI cards update instantly in the Admin Dashboard!

## 3. Current Validation Commands

Web:

```bash
npm.cmd run lint
npm.cmd run build
```

Backend:

```bash
cd backend
npm.cmd run typecheck
npm.cmd run build
```

## 4. Known Test Gap

`src/tests/mishwar.test.ts` still behaves as an in-app diagnostic suite and imports browser/Vite-only services. It must be migrated to a standalone Vitest suite before `npm run test` can be considered complete.

Required future coverage:

- Pricing and minimum fares.
- State machine transitions.
- Dispatch capacity and AC matching.
- Driver busy/offline/no-driver cases.
- Backend authentication and role rejection.
- Backend ride lifecycle endpoints.
- Payment and wallet idempotency.
- Repository behavior for mock and Firestore implementations.
