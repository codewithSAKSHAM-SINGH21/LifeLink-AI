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

test("allows the map provider longer than the Overpass query timeout", async () => {
  const timeoutValues = [];
  const originalTimeout = AbortSignal.timeout;
  AbortSignal.timeout = (milliseconds) => {
    timeoutValues.push(milliseconds);
    return originalTimeout.call(AbortSignal, milliseconds);
  };
  globalThis.fetch = async (_url, options) => {
    const query = new URLSearchParams(options.body).get("data");
    assert.match(query, /\[timeout:10\]/);
    assert.ok(timeoutValues.at(-1) > 10000);
    return Response.json({ elements: [{ type: "node", id: 9, lat: 10, lon: 20, tags: { name: "City Hospital" } }] });
  };
  try {
    const result = response();
    await handleNearby(request({ category: "hospital", latitude: "10", longitude: "20" }), result);
    assert.equal(result.statusCode, 200);
    assert.equal(timeoutValues[0], 12000);
  } finally {
    AbortSignal.timeout = originalTimeout;
  }
});

test("fails over to another map provider and reports outages clearly", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls < 3) throw new Error("provider timeout");
    return Response.json({ elements: [{ type: "node", id: 12, lat: 10, lon: 20, tags: { name: "Central Police Station" } }] });
  };
  const result = response();
  await handleNearby(request({ category: "police", latitude: "10", longitude: "20" }), result);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.places[0].tags.name, "Central Police Station");
  assert.equal(calls, 3);

  calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new Error("provider unavailable"); };
  const outage = response();
  await handleNearby(request({ category: "police", latitude: "10", longitude: "20" }), outage);
  assert.equal(outage.statusCode, 502);
  assert.match(outage.body.message, /temporarily unavailable/);
  assert.equal(calls, 4);
});

test("uses nearby hospitals from Nominatim when all Overpass providers fail", async () => {
  const requestedUrls = [];
  globalThis.fetch = async (url, options) => {
    requestedUrls.push(String(url));
    if (String(url).startsWith("https://nominatim.openstreetmap.org/search?")) {
      assert.match(options.headers["User-Agent"], /LifeLink/);
      return Response.json([{
        osm_type: "way",
        osm_id: 734,
        lat: "11.05",
        lon: "21.05",
        type: "hospital",
        name: "Nearby Community Hospital",
        display_name: "Nearby Community Hospital, Main Road",
        address: { road: "Main Road", city: "Sample City" },
      }]);
    }
    throw new Error("Overpass unavailable");
  };

  const result = response();
  await handleNearby(request({ category: "hospital", latitude: "11", longitude: "21" }), result);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.radiusKm, 40);
  assert.equal(result.body.places[0].id, 734);
  assert.equal(result.body.places[0].tags.name, "Nearby Community Hospital");
  assert.equal(result.body.places[0].tags["addr:street"], "Main Road");
  assert.equal(requestedUrls.length, 4);
  assert.ok(requestedUrls.at(-1).startsWith("https://nominatim.openstreetmap.org/search?"));
});
