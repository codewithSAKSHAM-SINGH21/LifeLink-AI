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
      <div className="page-inner grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="glass-panel rounded-lg p-6 text-center sm:p-8">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-lg bg-red-50 font-mono text-sm font-bold tracking-[0.08em] text-red-700 dark:bg-red-500/10 dark:text-red-200">SOS</div>
          <h1 className="section-title">Emergency SOS</h1>
          <p className="muted mx-auto mt-3 max-w-md">Save your current coordinates to your account. This does not contact emergency services or your emergency contact.</p>

          <button
            onClick={triggerSOS}
            disabled={status === "locating"}
            aria-label="Save an SOS alert with your current location"
            className="pulse-ring mx-auto mt-10 grid h-48 w-48 place-items-center rounded-full bg-red-600 font-mono text-3xl font-bold tracking-[0.08em] text-white shadow-[0_30px_80px_rgba(220,38,38,0.38)] transition hover:bg-red-700 active:scale-95 disabled:opacity-70"
          >
            {status === "locating" ? "…" : "SOS"}
          </button>

          <div className="mt-8 min-h-8" aria-live="polite">
            {status === "saved" && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                Location saved to your alert history. No one has been notified; call your local emergency number if you need urgent help.
              </p>
            )}
            {status === "error" && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                {errorMsg}
              </p>
            )}
          </div>
        </section>

        <section className="surface overflow-hidden">
          {location ? (
            <div className="h-[520px]">
              <MapContainer center={[location.latitude, location.longitude]} zoom={15} style={{ height: "100%", width: "100%" }}>
                <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[location.latitude, location.longitude]}><Popup>Your current location</Popup></Marker>
              </MapContainer>
            </div>
          ) : (
            <div className="grid min-h-[520px] place-items-center p-8 text-center">
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
        <div className="surface p-5 sm:p-6">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="section-title">Recent alerts</h2>
            <span className="muted text-sm">Saved to this account</span>
          </div>
          {history.length ? (
            <ul className="divide-y divide-slate-200 dark:divide-white/10">
              {history.map((alert) => (
                <li key={alert.id || alert._id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{new Date(alert.createdAt).toLocaleString()}</span>
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
