import express from "express";
import rateLimit from "express-rate-limit";

const router = express.Router();
const endpoints = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const categories = {
  hospital: '["amenity"~"^(hospital|clinic|doctors)$"]',
  police: '["amenity"="police"]',
};
const radii = [5000, 15000, 40000];
const lookupLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Search limit reached. Please wait a minute and try again." },
});

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
  for (const radius of radii) {
    const areaQuery = category === "hospital"
      ? `nwr["healthcare"~"^(hospital|clinic|doctor)$"](around:${radius},${latitude},${longitude});`
      : "";
    const query = `[out:json][timeout:15];nwr${categories[category]}(around:${radius},${latitude},${longitude});${areaQuery}out center;`;
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
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error(`Map data service returned ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.elements)) throw new Error("Map data service returned an invalid response");
        responseReceived = true;
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
  if (lastError) {
    console.error("Nearby place lookup failed:", lastError.message);
    return res.status(502).json({ message: "The map search service is temporarily unavailable. Please try again shortly." });
  }
  return res.json({ places: [], radiusKm: 40 });
}

router.get("/nearby", lookupLimiter, handleNearby);

export default router;
