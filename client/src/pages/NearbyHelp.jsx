import { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

// Multiple Overpass mirrors - if one is down/rate-limited, try the next
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

// Progressive radius widening if nothing is found nearby (in meters)
const RADIUS_STEPS = [5000, 15000, 40000];

async function queryOverpass(amenity, latitude, longitude, radius) {
  const query = `
    [out:json][timeout:20];
    nwr["amenity"="${amenity}"](around:${radius},${latitude},${longitude});
    out center;
  `;

  let lastError = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: query,
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const seen = new Set();
      return (data.elements || []).filter((place) => {
        const key = `${place.type || "node"}/${place.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } catch (err) {
      lastError = err;
      // try next mirror
    }
  }
  throw lastError || new Error("All Overpass mirrors failed");
}

export default function NearbyHelp() {
  const [places, setPlaces] = useState([]);
  const [center, setCenter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingNote, setLoadingNote] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("hospital");
  const [searchedRadiusKm, setSearchedRadiusKm] = useState(null);
  const [searched, setSearched] = useState(false);

  const findNearby = () => {
    setLoading(true);
    setError("");
    setPlaces([]);
    setSearchedRadiusKm(null);
    setSearched(false);
    setLoadingNote("Getting your location...");

    if (!navigator.geolocation) {
      setError("Location access is not available in this browser.");
      setLoading(false);
      setLoadingNote("");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenter([latitude, longitude]);
        const amenity = filter === "hospital" ? "hospital" : "police";

        try {
          let found = [];
          for (const radius of RADIUS_STEPS) {
            setLoadingNote(
              radius === 5000
                ? "Searching nearby..."
                : `Expanding search to ${radius / 1000}km...`
            );
            found = await queryOverpass(amenity, latitude, longitude, radius);
            setSearchedRadiusKm(radius / 1000);
            if (found.length > 0) break;
          }
          setPlaces(found);
          setSearched(true);
        } catch (err) {
          setError(
            "Could not reach the map data service right now. Please check your connection and try again."
          );
        } finally {
          setLoading(false);
          setLoadingNote("");
        }
      },
      () => {
        setError("Location access is needed to find nearby help.");
        setLoading(false);
        setLoadingNote("");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  return (
    <div className="page">
      <div className="page-inner">
        <div className="nearby-header">
          <div className="page-heading mb-0">
            <h1 className="section-title">Find help nearby</h1>
            <p className="muted mt-2">Locate hospitals and police stations around your current position.</p>
          </div>

          <div className="nearby-controls">
            {[
              ["hospital", "Hospitals"],
              ["police", "Police"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => {
                  setFilter(value);
                  setPlaces([]);
                  setSearchedRadiusKm(null);
                  setSearched(false);
                }}
                aria-pressed={filter === value}
                className={filter === value ? "btn-primary" : "btn-ghost"}
              >
                {label}
              </button>
            ))}
            <button onClick={findNearby} disabled={loading} className="btn-dark">
              {loading ? "Searching..." : "Search near me"}
            </button>
          </div>
        </div>

        {loading && loadingNote && (
          <p className="muted mb-4 text-sm" role="status">{loadingNote}</p>
        )}

        {error && (
          <p role="alert" className="error-banner mb-4">
            {error}
          </p>
        )}

        <div className="nearby-grid">
          <div className="map-frame nearby-map">
            {center ? (
              <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
                <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={center}>
                  <Popup>You are here</Popup>
                </Marker>
                {places.map((p) => {
                  const latitude = p.lat ?? p.center?.lat;
                  const longitude = p.lon ?? p.center?.lon;
                  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
                  return <Marker key={`${p.type || "node"}/${p.id}`} position={[latitude, longitude]}>
                    <Popup>{p.tags?.name || (filter === "hospital" ? "Hospital" : "Police station")}</Popup>
                  </Marker>;
                })}
              </MapContainer>
            ) : (
              <div className="empty-state h-full">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">Ready to scan your area</h2>
                  <p className="muted mt-2 max-w-sm">Choose a category, then search near your current location.</p>
                </div>
              </div>
            )}
          </div>

          <aside className="surface nearby-results">
            <div className="nearby-results-head">
              <h2>Nearby services</h2>
              <span className="result-count">
                {places.length}
              </span>
            </div>

            {places.length > 0 ? (
              <>
                <p className="muted mb-3 text-xs font-mono">
                  Found within ~{searchedRadiusKm} km
                </p>
                <ul className="space-y-3">
                  {places.map((p) => {
                    const latitude = p.lat ?? p.center?.lat;
                    const longitude = p.lon ?? p.center?.lon;
                    return <li key={`${p.type || "node"}/${p.id}`} className="place-card">
                      <h3>
                        {p.tags?.name || (filter === "hospital" ? "Unnamed hospital" : "Unnamed police station")}
                      </h3>
                      <p>
                        {p.tags?.["addr:street"] || "Address not listed"}
                      </p>
                      {Number.isFinite(latitude) && Number.isFinite(longitude) && (
                        <a href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`} target="_blank" rel="noreferrer">Directions</a>
                      )}
                    </li>;
                  })}
                </ul>
              </>
            ) : searched && !loading && !error && center ? (
              <div className="muted text-sm">
                <p className="mb-2">
                  No {filter === "hospital" ? "hospitals" : "police stations"} found
                  within {searchedRadiusKm ?? 40} km on OpenStreetMap's records for
                  this area.
                </p>
                <p className="text-xs">
                  This usually means the area isn't fully mapped yet on
                  OpenStreetMap, not that none exist nearby. Try the other
                  category, or in a real emergency call local emergency services
                  directly.
                </p>
              </div>
            ) : (
              <p className="empty-state">{center ? "Search this category to update the results." : "Search near you to see nearby services."}</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
