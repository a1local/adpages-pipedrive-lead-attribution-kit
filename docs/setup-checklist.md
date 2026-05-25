# Pipedrive Setup Checklist

Use this checklist to turn the local field map into a real Pipedrive setup. This kit does not create fields or records automatically.

## 1. Confirm CRM Objects

- Confirm whether incoming enquiries should begin as Leads, Deals, or both.
- Confirm the target pipeline and first stage for web leads.
- Confirm who owns first response and who reviews attribution quality.

## 2. Create Fields Manually

- Review every field in `config/field-map.json`.
- Use native fields where possible for lead title, person name, phone, email, organization, and deal value.
- Create custom fields for UTM, landing-page, click ID, source summary, service area, urgency, and lead-quality review fields.
- Record the generated Pipedrive field keys in an account-specific implementation note.

## 3. Wire Source Forms

- Capture UTM source, medium, campaign, term, and content at the form layer.
- Capture landing-page URL and referrer where the site can provide them.
- Capture click IDs only when they are present in the landing-page URL.
- Do not add hidden fields that collect more data than the CRM owner has approved.

## 4. Test With Real Submissions

- Submit one test lead from a tagged URL.
- Compare the created Pipedrive record against `examples/sample-output.json`.
- Confirm required fields are not blank.
- Confirm the service, location, urgency, and value fields make sense to the sales user.

## 5. Human Review Before Automation

- Have a human review the lead-quality checklist before enabling routing rules.
- Confirm bad-fit or incomplete leads are still visible to the right owner.
- Confirm campaign attribution is reliable before using it in paid reporting.
- Revisit this map any time forms, pipelines, ad platforms, or service areas change.
