# AdPages Lead Attribution Kit for Pipedrive

Local-only planning kit for agencies that need to map form and campaign fields into Pipedrive leads, deals, people, and organizations before building any paid integration.

## What It Does

- Defines a reviewable field map for contact details, UTM fields, landing-page context, click IDs, service intent, and lead-quality notes.
- Generates a local attribution preview from a sample lead object.
- Produces a human-reviewed lead-quality checklist for sales or account managers.
- Documents a manual setup checklist for creating matching Pipedrive fields and testing a real form submission.

It does not call the Pipedrive API, use OAuth, request API tokens, create leads, update deals, run analytics, submit forms, host a backend, or claim to be a Pipedrive Marketplace app. The generated output is a local planning artifact only.

## Folder

```text
integrations/pipedrive/adpages-lead-attribution-kit/
  config/field-map.json
  docs/setup-checklist.md
  examples/sample-lead.json
  examples/sample-output.json
  scripts/check.mjs
  scripts/smoke.mjs
  src/lead-attribution.mjs
  package.json
  PRIVACY.md
  PUBLISH_BLOCKERS.md
  README.md
```

## Local Checks

From the repository root:

```sh
npm --prefix integrations/pipedrive/adpages-lead-attribution-kit run check
npm --prefix integrations/pipedrive/adpages-lead-attribution-kit run smoke
```

## Manual Setup Flow

1. Review `config/field-map.json` with the CRM owner and confirm which fields should be native Pipedrive fields versus custom fields.
2. Create the custom fields manually in Pipedrive and replace the `manual_*` placeholder keys with the actual field keys in your implementation notes.
3. Wire the source form or handoff spreadsheet to capture the required campaign and lead fields.
4. Compare a real test submission against `examples/sample-output.json`.
5. Use the quality checklist as a required human review before owner assignment, routing, or automation.

## Input Files

`config/field-map.json` is the field mapping blueprint. It intentionally uses review-friendly labels and placeholder field keys because Pipedrive custom field keys are generated inside each account.

`examples/sample-lead.json` is a fictional local-service lead used to prove the mapper and checklist behavior.

## Generated Output Shape

The runtime returns:

- `mappedFields`: ordered lead, deal, person, and organization field previews.
- `fieldValues`: key/value preview for implementation QA.
- `leadQuality`: score, rating, and notes.
- `qualityChecklist`: human review checklist with pass, review, or missing states.
- `missingRequired`: required source fields that were blank.

## Publishing Position

This is a credible Pipedrive-facing resource kit for agencies and local-service marketers that need campaign attribution discipline before CRM automation. Later monetizable paths could include a hosted checker, form-specific setup guides, screenshot QA, or a real Pipedrive integration. Those are outside this scaffold.

## Publish Blockers

- This is not a Pipedrive Marketplace app and does not include OAuth, API scopes, app review metadata, webhook handling, or a hosted backend.
- Public listing copy, screenshots, icon, support URL, marketplace category choices, and hosted privacy URL are not included.
- Real Pipedrive custom field keys must be created and verified inside the target account.
- Any future automatic sync, API submission, analytics lookup, browser capture, or credential handling needs a separate privacy and security review.

## Publisher

Built by [AdPages from A1 Local](https://a1local.com.au/extensions/) as a free, dependency-light resource for local-service marketers, web designers, and small business site owners.

