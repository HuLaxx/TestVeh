# VEH — Electric Mobility, Unlocked

**Public experience:** https://vehical.hulax.uk/

> **Interactive product demo, not a real e-bike rental service.** Bikes, stations, battery readings, estimated range, routes, ride location, fares and reservations are fictional. The website cannot unlock actual bicycles, take payment or deliver actual GPS tracking.

## The product

VEH is an electric micro-mobility journey designed around the full rider lifecycle:

**Find → Compare charge and range → Reserve → En route → Simulated unlock → Ride and track → Return → Trip history.**

The interactive prototype runs from the repository's static \`site/\` folder. It is built to feel like a distinctive e-mobility operating system with its own custom bike illustration, dark schematic map, sample station network and dynamic trip console—not a generic bicycle catalogue.

## Available in the demo

- Browse 8 clearly fictional e-bikes across 5 fictional stations; distinguish 7 available sample bikes from 1 sample charge-unit bike
- Choose city, cargo or sport, filter by sample station, inspect battery percentage, estimated range and illustrative fare
- Reserve a sample bike for 10 minutes in **this browser only**; the hold can be cancelled or will expire automatically
- See fictional pickup station, estimated walking time and en-route status
- Simulate unlocking; animate a schematic map route and update the trip's distance, battery, modelled remaining range, simulation clock and fare
- Pause/resume the simulation, return the bike and save a local trip summary
- Keep active demo ride and recent ride history in browser localStorage; no real user accounts or cloud sync

Simulated ride telemetry uses a **20× clock** so the interface is inspectable quickly. Model rules are in \`site/motion-model.mjs\`, UI behavior in \`site/motion.js\`, and the visual system in \`site/motion.css\`.

## Develop and test

Requires a simple static file server and Node.js:

\`\`\`sh
python -m http.server 4173 --directory site
# browse http://localhost:4173
node --test tests/motion.test.mjs
\`\`\`

Vercel uses the root \`vercel.json\` to publish \`site/\` with no build dependencies. The old standalone vehicle registry is preserved in repository history as a separate experiment, and the unrelated \`platform/\` Next.js marketplace experiment is not the live app.

## Real startup requirements (NOT built)

To rent actual e-bikes, this demo must be connected to a trusted operating backend and hardware stack:

1. **Identity & onboarding:** verified riders, eligibility checks, accessible login, account recovery, customer support, privacy policy and service area disclosures
2. **Real fleet:** operator-owned bicycles, audited battery telemetry from BMS, lock commands with device acknowledgments, maintenance and safe ride-start verification
3. **Real maps:** user-consented location, precise pickup coordinates, directions, geofences, parking zones, route history and location retention rules
4. **Booking and billing:** database-side inventory locking, expiration, payments, deposits, fraud checks, reconciliation, signed webhooks, receipts and refunds
5. **Operations:** dock charging availability, low-battery thresholds, rerouting and recovery, breakdown workflows, inventory rebalancing and incident response
6. **Assurance:** accessibility audits, security and privacy reviews, QA against real vehicles, monitoring, support response times and jurisdiction-specific rental laws

Do not present simulated battery, location or pricing as verified live information.

Original concept and design by HuLaX.
