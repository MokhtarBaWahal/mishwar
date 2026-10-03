# MISHWAR (مشوار) - Security Checklist & Guard Rails (قائمة التحقق الأمني)

This document certifies the security controls, data isolation measures, and role-based permissions implemented in MISHWAR.

---

## 1. Role-Based Access Control (RBAC)

| Role | Access Permissions & Guard Rails |
| :--- | :--- |
| **CUSTOMER** | Allowed to book rides, view own history, chat in active ride, top-up own wallet, trigger SOS. **Strictly blocked from accessing Admin Dashboard, modifying driver ratings directly, or viewing other passengers' data.** |
| **DRIVER** | Allowed to accept/decline assigned requests, toggle online/offline status, view own daily earnings and payout documents. **Strictly blocked from altering pricing rules or passenger profiles.** |
| **ADMIN** | Full platform oversight, pricing tariff adjustments, driver KYC verification/suspension, SOS resolution, and audit log inspection. |
| **DISPATCHER** | Fleet management, manual dispatch overrides, customer support ticket updates. |
| **SUPER_ADMIN**| Global platform settings, pilot quotas, security configuration changes. |

---

## 2. Data Isolation & Privacy

- **Passenger Isolation:**
  - Query filters enforce `customerId == currentCustomer.id`.
  - Saved locations and notifications partitioned strictly by `userId`.
- **Driver Isolation:**
  - Drivers only receive incoming dispatch requests assigned to them.
  - Driver earnings and balance reports scoped strictly to `driverId`.
- **Audit Logs:**
  - All sensitive events (logins, cancellations, KYC approval, pricing alterations) recorded with actor, action, target, timestamp, and metadata.

---

## 3. Financial Ledger & Double-Deduction Prevention

- **Immutable Transactions:**
  - Account balances cannot be modified directly via raw increments.
  - Every balance mutation requires a corresponding `WalletLedgerEntry` recording `balanceBefore` and `balanceAfter`.
- **Idempotency Guarantee:**
  - Every financial transaction accepts a unique `idempotencyKey`.
  - Replays of identical keys return the existing transaction record without duplicate debit or credit.

---

## 4. Authentication & Carrier Abuse Prevention

- **Carrier Validation:**
  - Only legitimate Yemeni carrier prefixes (`77`, `73`, `71`, `78`, `70`) permitted.
- **Brute-Force & Rate Limiting:**
  - Max 3 OTP sends per phone per 2 minutes.
  - 3 incorrect OTP entries locks the account for 60 seconds.
  - Expired OTPs (> 120 seconds) are automatically rejected.

---

## 5. Secrets Management & Environment Hygiene

- [x] Zero plain-text API keys, passwords, or service account keys committed in Git.
- [x] `.gitignore` explicitly ignores `.env`, `.env.development`, `.env.staging`, `.env.production`.
- [x] Sanitized `.env.example` provided for onboarding.
- [x] All client-facing variables prefixed with `VITE_`.
- [x] Production deployment architecture uses secret managers (GCP Secret Manager) for Firebase Admin private keys.
