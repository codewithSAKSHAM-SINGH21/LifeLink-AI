import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "We could not sign you in. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page auth-page">
      <div className="auth-card">
        <aside className="auth-side">
          <div>
            <div className="auth-mark" aria-hidden="true">+</div>
            <h1>Welcome back.</h1>
            <p>Access your emergency tools, update your medical details, or review first-aid guidance.</p>
          </div>
          <div className="auth-features" aria-label="LifeLink tools">
            <span>SOS</span><span>NEARBY HELP</span><span>FIRST AID</span>
          </div>
        </aside>

        <section className="auth-content">
          <h2>Sign in</h2>
          <p>Access your LifeLink account and emergency tools.</p>
          {error && <div role="alert" className="error-banner mt-6">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label className="label" htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="field"
              />
            </div>
            <div>
              <label className="label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="field"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="auth-footer">New to LifeLink? <Link to="/signup">Create an account</Link></p>
        </section>
      </div>
    </main>
  );
}
