import { readFile } from "node:fs/promises";

const VALID_TARGETS = new Set(["lead", "deal", "person", "organization"]);
const VALID_TYPES = new Set(["identity", "qualification", "attribution", "review"]);

export async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export function createAttributionPlan({ lead, fieldMap }) {
  assertObject(lead, "lead must be an object");
  const normalized = normalizeFieldMap(fieldMap);
  const derived = createDerivedValues(lead);
  const source = {
    ...lead,
    derived
  };

  const mappedFields = normalized.fields.map((field) => {
    const rawValue = firstPresent([
      getByPath(source, field.sourcePath),
      derived[field.sourceKey],
      field.fallback
    ]);
    const value = clean(rawValue);

    return {
      sourceKey: field.sourceKey,
      targetObject: field.targetObject,
      pipedriveFieldLabel: field.pipedriveFieldLabel,
      plannedFieldKey: field.plannedFieldKey,
      type: field.type,
      value,
      required: field.required,
      purpose: field.purpose
    };
  });

  const fieldValues = Object.fromEntries(
    mappedFields.map((field) => [field.plannedFieldKey, field.value])
  );
  const missingRequired = mappedFields
    .filter((field) => field.required && !field.value)
    .map((field) => field.sourceKey);

  return {
    kit: normalized.kit,
    version: normalized.kitVersion,
    platform: normalized.platform,
    manualUseOnly: true,
    disclaimer: "Local preview only. This kit does not call Pipedrive, create leads, or write deal data.",
    client: clean(lead.client?.name),
    formName: clean(lead.form?.name),
    leadTitle: clean(derived.lead_title),
    targetPipeline: clean(lead.pipeline?.name),
    targetStage: clean(lead.pipeline?.stage),
    suggestedOwner: clean(lead.pipeline?.owner),
    mappedFields,
    fieldValues,
    leadQuality: {
      score: clean(derived.lead_quality_score),
      rating: rateLead(derived.lead_quality_score),
      notes: clean(derived.lead_quality_notes),
      requiresHumanReview: true
    },
    qualityChecklist: buildQualityChecklist(lead, derived),
    missingRequired,
    reviewSteps: [
      "Create or update Pipedrive custom fields manually using docs/setup-checklist.md.",
      "Create a test lead/deal from the source form and compare each mapped value against this preview.",
      "Review lead-quality checklist before automating routing, owner assignment, or follow-up."
    ]
  };
}

export function normalizeFieldMap(fieldMap) {
  assertObject(fieldMap, "fieldMap must be an object");
  assert(fieldMap.kit === "adpages-pipedrive-lead-attribution-kit", "fieldMap.kit mismatch");
  assert(fieldMap.platform === "pipedrive", "fieldMap.platform must be pipedrive");
  assert(fieldMap.manualSetupOnly === true, "fieldMap.manualSetupOnly must be true");
  assert(fieldMap.requiresPipedriveApi === false, "fieldMap must avoid Pipedrive API requirements");
  assert(fieldMap.requiresOAuth === false, "fieldMap must avoid OAuth requirements");
  assert(fieldMap.requiresSecrets === false, "fieldMap must avoid secret requirements");
  assert(fieldMap.writesDataAutomatically === false, "fieldMap must disclose no automatic writes");
  assert(Array.isArray(fieldMap.fields) && fieldMap.fields.length > 0, "fieldMap.fields must be a non-empty array");

  const seenKeys = new Set();
  const fields = fieldMap.fields.map((field, index) => {
    const sourceKey = clean(field.sourceKey);
    const targetObject = clean(field.targetObject);
    const pipedriveFieldLabel = clean(field.pipedriveFieldLabel);
    const plannedFieldKey = clean(field.plannedFieldKey);
    const type = clean(field.type);
    const sourcePath = clean(field.sourcePath);

    assert(sourceKey, `fields[${index}].sourceKey is required`);
    assert(VALID_TARGETS.has(targetObject), `fields[${index}].targetObject is invalid`);
    assert(pipedriveFieldLabel, `fields[${index}].pipedriveFieldLabel is required`);
    assert(/^(native|manual)_[a-z0-9_]+$/.test(plannedFieldKey), `fields[${index}].plannedFieldKey must be a native_* or manual_* key`);
    assert(VALID_TYPES.has(type), `fields[${index}].type is invalid`);
    assert(sourcePath, `fields[${index}].sourcePath is required`);
    assert(!seenKeys.has(plannedFieldKey), `duplicate plannedFieldKey ${plannedFieldKey}`);
    seenKeys.add(plannedFieldKey);

    return {
      sourceKey,
      targetObject,
      pipedriveFieldLabel,
      plannedFieldKey,
      type,
      sourcePath,
      fallback: field.fallback,
      required: Boolean(field.required),
      purpose: clean(field.purpose)
    };
  });

  return {
    kit: clean(fieldMap.kit),
    kitVersion: clean(fieldMap.kitVersion || "0.1.0"),
    platform: clean(fieldMap.platform),
    fields
  };
}

export function createDerivedValues(input) {
  const pageUrl = firstPresent([
    input.page?.url,
    input.page?.landingPageUrl
  ]);
  const utm = input.utm ?? {};
  const clickIds = input.clickIds ?? {};

  const utmSource = firstPresent([utm.source, queryParam(pageUrl, "utm_source"), "direct"]);
  const utmMedium = firstPresent([utm.medium, queryParam(pageUrl, "utm_medium"), "none"]);
  const utmCampaign = firstPresent([utm.campaign, queryParam(pageUrl, "utm_campaign")]);
  const score = firstPresent([input.leadQuality?.score, scoreLead(input)]);
  const notes = firstPresent([input.leadQuality?.notes, buildLeadQualityNotes(input)]);

  return {
    lead_title: firstPresent([input.lead?.title, buildLeadTitle(input)]),
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_term: firstPresent([utm.term, queryParam(pageUrl, "utm_term")]),
    utm_content: firstPresent([utm.content, queryParam(pageUrl, "utm_content")]),
    landing_page_url: clean(pageUrl),
    referrer_url: firstPresent([input.page?.referrer, input.traffic?.referrer]),
    click_id: firstPresent([
      clickIds.gclid,
      clickIds.msclkid,
      clickIds.fbclid,
      queryParam(pageUrl, "gclid"),
      queryParam(pageUrl, "msclkid"),
      queryParam(pageUrl, "fbclid")
    ]),
    source_summary: buildSourceSummary({ source: utmSource, medium: utmMedium, campaign: utmCampaign }),
    lead_quality_score: score,
    lead_quality_notes: notes,
    next_review_action: nextReviewAction(score)
  };
}

export function buildQualityChecklist(input, derived = createDerivedValues(input)) {
  const contact = input.contact ?? {};
  const lead = input.lead ?? {};
  const pageUrl = clean(derived.landing_page_url);
  const hasContactPath = Boolean(clean(contact.phone) || clean(contact.email));
  const hasCampaign = Boolean(clean(derived.utm_source) && clean(derived.utm_medium) && clean(derived.utm_campaign));
  const hasServiceFit = Boolean(clean(lead.service) && clean(lead.location));
  const urgency = clean(lead.urgency).toLowerCase();
  const isUrgent = ["emergency", "urgent", "same_day", "same day", "today", "now"].some((word) => urgency.includes(word));
  const estimatedValue = clean(lead.estimatedValue);

  return [
    {
      check: "Contact path",
      status: hasContactPath ? "pass" : "missing",
      note: hasContactPath ? "Phone or email supplied." : "Phone or email is required before follow-up."
    },
    {
      check: "Campaign attribution",
      status: hasCampaign ? "pass" : "review",
      note: hasCampaign ? "UTM source, medium, and campaign are present." : "Campaign source is incomplete; review before paid reporting."
    },
    {
      check: "Landing page context",
      status: pageUrl.startsWith("https://") ? "pass" : "review",
      note: pageUrl.startsWith("https://") ? "Landing-page URL is present and uses HTTPS." : "Landing-page URL is missing or not HTTPS."
    },
    {
      check: "Service fit",
      status: hasServiceFit ? "pass" : "review",
      note: hasServiceFit ? "Service and location are present." : "Service or location should be reviewed before routing."
    },
    {
      check: "Urgency",
      status: isUrgent ? "pass" : "review",
      note: isUrgent ? "Lead indicates urgent or same-day intent." : "Urgency is not clearly high intent."
    },
    {
      check: "Estimated value",
      status: estimatedValue ? "review" : "missing",
      note: estimatedValue ? "Estimated value supplied; confirm before pipeline reporting." : "No estimated value supplied."
    },
    {
      check: "Human QA",
      status: "review",
      note: "Review mapped fields inside Pipedrive before using automation."
    }
  ];
}

function buildLeadTitle(input) {
  const service = clean(input.lead?.service) || "Web enquiry";
  const location = clean(input.lead?.location);
  return location ? `${service} - ${location}` : service;
}

function buildLeadQualityNotes(input) {
  const notes = [];
  if (clean(input.lead?.urgency)) notes.push(`urgency ${clean(input.lead.urgency)}`);
  if (clean(input.contact?.phone)) notes.push("phone supplied");
  if (clean(input.lead?.service)) notes.push("service supplied");
  if (clean(input.utm?.source) || queryParam(input.page?.url, "utm_source")) notes.push("campaign source present");
  return notes.length ? `Review lead quality: ${notes.join(", ")}.` : "Review lead quality manually.";
}

function scoreLead(input) {
  let score = 20;
  if (clean(input.contact?.phone)) score += 20;
  if (clean(input.contact?.email)) score += 10;
  if (clean(input.lead?.service)) score += 15;
  if (clean(input.lead?.location)) score += 10;
  if (clean(input.utm?.campaign) || queryParam(input.page?.url, "utm_campaign")) score += 10;
  if (clean(input.lead?.estimatedValue)) score += 5;
  const urgency = clean(input.lead?.urgency).toLowerCase();
  if (["emergency", "urgent", "same_day", "same day", "today", "now"].some((word) => urgency.includes(word))) score += 10;
  return Math.min(score, 100);
}

function rateLead(score) {
  const numericScore = Number(score);
  if (numericScore >= 80) return "strong";
  if (numericScore >= 60) return "qualified";
  if (numericScore >= 40) return "review";
  return "weak";
}

function nextReviewAction(score) {
  const rating = rateLead(score);
  if (rating === "strong") {
    return "Call within 5 minutes, confirm service area, and mark campaign values verified.";
  }
  if (rating === "qualified") {
    return "Call same day, verify missing attribution fields, and confirm fit.";
  }
  return "Review manually before assigning owner or creating automation rules.";
}

function buildSourceSummary({ source, medium, campaign }) {
  const parts = [source, medium, campaign].map(clean).filter(Boolean);
  return parts.length ? parts.join(" / ") : "unknown source";
}

function queryParam(url, key) {
  const text = clean(url);
  if (!text) return "";
  try {
    return new URL(text).searchParams.get(key) ?? "";
  } catch {
    return "";
  }
}

function getByPath(source, path) {
  const parts = clean(path).split(".").filter(Boolean);
  let value = source;
  for (const part of parts) {
    if (!value || typeof value !== "object" || !(part in value)) {
      return undefined;
    }
    value = value[part];
  }
  return value;
}

function firstPresent(values) {
  return values.find((value) => clean(value) !== "") ?? "";
}

function clean(value) {
  return String(value ?? "").trim();
}

function assertObject(value, message) {
  assert(value && typeof value === "object" && !Array.isArray(value), message);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
