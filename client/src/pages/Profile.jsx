import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
        setError(err.response?.data?.message || "We could not load your medical details. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaved(false);
    setError("");
    setSaving(true);
    try {
      await api.put("/auth/profile", form);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || "We could not save your details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const qrData = [
    `Name: ${user?.name || ""}`,
    `Blood group: ${form.bloodGroup || "Not set"}`,
    `Allergies or conditions: ${form.allergies || "Not set"}`,
    `Emergency contact: ${form.emergencyContactName || "Not set"} (${form.emergencyContactPhone || "Not set"})`,
  ].join("\n");

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
      <div className="page-inner profile-layout">
        <aside className="glass-panel profile-summary">
          <div className="profile-symbol">
            QR
          </div>
          <h1 className="section-title">
            Emergency profile
          </h1>
          <p className="profile-summary-copy">Keep key medical details accessible in an emergency.</p>

          <div className="profile-qr">
              <QRCodeSVG value={qrData} size={220} level="Q" includeMargin role="img" aria-label="Emergency profile QR code" />
          </div>
          <p className="profile-privacy">This code contains the details shown below. Anyone who scans it can read them.</p>

          <div className="profile-identity">
            <strong>{user?.name || "LifeLink user"}</strong>
            <p>Blood group: {form.bloodGroup || "Not set"}</p>
          </div>
        </aside>

        <section className="glass-panel profile-editor">
          <div className="profile-editor-head">
            <div>
              <h2 className="section-title">Medical details</h2>
              <p>Keep these details accurate and up to date.</p>
            </div>
            {saved && (
              <span className="status-pill">
                Saved
              </span>
            )}
          </div>

          {error && <p role="alert" className="error-banner mb-5">{error}</p>}

          <form onSubmit={handleSave} className="profile-form">
            <div>
              <label className="label" htmlFor="profile-blood-group">Blood group</label>
              <input
                id="profile-blood-group"
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                placeholder="e.g. O+"
                className="field"
              />
            </div>
            <div>
              <label className="label" htmlFor="profile-contact-phone">Emergency contact phone</label>
              <input
                id="profile-contact-phone"
                type="tel"
                value={form.emergencyContactPhone}
                onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                className="field"
              />
            </div>
            <div className="form-span">
              <label className="label" htmlFor="profile-allergies">Allergies / conditions</label>
              <input
                id="profile-allergies"
                value={form.allergies}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                placeholder="e.g. Penicillin allergy, asthma"
                className="field"
              />
            </div>
            <div className="form-span">
              <label className="label" htmlFor="profile-contact-name">Emergency contact name</label>
              <input
                id="profile-contact-name"
                value={form.emergencyContactName}
                onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                className="field"
              />
            </div>

            <button type="submit" disabled={saving} className="btn-primary form-span">
              {saving ? "Saving…" : "Save profile"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
