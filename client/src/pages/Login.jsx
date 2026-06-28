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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page flex items-center justify-center">
      <div className="glass-panel grid w-full max-w-5xl overflow-hidden rounded-lg lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden bg-slate-950 p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-red-600 font-display text-xl font-bold">+</div>
            <h1 className="mt-8 font-display text-4xl font-bold tracking-[-0.02em]">Welcome back.</h1>
            <p className="mt-4 max-w-sm text-slate-300">
              Open your emergency dashboard, update your profile, or get fast
              first-aid guidance when every second matters.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["SOS", "MAP", "AI"].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/10 p-4 text-center font-mono text-sm font-bold tracking-[0.08em]">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <h2 className="font-display text-3xl font-bold tracking-[-0.02em] text-slate-950 dark:text-white">
            Log in
          </h2>
          <p className="muted mt-2 text-sm">Access your LifeLink emergency tools.</p>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="field"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="field"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="muted mt-6 text-center text-sm">
            Do not have an account?{" "}
            <Link to="/signup" className="font-semibold text-red-600 hover:underline dark:text-red-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
