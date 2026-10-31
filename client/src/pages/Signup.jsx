import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", form);
      login(data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "We could not create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page auth-page">
      <section className="auth-card auth-card--signup">
        <div className="auth-content">
          <div className="auth-heading">
            <p className="eyebrow"><span className="eyebrow-mark" />Get started</p>
            <h1>Create your account</h1>
            <p className="muted">Save your medical details and use LifeLink’s emergency tools.</p>
          </div>

          {error && <div role="alert" className="error-banner mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="signup-name">Full name</label>
              <input id="signup-name" autoComplete="name" required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="signup-email">Email address</label>
              <input id="signup-email" type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="signup-phone">Phone number <span className="optional-label">(optional)</span></label>
              <input id="signup-phone" type="tel" autoComplete="tel" maxLength={40} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="field" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="signup-password">Password</label>
              <input id="signup-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="field" />
              <p className="field-hint">Use at least 8 characters.</p>
            </div>
            <button type="submit" disabled={loading} className="btn-primary sm:col-span-2">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </section>
    </main>
  );
}
