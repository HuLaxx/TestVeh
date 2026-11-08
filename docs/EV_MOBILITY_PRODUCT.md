# VEH — EV Bicycle Rental & Ride Operating System

## Product definition

**One connected journey from finding an e-bike to ending the ride.**

The rider should never have to jump between unrelated tools to know where their rental is, whether they have enough battery or whether it is safe to end the trip. VEH is a multi-sided mobility platform for riders, fleet operators, service staff and the business.

### Journey 1 — Find & See

- Discover real bikes and approved pickup/docking/charging stations by current or searched location.
- Distinguish free, reserved, charging, maintenance, offline and unknown bike states.
- Present **timestamped measured battery state**, modelled range with uncertainty, pricing, accessories and bike suitability.
- Offer filters for range, bike class, charging need, price, distance and accessibility.

### Journey 2 — Book & En route

- Place server-side atomic holds with a visible expiry, idempotency keys and anti-double-booking.
- Display final booking terms, authorization hold, fare rates, return terms and cancellation policy.
- Provide consent-driven navigation to a geocoded pickup point, accessibility and walking-route options.
- Handle no-shows, stale GPS, offline devices and holds that expire during network loss.

### Journey 3 — Unlock & Ride

- Verify that the user is at an allowed pickup zone and that the correct vehicle is ready.
- Send signed, auditable commands to a verified lock vendor; do not confuse a frontend animation with unlock success.
- Record authoritative ride starts/ends with server timestamps and duplicate-event protection.
- Show connection freshness, GPS location where consented, distance, ride clock, battery history and range estimate.
- Support low-charge alerts, pause/resume only where contract/hardware allows, issue reporting and emergency assistance.

### Journey 4 — Return & Pay

- Validate return location or an authorized exception.
- Securely re-lock and confirm positive vendor acknowledgment or clearly explain pending status.
- Finalize metered price, fees/taxes, payment capture/refund and receipt via signed payment webhooks.
- Expose transparent ride history, battery/distance traces with provenance and dispute support.

### Operator and administrator journeys

- Fleet map, telemetry health, low-charge dispatch, maintenance queues, photo/document reviews, device assignment, firmware and inventory history.
- Geofenced service regions, docking and charging capacity, availability blackout periods, pricing plans and promotional rules.
- Operational dashboards for utilization, ride completions, energy use, reliability, payment reconciliation and customer issues.
- Multi-tenant roles, auditing and privacy controls.

## Experience design

### Signature visual metaphor

**A moving command centre rather than a catalogue.** A dramatic custom electric bike technical illustration opens into an expressive mobility map and an information-dense ride console. Editorial condensed typography, acid-lime energy signals, deep forest backgrounds and instrument-like status panels make the experience distinctive, while important information remains accessible.

### Trust cues

Every telemetry value must say whether it is measured, estimated, delayed or simulated. A live map must use real geodata only when authorized. A 'Book', 'Unlock' or 'Return' confirmation must represent a server-accepted state; never present a local UI state as a real hardware action.

### Implementation stages

**Stage A — Interactive design prototype (implemented on public domain):** fictional bike inventory, schematic stations, local reservation, countdown, simulated route/ride, modelled battery and fare and local trip history.

**Stage B — Reliable transactional alpha (not implemented):** PostgreSQL/managed booking service, accounts/verification, real geolocations, payments sandbox, server-authoritative booking/ride state machine, unit/integration/E2E tests.

**Stage C — Connected pilot (not implemented):** vendor/bike gateway, verified battery/lock signals, real operational staff, charging and maintenance, consented location, incident plans and manual overrides.

**Stage D — Public launch (not implemented):** security/privacy/accessibility, insurance/regulatory compliance, billing, refunds, support, monitoring, SLOs, backups, disaster recovery and controlled city rollout.

## Current demo data

Eight fictional bikes at five fictional schematic stations; one is unavailable for simulated charging. Per-minute prices in INR are illustrative only, not a commercial offer.

No real ride is bookable today. The site should not claim otherwise.
