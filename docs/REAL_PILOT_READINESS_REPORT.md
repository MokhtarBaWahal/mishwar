# Real Pilot Readiness Report

| Feature | Status | Real/Mock | Tested | Notes |
| --- | --- | --- | --- | --- |
| Web Passenger | Partial | Mock + partial real hooks | Build/typecheck | Main flow still in `MishwarContext`. |
| Web Driver | Partial | Mock + partial real hooks | Build/typecheck | Incoming ride still simulator-driven. |
| Admin | Partial | Mock metrics | Build/typecheck | Mode badge added in top nav. |
| Flutter Passenger | Partial | Mock/API health | Not tested | Needs full booking flow. |
| Flutter Driver | Partial | Mock/API health | Not tested | Needs offer and trip lifecycle. |
| Backend | Partial | Memory + auth/validation foundation | Typecheck/build | New `/api/rides` foundation added. |
| Firebase | Partial | Scaffolded | Not connected | Requires real project and credentials. |
| Authentication | Partial | Demo/Firebase scaffold | Typecheck/build | Demo OTP blocked outside demo config. |
| OTP | Partial | Demo only | Typecheck/build | Real SMS not configured. |
| Firestore | Partial | Repository scaffold | Typecheck/build | Needs transaction-backed backend persistence. |
| Maps | Partial | Mock/Google scaffold | Build/typecheck | Real key required. |
| GPS | Partial | Browser/mobile scaffold | Build/typecheck | Device testing required. |
| Realtime | Partial | Firestore listener scaffold | Build/typecheck | Not wired end-to-end. |
| Dispatch | Partial | Mock/in-memory | Build/typecheck | Firestore offer type and repo added. |
| Pricing | Real logic | Shared engine | Build/typecheck | Backend recalculates for new route API. |
| Payments | Partial | Mock/memory | Build/typecheck | Real payment forced off. |
| Wallet | Partial | Mock/memory | Build/typecheck | Ledger exists but backend transaction persistence pending. |
| Notifications | Partial | Mock/FCM planned | Build/typecheck | No server credentials in frontend. |
| SOS | Partial | Mock/report scaffold | Build/typecheck | Real responder integration not configured. |
| Security Rules | Partial | Firebase rules | Not deployed | New collections added. |
| Tests | Partial | UI diagnostics | Some direct run failed previously | Vitest migration pending. |
| CI | Not implemented | N/A | Not tested | Pending P2. |
