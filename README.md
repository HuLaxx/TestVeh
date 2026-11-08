# VEH by HuLaX — Electric Bicycle Mobility

**Live website:** https://vehical.hulax.uk/

> **Prototype status:** The current public website is an interactive **simulated EV bicycle-rental experience**. All bike inventory, station locations, battery readings, trip data and fares are fictional examples. No physical bike, smart lock, payment gateway or real-time GPS is connected. Do not interpret a demo reservation as a genuine hold.

## Product vision

**See → Book → En route → Ride → Track → Return.**

VEH is intended as an end-to-end electric bicycle rental and ride operating system, not a vehicle-registration studio. Riders should be able to discover available e-bikes, compare their battery and practical range, reserve, navigate to a pickup point, safely unlock, monitor a journey, track power and charges, and end a ride at a valid return zone. Operators need connected fleet information, charging, maintenance and compliance controls.

### Working public demo

- Bespoke design system with original electric bicycle illustration, station schematic, interactive booking console and ride dashboard.
- Five **fictional** stations and eight **fictional** e-bikes (seven shown as available; one shown as charging).
- Station and ride-type filters, battery charge and estimated range display, illustrative per-minute fare.
- Local-only reservation confirmation and a 10-minute example hold countdown (not server-enforced).
- En-route stage displaying a **schematic, fictional path** to a selected station; not real routing or GPS.
- A **simulated** unlock/start action, animated position marker, duration, distance, energy use, estimated range and estimated fare. Demonstration time runs at **5× speed** to make the UI observable.
- Pause and end ride, record completed fictional trips in local browser storage, and start again.
- Desktop and mobile responsive layout, reduced-motion preference, accessible map pin descriptions, button labels and status notices.

The app deliberately does **not** request browser geolocation, access an operator's bike, accept payment, or present simulated telemetry as measured data.

### Run locally

The production frontend is a static browser app in `site/`:

```sh
python -m http.server 4173 --directory site
# open http://localhost:4173
```

A standalone `vercel.json` publishes `site/`.

### Architecture and legacy work

- `site/index.html`, `site/motion.css`, `site/motion.js`: published VEH mobility concept.
- `site/app.js`, `site/registry.mjs`: superseded local-first registration demo, retained for reference and **not loaded by the public page**.
- `platform/`: an **unfinished**, separate Next.js/PostgreSQL vehicle/parking/charging marketplace experiment with auth and booking APIs. It is **not deployed as the VEH public experience**, and no live backend is implied.
- `backend/`, `frontend/`: original Django/React exploration.

## Roadmap to a real EV rental business

See [EV mobility product blueprint](docs/EV_MOBILITY_PRODUCT.md) for the staged architecture. Among the non-negotiable requirements:

1. Real operators, verified e-bike inventory, service areas and maintenance status.
2. Authenticated rider accounts with accessible user flows and privacy controls.
3. Durable, transactional availability and booking holds, pricing policies and refunds.
4. Real geospatial station lookup, directions, GPS consent and offline/error handling.
5. Hardware or vendor API integrations for smart locks, battery state, bike identifiers and connectivity states.
6. Ride lifecycle with idempotent unlock/return events, telemetry freshness, fallback processes and accurate billing.
7. Payment integration, invoicing, customer support, legal/regulatory/insurance review and abuse protection.
8. Operator dispatch, maintenance and charging workflows, alerting and incident handling.
9. Independent security, accessibility, stress and integration tests before real riders or payments.

## Live verification

For the static prototype, production Vercel deployment `dpl_A1QxXmDw1uwH8hey4JXyT15uLHnn` was READY on **November 8, 2026**, and public `vehical.hulax.uk` returned HTTP 200. Browser testing completed sample bike selection, battery/range and fare display, demo booking confirmation, en-route hold, simulated unlock/ride telemetry, return and a browser-local trip-history entry. Mobile geometry was checked at 320px and 390px with no observed page-wide horizontal overflow.

Those tests do not establish commercial launch readiness or provide evidence for real telemetry and financial transactions.

HuLaX Engineering Lab · 2026
