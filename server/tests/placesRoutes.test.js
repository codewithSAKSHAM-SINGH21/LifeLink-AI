import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { handleNearby } from "../routes/placesRoutes.js";

const originalFetch = globalThis.fetch;
const request = (query) => ({ query });
function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

afterEach(() => { globalThis.fetch = originalFetch; });

test("rejects invalid categories and coordinates", async () => {
  globalThis.fetch = () => { throw new Error("External lookup should not run"); };
  const invalidCategory = response();
  await handleNearby(request({ category: "anything", latitude: "10", longitude: "20" }), invalidCategory);
  assert.equal(invalidCategory.statusCode, 400);
  const invalidCoordinates = response();
  await handleNearby(request({ category: "hospital", latitude: "999", longitude: "20" }), invalidCoordinates);
  assert.equal(invalidCoordinates.statusCode, 400);
});

test("widens an empty search and returns mapped hospital and healthcare results", async () => {
  const queries = [];
  globalThis.fetch = async (_url, options) => {
    const query = new URLSearchParams(options.body).get("data");
    queries.push(query);
    return Response.json({ elements: queries.length === 1 ? [] : [{ type: "way", id: 42, center: { lat: 10.1, lon: 20.1 }, tags: { name: "City Clinic" } }] });
  };
  const result = response();
  await handleNearby(request({ category: "hospital", latitude: "10", longitude: "20" }), result);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.radiusKm, 15);
  assert.equal(result.body.places[0].tags.name, "City Clinic");
  assert.match(queries[0], /amenity/);
  assert.match(queries[0], /healthcare/);
  assert.match(queries[1], /around:15000/);
});

test("fails over to another map provider and reports outages clearly", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) throw new Error("provider timeout");
    return Response.json({ elements: [{ type: "node", id: 12, lat: 10, lon: 20, tags: { name: "Central Police Station" } }] });
  };
  const result = response();
  await handleNearby(request({ category: "police", latitude: "10", longitude: "20" }), result);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.places[0].tags.name, "Central Police Station");
  assert.equal(calls, 2);

  calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new Error("provider unavailable"); };
  const outage = response();
  await handleNearby(request({ category: "police", latitude: "10", longitude: "20" }), outage);
  assert.equal(outage.statusCode, 502);
  assert.match(outage.body.message, /temporarily unavailable/);
  assert.equal(calls, 2);
});
