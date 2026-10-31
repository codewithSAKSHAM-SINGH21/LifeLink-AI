import express from "express";
import rateLimit from "express-rate-limit";

const router = express.Router();
const endpoints = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
const categories = {
  hospital: '["amenity"~"^(hospital|clinic|doctors)$"]',
  police: '["amenity"="police"]',
};
const radii = [5000, 15000, 40000];
const overpassTimeoutSeconds = 10;
const requestTimeoutMs = 12000;
const nominatimCacheTtlMs = 10 * 60 * 1000;
const nominatimRequestTimeoutMs = 3000;
const nominatimBaseUrl = process.env.NOMINATIM_BASE_URL?.trim() || "https://nominatim.openstreetmap.org";
const nominatimCache = new Map();
let nominatimQueue = Promise.resolve();
let lastNominatimRequestAt = 0;
const lookupLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Search limit reached. Please wait a minute and try again." },
});

const distanceInMeters = (latitudeA, longitudeA, latitudeB, longitudeB) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const value = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB)) *
    Math.sin(longitudeDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

async function searchNominatim(category, latitude, longitude) {
  const cacheKey = `${category}:${latitude.toFixed(3)}:${longitude.toFixed(3)}`;
  const cached = nominatimCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.places;

  const radiusKm = 40;
  const latitudeDelta = radiusKm / 111.32;
  const longitudeDelta = Math.min(180, radiusKm / (111.32 * Math.max(0.01, Math.cos((latitude * Math.PI) / 180))));
  const params = new URLSearchParams({
    q: category === "hospital" ? "hospital" : "police station",
    format: "jsonv2",
    limit: "40",
    addressdetails: "1",
    viewbox: `${longitude - longitudeDelta},${latitude + latitudeDelta},${longitude + longitudeDelta},${latitude - latitudeDelta}`,
    bounded: "1",
  });
  const request = async () => {
    const queuedCache = nominatimCache.get(cacheKey);
    if (queuedCache && queuedCache.expiresAt > Date.now()) return queuedCache.places;
    const waitMs = Math.max(0, 1000 - (Date.now() - lastNominatimRequestAt));
    if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastNominatimRequestAt = Date.now();
    const response = await fetch(`${nominatimBaseUrl.replace(/\/$/, "")}/search?${params}`, {
      headers: {
        "User-Agent": "LifeLink/1.0 (+https://github.com/codewithSAKSHAM-SINGH21/LifeLink-AI; nearby-service-search)",
        "Accept-Language": "en",
      },
      signal: AbortSignal.timeout(nominatimRequestTimeoutMs),
    });
    if (!response.ok) throw new Error(`Nominatim returned ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Nominatim returned an invalid response");

    const places = data
      .map((place) => {
        const lat = Number(place.lat);
        const lon = Number(place.lon);
        const address = place.address || {};
        return {
          type: place.osm_type === "node" ? "node" : place.osm_type === "relation" ? "relation" : "way",
          id: place.osm_id,
          lat,
          lon,
          tags: {
            name: place.name || place.display_name,
            amenity: category === "hospital" ? "hospital" : "police",
            "addr:street": address.road || address.pedestrian || address.street || "",
            "addr:city": address.city || address.town || address.village || "",
          },
        };
      })
      .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lon))
      .map((place) => ({ ...place, distance: distanceInMeters(latitude, longitude, place.lat, place.lon) }))
      .filter((place) => place.distance <= radiusKm * 1000)
      .sort((placeA, placeB) => placeA.distance - placeB.distance)
      .map(({ distance, ...place }) => place);

    nominatimCache.set(cacheKey, { places, expiresAt: Date.now() + nominatimCacheTtlMs });
    return places;
  };

  const result = nominatimQueue.then(request);
  nominatimQueue = result.catch(() => {});
  return result;
}

export async function handleNearby(req, res) {
  const category = req.query.category;
  const latitudeInput = req.query.latitude;
  const longitudeInput = req.query.longitude;
  const latitude = Number(latitudeInput);
  const longitude = Number(longitudeInput);
  if (typeof category !== "string" || !Object.hasOwn(categories, category)) {
    return res.status(400).json({ message: "Choose hospitals or police stations to search." });
  }
  if (typeof latitudeInput !== "string" || !latitudeInput.trim() ||
      typeof longitudeInput !== "string" || !longitudeInput.trim() ||
      !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return res.status(400).json({ message: "A valid location is required to search nearby." });
  }

  let lastError;
  let overpassResponded = false;
  for (const radius of radii) {
    const areaQuery = category === "hospital"
      ? `nwr["healthcare"~"^(hospital|clinic|doctor)$"](around:${radius},${latitude},${longitude});`
      : "";
    const query = `[out:json][timeout:${overpassTimeoutSeconds}];nwr${categories[category]}(around:${radius},${latitude},${longitude});${areaQuery}out center;`;
    let responseReceived = false;
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "User-Agent": "LifeLink/1.0 (nearby service lookup)",
          },
          body: new URLSearchParams({ data: query }),
          // Leave transport headroom beyond the Overpass query timeout so a
          // valid query is not cancelled just before the provider responds.
          signal: AbortSignal.timeout(requestTimeoutMs),
        });
        if (!response.ok) throw new Error(`Map data service returned ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.elements)) throw new Error("Map data service returned an invalid response");
        responseReceived = true;
        overpassResponded = true;
        lastError = null;
        const seen = new Set();
        const places = (data.elements || []).filter((place) => {
          const key = `${place.type || "node"}/${place.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        if (places.length) return res.json({ places, radiusKm: radius / 1000 });
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!responseReceived) break;
  }
  try {
    const places = await searchNominatim(category, latitude, longitude);
    if (places.length) return res.json({ places, radiusKm: 40 });
    if (!overpassResponded && lastError) {
      return res.json({ places: [], radiusKm: 40 });
    }
  } catch (error) {
    if (!overpassResponded && lastError) {
      console.error("Nearby place lookup failed for all providers:", lastError.message, error.message);
      return res.status(502).json({ message: "The map search service is temporarily unavailable. Please try again shortly." });
    }
    console.warn("Nominatim fallback failed:", error.message);
  }
  return res.json({ places: [], radiusKm: 40 });
}

router.get("/nearby", lookupLimiter, handleNearby);

export default router;
