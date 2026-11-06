# TestVeh · Vehicle Registry Studio

A **working standalone vehicle-records and registration-review prototype** built from the original Django/React authentication experiment. The new app runs from `site/`; it does not depend on a local Django server or unreviewed signup endpoints. Existing legacy code in the upstream repository can be preserved for reference.

## Functional application

Create, validate, edit and delete vehicle records; search by registration number, model, keeper alias or region; filter fuel/type/review status; track sample document checks and inspection dates; inspect individual dossiers; export CSV and retain changes across reloads in the browser. It comes with four **fictional demonstration records**. Form fields and exported data are validated/escaped; model tests are included.

**Not a government registration system:** Nothing is submitted to official authorities. The `Reviewed (demo)` state is a local-only simulation, not a legal inspection, ownership check or registration certificate. Enter fictional data, not actual personal identities, registration documents or credentials.

## Run

Run `python -m http.server 4173 --directory site` then open http://localhost:4173.

With Node.js 20+, run `node --test tests/registry.test.mjs`.

## Vercel

`vercel.json` configures static publishing of `site/`. Connect `HuLaxx/TestVeh` to Vercel, use branch `master`, and deploy as a static site. A live public deployment has not been verified.

## Production path

This demonstrator is not a secure multi-user registry. Production would require authenticated roles, server-side data integrity and audit trails, an authorized backing database, explicit data protection rules, authentication hardening and independent tests. The original Django settings should also be hardened and tracked virtual environment files removed in a separate cleanup.

Built by Rahul Khanke / HuLaX.
