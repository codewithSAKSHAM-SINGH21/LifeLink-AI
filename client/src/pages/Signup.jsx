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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", form);
      login(data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page flex items-center justify-center">
      <div className="glass-panel w-full max-w-2xl rounded-lg p-6 sm:p-8 lg:p-10">
        <div className="mb-8">
          <div className="mb-4 inline-flex rounded-lg bg-red-50 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-red-700 dark:bg-red-500/10 dark:text-red-200">
            New responder profile
          </div>
          <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-slate-950 dark:text-white">
            Create your account
          </h1>
          <p className="muted mt-2">Set up the details that help LifeLink help you faster.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Full name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="field"
            />
          </div>
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
            <label className="label">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="field"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="field"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary sm:col-span-2">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="muted mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-red-600 hover:underline dark:text-red-300">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
