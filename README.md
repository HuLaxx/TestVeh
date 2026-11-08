# TestVeh — Vehicle Identity Studio

**Live:** https://vehical.hulax.uk/  
**Deployment:** Vercel project `test-veh-y5ak`, Cloudflare DNS for `vehical.hulax.uk`.

> **Important:** TestVeh is a local-first vehicle dossier and registration-review **prototype**, not a government service or a verified vehicle identity registry. Do not enter real keeper identities, legal documents, passwords or other sensitive personal data.

## The idea

**Every vehicle has a story.** TestVeh presents a vehicle as an understandable, inspectable *dossier*: registration reference, maker and model, fuel type, keeper alias, region, inspection schedule, document-check completeness and desk-review state.

The interface is deliberately unlike a generic fleet dashboard or vehicle marketplace. It pairs a cinematic engineering schematic with an editorial specimen file, then lets the visitor explore real working local records.

## Working features

- Create, edit and delete vehicle records with validation and duplicate registration checks
- Local-only browser persistence; sample records are fictional and identifiable as demonstrations
- Vehicle dossier preview: switch between three example files and open each full record
- Search/filter by plate, model, keeper label or region; review status, fuel and vehicle class
- Track three self-recorded document checks, inspection dates and review notes
- Export browser-stored records to CSV; no server upload or verification
- Responsive interface and keyboard-operable dialogs

The core registry model is in `site/registry.mjs`; the local workspace logic is in `site/app.js`. The underlying older Django/React authentication prototype remains preserved in `backend/` and `frontend/` as an exploratory legacy path.

The separate `platform/` folder contains an **unfinished** vehicle-rental, parking and EV-charging marketplace experiment. It is *not* the product currently served on `vehical.hulax.uk` and does not have a confirmed live database, customer payments or real inventory.

## Run and check locally

This is a static web app with JavaScript modules:

```sh
python -m http.server 4173 --directory site
# visit http://localhost:4173
node --test tests/registry.test.mjs
```

The deployment uses the root `vercel.json` pointing to `site/`, with no build system or secrets.

## Design / release evidence

- Bespoke dark pine and acid-chartreuse identity language with cream dossier paper, technical vehicle illustration, oversized editorial type, custom graphic details and a controlled scanning animation.
- Respect for `prefers-reduced-motion`, explicit accessible button names, visible keyboard focus styles and horizontal scrolling confined to the register table.
- On 2026-11-08, Vercel reported production deployment `dpl_HQWxsJSdcuwynUwqf3yBRyStPnhZ` **READY** for commit `227c9e8`; live HTTPS returned HTTP 200.
- Browser-tested: switch sample dossier, open/close a full vehicle record, search by registration number, add a fictional record, edit it and delete it.
- Browser mobile inspection at 320px and 390px found no document-wide horizontal scrolling. Full regression, performance, security and accessibility audits remain future work.
- GitHub Actions are not currently reliably running; don't infer green CI from the deployment's READY state.

See `docs/VEHICLE_IDENTITY_DESIGN.md` for the visual system and interaction principles.

## Next production milestones

Before real vehicle identity or operator workflows, implement server-backed authentication, permissioned access, auditability, secure document storage and verification, appropriate consent/privacy policies, access controls and genuine source-of-truth integrations. The current UI intentionally **does not** imply government registration or independently validated ownership.

Built by HuLaX Engineering Lab.
