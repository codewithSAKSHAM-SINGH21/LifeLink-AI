import { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

export default function NearbyHelp() {
  const [places, setPlaces] = useState([]);
  const [center, setCenter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("hospital");

  const findNearby = () => {
    setLoading(true);
    setError("");
    setPlaces([]);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenter([latitude, longitude]);

        const amenity = filter === "hospital" ? "hospital" : "police";
        const radius = 5000;
        const query = `
          [out:json];
          node["amenity"="${amenity}"](around:${radius},${latitude},${longitude});
          out body;
        `;

        try {
          const res = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: query,
          });
          const data = await res.json();
          setPlaces(data.elements || []);
        } catch (err) {
          setError("Could not fetch nearby places. Try again.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location access is needed to find nearby help.");
        setLoading(false);
      }
    );
  };

  return (
    <div className="page">
      <div className="page-inner">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="section-title">Find help nearby</h1>
            <p className="muted mt-2">Locate hospitals and police stations around your current position.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ["hospital", "Hospitals"],
              ["police", "Police"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
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

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </p>
        )}

        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="map-frame h-[560px] bg-white dark:bg-slate-900">
            {center ? (
              <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={center}>
                  <Popup>You are here</Popup>
                </Marker>
                {places.map((p) => (
                  <Marker key={p.id} position={[p.lat, p.lon]}>
                    <Popup>{p.tags?.name || (filter === "hospital" ? "Hospital" : "Police station")}</Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="grid h-full place-items-center p-8 text-center">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">Ready to scan your area</h2>
                  <p className="muted mt-2 max-w-sm">Choose a category, then search near your current location.</p>
                </div>
              </div>
            )}
          </div>

          <aside className="surface max-h-[560px] overflow-y-auto p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display font-bold text-slate-950 dark:text-white">Results</h2>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                {places.length}
              </span>
            </div>

            {places.length > 0 ? (
              <ul className="space-y-3">
                {places.map((p) => (
                  <li key={p.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="font-display font-bold text-slate-950 dark:text-white">
                      {p.tags?.name || (filter === "hospital" ? "Unnamed hospital" : "Unnamed police station")}
                    </p>
                    <p className="muted mt-1 text-sm">
                      {p.tags?.["addr:street"] || "Address not listed"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted text-sm">
                {center ? "No results found nearby. Try the other category." : "Results will appear here."}
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
