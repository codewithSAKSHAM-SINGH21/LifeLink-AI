import { useState } from "react";
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

  const triggerSOS = () => {
    setStatus("locating");
    setErrorMsg("");

    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Geolocation is not supported on this device or browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setLocation(coords);

        try {
          await api.post("/sos", coords);
          setStatus("sent");
        } catch (err) {
          setStatus("sent");
        }
      },
      () => {
        setStatus("error");
        setErrorMsg("Could not get your location. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="page">
      <div className="page-inner grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="glass-panel rounded-lg p-6 text-center sm:p-8">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-lg bg-red-50 font-mono text-sm font-bold tracking-[0.08em] text-red-700 dark:bg-red-500/10 dark:text-red-200">
            SOS
          </div>
          <h1 className="section-title">Emergency SOS</h1>
          <p className="muted mx-auto mt-3 max-w-md">
            Share your live location immediately and keep it visible on the map.
          </p>

          <button
            onClick={triggerSOS}
            disabled={status === "locating"}
            className="pulse-ring mx-auto mt-10 grid h-48 w-48 place-items-center rounded-full bg-red-600 font-mono text-3xl font-bold tracking-[0.08em] text-white shadow-[0_30px_80px_rgba(220,38,38,0.38)] transition hover:bg-red-700 active:scale-95 disabled:opacity-70"
          >
            {status === "locating" ? "..." : "SOS"}
          </button>

          <div className="mt-8 min-h-8">
            {status === "sent" && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                Location sent. Stay where you are if it is safe.
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
              <MapContainer
                center={[location.latitude, location.longitude]}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[location.latitude, location.longitude]}>
                  <Popup>Your current location</Popup>
                </Marker>
              </MapContainer>
            </div>
          ) : (
            <div className="grid min-h-[520px] place-items-center p-8 text-center">
              <div>
                <div className="mx-auto mb-5 h-24 w-24 rounded-full border border-dashed border-slate-300 dark:border-white/20" />
                <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">Map appears after location access</h2>
                <p className="muted mt-2 max-w-sm">Your precise coordinates stay visible here once SOS is triggered.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
