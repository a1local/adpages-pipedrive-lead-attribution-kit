import assert from "node:assert/strict";
import { createAttributionPlan, readJsonFile } from "../src/lead-attribution.mjs";

const root = new URL("../", import.meta.url);
const lead = await readJsonFile(new URL("examples/sample-lead.json", root));
const fieldMap = await readJsonFile(new URL("config/field-map.json", root));
const expected = await readJsonFile(new URL("examples/sample-output.json", root));

const generated = createAttributionPlan({ lead, fieldMap });

assert.deepEqual(generated, expected);
assert.equal(generated.platform, "pipedrive");
assert.equal(generated.manualUseOnly, true);
assert.equal(generated.leadQuality.rating, "strong");
assert.equal(generated.leadQuality.requiresHumanReview, true);
assert.equal(generated.fieldValues.manual_utm_campaign, "emergency-plumber-perth");
assert.equal(generated.fieldValues.manual_service_requested, "Blocked drain");
assert.equal(generated.qualityChecklist.length, 7);
assert.equal(generated.missingRequired.length, 0);

console.log("pipedrive lead attribution kit smoke ok");
