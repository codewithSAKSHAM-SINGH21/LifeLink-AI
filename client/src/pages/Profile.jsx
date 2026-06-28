import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    bloodGroup: "",
    allergies: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setForm({
          bloodGroup: data.bloodGroup || "",
          allergies: data.allergies || "",
          emergencyContactName: data.emergencyContactName || "",
          emergencyContactPhone: data.emergencyContactPhone || "",
        });
      } catch (err) {
        // Leave fields blank if profile data cannot be loaded.
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaved(false);
    try {
      await api.put("/auth/profile", form);
      setSaved(true);
    } catch (err) {
      // Keep the form intact for the user.
    }
  };

  const qrData = encodeURIComponent(
    `Name: ${user?.name}\nBlood Group: ${form.bloodGroup}\nAllergies: ${form.allergies}\nEmergency Contact: ${form.emergencyContactName} (${form.emergencyContactPhone})`
  );
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrData}`;

  if (loading) {
    return (
      <div className="page grid place-items-center">
        <div className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow dark:bg-slate-900 dark:text-slate-300">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-inner grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="glass-panel rounded-lg p-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-slate-950 font-mono text-lg font-bold tracking-[0.08em] text-white dark:bg-white dark:text-slate-950">
            QR
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold tracking-[-0.02em] text-slate-950 dark:text-white">
            Emergency profile
          </h1>
          <p className="muted mt-2 text-sm">Responder-ready medical details for fast scanning.</p>

          <div className="mt-7 inline-block rounded-lg border border-slate-200 bg-white p-4 shadow-xl shadow-slate-950/10 dark:border-white/10">
            <img src={qrUrl} alt="Emergency QR code" className="h-56 w-56 rounded-lg" />
          </div>

          <div className="mt-6 rounded-lg bg-slate-950 p-4 text-left text-sm text-white dark:bg-white dark:text-slate-950">
            <p className="font-display font-bold">{user?.name || "LifeLink user"}</p>
            <p className="mt-1 opacity-75">Blood group: {form.bloodGroup || "Not set"}</p>
          </div>
        </aside>

        <section className="glass-panel rounded-lg p-6 sm:p-8">
          <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="section-title">Medical details</h2>
              <p className="muted mt-2">Keep these details accurate and easy to scan.</p>
            </div>
            {saved && (
              <span className="rounded-lg bg-emerald-50 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                Saved
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label">Blood group</label>
              <input
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                placeholder="e.g. O+"
                className="field"
              />
            </div>
            <div>
              <label className="label">Emergency contact phone</label>
              <input
                value={form.emergencyContactPhone}
                onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                className="field"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Allergies / conditions</label>
              <input
                value={form.allergies}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                placeholder="e.g. Penicillin allergy, asthma"
                className="field"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Emergency contact name</label>
              <input
                value={form.emergencyContactName}
                onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                className="field"
              />
            </div>

            <button type="submit" className="btn-primary sm:col-span-2">
              Save profile
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
