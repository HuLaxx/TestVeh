# TestVeh marketplace platform

**Status: pre-production build.** This is the next-generation TestVeh startup platform on branch `product/testveh-booking-platform`, separate from the older vehicle-registry demonstration on `master`.

## Product

- Customer marketplace: vehicle rentals, parking and EV charging search by city, price and dates; conflict-aware booking requests; account creation and session-based sign-in; customer booking history and request cancellation.
- Partner portal at `/partner`: sign in as a customer, apply to operate, submit vehicle/parking/charging inventory, edit or unpublish listings, accept/reject reservation requests, mark completed reservations.
- Administrator portal at `/admin`: approve/suspend operators; review and publish/reject individual listings.
- Platform-controlled audit log for business approvals and booking decisions. Permission checks are server-side; signup does **not** grant partner or admin privileges.
- No payments, refunds, automated identity verification, third-party inventory, live plug telemetry, or email verification. Do **not** market the application as fully operational until those launch gates are met.

## Run locally

Node.js 22 and managed PostgreSQL are recommended.

```sh
cd platform
npm install
npm test
npm run build
npm run dev
```

Without `DATABASE_URL`, discovery displays **clearly labeled sample listings**. Real account creation, partnerships and booking requests are unavailable.

To enable server-backed data, set `DATABASE_URL` in the deployment environment securely (never commit it) and run:

```sh
npm run db:migrate
```

Migrations run `001_init.sql`, `002_marketplace.sql`, and `003_auth_limits.sql`. Operators must apply through `/partner`, and administrators must manually review applications and resources.

### Initial administrator bootstrap

After creating your own normal account in a trusted environment, a database administrator may grant the *specific reviewed account* admin status:

```sql
INSERT INTO platform_admins(user_id)
SELECT id FROM users WHERE email = :reviewed_admin_email
ON CONFLICT DO NOTHING;
```

Never grant admin access through public registration or by supplying an arbitrary user ID from a request. Keep database credentials and administrator bootstrap access out of the application UI.

## Booking safety

- A submitted listing begins `pending` and `active=false`. Only an administrator can approve/publish it; changing listing details forces another review.
- The search and reservation APIs require approved operator **and** approved, active inventory; unverified items cannot accept bookings.
- PostgreSQL exclusion constraints reject overlapping `requested` and `confirmed` bookings for the same resource. API prices are calculated on the server. Reservations are **requests**; no money is collected.
- Users can cancel their own requested reservations. Approved partners can accept/reject only requests for resources they own; state changes are checked and audited.
- State-changing API routes check the same-origin request header in addition to session cookies. Cross-tenant resource access is blocked.

## Launch checklist (required before public operations)

1. Add verified business onboarding, actual vehicle/parking/charging ownership or operating authority checks, insurance and jurisdiction-specific compliance.
2. Configure managed PostgreSQL with least-privilege credentials, backups, retention, monitored migrations and real operator inventory.
3. Complete account email verification, password reset, multi-factor protection for administrators, broader anti-abuse measures, and security testing. Login requests currently have a basic database-backed attempt limit; registration and per-IP protection remain launch work.
4. Integrate a payment provider with signed webhooks, idempotent payment/booking reconciliation, refund and cancellation policy, and an internal ledger **before** any checkout is enabled.
5. Add verified addresses/map locations, accurate service-specific availability, blackout schedules, charger connector capacities and transparent uptime/occupancy disclaimers.
6. Implement accessibility, automated browser tests, service monitoring, privacy policy, support and complaints, incident response and a staged release.
7. Verify CI and Vercel build settings: **Root Directory = `platform`**, Framework = **Next.js**, Node.js = **22.x**. Deploy to preview and test before promoting to production.

GitHub Actions runner provisioning and Vercel team permissions may prevent build verification; a code commit alone is not proof that a deployment is ready.
