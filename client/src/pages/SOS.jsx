import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import api from "../api/axios";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function SOS() {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get("/sos/history").then(({ data }) => setHistory(data)).catch(() => {});
  }, []);

  const triggerSOS = () => {
    setStatus("locating");
    setErrorMsg("");

    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Location sharing is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setLocation(coords);
        try {
          const { data } = await api.post("/sos", coords);
          setHistory((current) => [data, ...current].slice(0, 50));
          setStatus("saved");
        } catch {
          setStatus("error");
          setErrorMsg("We could not save your alert. Call your local emergency number directly if you need urgent help.");
        }
      },
      () => {
        setStatus("error");
        setErrorMsg("Location access was denied or unavailable. Call your local emergency number directly if you need urgent help.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="page">
      <div className="page-inner sos-grid">
        <section className="glass-panel sos-panel">
          <div className="sos-mark">SOS</div>
          <h1 className="section-title">Emergency SOS</h1>
          <p className="sos-copy">Save your current coordinates to your account. This does not contact emergency services or your emergency contact.</p>

          <button
            onClick={triggerSOS}
            disabled={status === "locating"}
            aria-label="Save an SOS alert with your current location"
            className="sos-button pulse-ring"
          >
            {status === "locating" ? "…" : "SOS"}
          </button>

          <div className="mt-8 min-h-8" aria-live="polite">
            {status === "saved" && (
              <p className="notice">
                Location saved to your alert history. No one has been notified; call your local emergency number if you need urgent help.
              </p>
            )}
            {status === "error" && (
              <p role="alert" className="error-banner">
                {errorMsg}
              </p>
            )}
          </div>
        </section>

        <section className="surface sos-map map-frame overflow-hidden">
          {location ? (
            <div className="sos-leaflet">
              <MapContainer center={[location.latitude, location.longitude]} zoom={15} style={{ height: "100%", width: "100%" }}>
                <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[location.latitude, location.longitude]}><Popup>Your current location</Popup></Marker>
              </MapContainer>
            </div>
          ) : (
            <div className="sos-empty">
              <div>
                <div className="mx-auto mb-5 h-24 w-24 rounded-full border border-dashed border-slate-300 dark:border-white/20" />
                <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">Your location map</h2>
                <p className="muted mt-2 max-w-sm">Your coordinates appear here after you request an alert.</p>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="page-inner mt-8">
        <div className="surface sos-history">
          <div className="sos-history-head">
            <h2 className="section-title">Recent alerts</h2>
            <span className="muted text-sm">Saved to this account</span>
          </div>
          {history.length ? (
            <ul className="sos-history-list">
              {history.map((alert) => (
                <li key={alert.id || alert._id} className="sos-history-row">
                  <strong>{new Date(alert.createdAt).toLocaleString()}</strong>
                  <span className="muted">{Number(alert.latitude).toFixed(5)}, {Number(alert.longitude).toFixed(5)} · {alert.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted text-sm">No alerts have been saved yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
