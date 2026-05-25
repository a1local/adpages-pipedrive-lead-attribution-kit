# Privacy

AdPages Lead Attribution Kit for Pipedrive is a local-only planning kit.

## Data Processed

The sample mapper reads local JSON files that you provide:

- Field mapping configuration.
- Sample form, campaign, contact, and page context.
- Sample lead-quality context.

The included examples use fictional data.

## Network Behavior

This kit does not make network calls. It does not call Pipedrive, send lead or deal records, fetch landing pages, load remote scripts, run analytics, or contact any AdPages service.

## Credentials

This kit does not require Pipedrive API keys, OAuth client secrets, browser cookies, webhook secrets, or CRM user credentials.

## Storage

The kit returns local JavaScript objects and reads only local example/config files during checks. It does not create a database, background process, hosted backend, cloud storage bucket, or external log.

## Manual Pipedrive Use

Any Pipedrive fields, pipelines, stages, labels, automations, leads, deals, people, or organizations must be created manually by the user in Pipedrive. This kit only generates planning and QA reference data.

## Future Changes

If future versions add hosted services, Pipedrive API calls, automatic lead creation, browser capture, analytics lookups, or credential handling, those features need a separate privacy review and updated documentation before release.
