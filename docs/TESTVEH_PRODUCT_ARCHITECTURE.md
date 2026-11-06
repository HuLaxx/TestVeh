# TestVeh — Vehicle Booking, Parking & EV Charging Platform

Status: **product specification and architecture proposal**, not a claim that these features are implemented.
Canonical website: https://test-veh-y5ak.vercel.app/ (Vercel project `test-veh-y5ak`).

## Product direction

TestVeh is a real, multi-user marketplace for reserving vehicles, parking spaces and EV charging slots, with separate customer, operator and administrator experiences. The `site/` vehicle registry is an earlier demonstration and **not** the target product. Do not describe demo records as verified live inventory or official vehicle records.

## Core customer journeys

1. **Authentication:** sign up, verify email, sign in, reset password, manage profile and active sessions. Do not ask public users to choose privileged roles during sign-up.
2. **Vehicle booking:** search locations and dates, see genuinely available inventory and prices, compare vehicle specs, reserve a specific vehicle/time interval, pay, receive confirmation, modify/cancel subject to policy.
3. **Parking:** search by location and time, view space characteristics and hourly pricing, reserve a space without overselling, see directions and booking details.
4. **EV charging:** search stations by location, connector type, charging power and time; show operator-provided availability and tariffs; reserve a charging slot. Clearly distinguish *bookable slots* from real-time plug occupancy; real-time state requires an authorized provider integration.
5. **Bookings dashboard:** view upcoming, ongoing, completed and cancelled reservations, payment receipts, refunds and support tickets.
6. **Notifications:** email for signup, confirmations, reminders, cancellations and payment events. Marketing notifications are opt-in.
7. **Operator dashboard:** onboard inventory, set hours, blackouts, capacities, pricing rules, service locations, manage reservations and disputes.
8. **Admin dashboard:** approve operators, review reports, manage fraud/abuse, audit changes and resolve support cases.

## Technical architecture on Vercel

- **Web:** Next.js App Router / TypeScript, responsive UI with accessible forms; Vercel for frontend and API handlers.
- **Persistence:** managed PostgreSQL with migrations, constraints, indexes, automated backups, least-privilege connection; database provisioned separately from Vercel ephemeral functions.
- **Authentication:** hosted standards-based provider or reviewed secure session system, email verification, rate limits, secure HttpOnly cookies, password recovery by single-use expiring token; never use the legacy authentication-key mechanism.
- **Payments:** integrated payment provider with server-side price calculation, signed webhook verification, idempotency keys, ledger entries and refund reconciliation; checkout only after payment credentials and policies are configured.
- **Maps and geocoding:** authorized maps provider with transparent availability/service limitations.
- **Background work:** managed queue/cron for holds expiry, reminders, and recovery from partially completed operations.
- **Observability:** structured request logs, production exceptions, latency, uptime monitoring and privacy-safe analytics.
- **CI/CD:** preview branches, unit/API/integration/end-to-end tests, dependency scanning, safe migrations, staged production releases.

## Domain model (initial)

`users`, `profiles`, `operators`, `locations`, `vehicles`, `parking_spaces`, `charging_stations`, `connectors`, `availability_rules`, `blackouts`, `rates`, `reservations`, `reservation_items`, `payment_intents`, `payments`, `refunds`, `notifications`, `audit_events`.

Use UUID identifiers, UTC timestamps, monetary amounts in integer minor units with explicit currency, lifecycle status enums, ownership checks on every read/write, and retention/deletion rules for personal information.

## Reservation and inventory integrity

For vehicle and parking bookings, enforce no overlapping confirmed/held reservations with database constraints or transactional locks. For charging bookings, enforce connector capacity and provider restrictions. Use short expiring holds while payment is pending; final confirmation is recorded only after a verified payment webhook. On timeout or payment failure, release the hold. Treat retries as idempotent. Do not claim a charger is physically available without a reliable integration.

## Delivery phases and acceptance gates

- **P0 / repair:** keep canonical Vercel domain reachable; archive the misaligned registry prototype under a clearly labeled demo route; create functional smoke tests. Do not publish the legacy Django API as-is.
- **P1 / customer core:** proper account lifecycle, persisted operator-managed inventory, full vehicle/parking/charging discovery and genuine availability query. Verified multi-user isolation; no localhost endpoints.
- **P2 / transactions:** transactional reservation holds, cancellation policy, payment/webhook/refund integration, booking records and notifications. Parallel booking race tests and webhook replay tests must pass.
- **P3 / operations:** operator and admin portals, rate management, audit trail, dispute handling, upload moderation and reporting.
- **P4 / launch readiness:** accessibility, load tests, backup/restore drill, monitoring and alert thresholds, privacy/terms/payment policies, production credentials and end-to-end payment verification.

## Current source audit (2026-11-06)

- `frontend/src/App.js` routes to sign-in/sign-up and recovery pages; these are legacy UI components.
- `frontend/src/components/SignIn.js` and `SignUp.js` send requests to localhost `127.0.0.1:8000`, not a deployed backend.
- `backend/backend/settings.py` contains an embedded development secret, `DEBUG=True`, `ALLOWED_HOSTS=[]` and SQLite. These settings are **not production safe**.
- `backend/authentication/views.py` has a password recovery flow based on a user-provided authentication key. Replace with an expiring single-use reset-token flow.
- `site/` currently provides a browser-local vehicle records demo; this should not be treated as the final TestVeh booking platform.

**Never deploy the legacy backend with live user data without remediating these problems, checking the Git history for exposed credentials and rotating any exposed credentials.**
