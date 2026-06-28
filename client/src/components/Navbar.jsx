import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = (path) =>
    `nav-link ${location.pathname === path ? "nav-link-active" : ""}`;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/94 px-4 py-3 text-white shadow-2xl shadow-slate-950/20 backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3 font-display font-bold tracking-[-0.02em]">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-600 text-lg shadow-lg shadow-red-600/30">
            +
          </span>
          <span className="text-lg">LifeLink AI</span>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
          {user && (
            <>
              <Link to="/sos" className={linkClass("/sos")}>
                SOS
              </Link>
              <Link to="/help" className={linkClass("/help")}>
                Hospitals & Police
              </Link>
              <Link to="/assistant" className={linkClass("/assistant")}>
                AI Assistant
              </Link>
              <Link to="/profile" className={linkClass("/profile")}>
                Profile
              </Link>
            </>
          )}

          <button
            onClick={() => setDark(!dark)}
            className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 font-mono text-xs font-bold text-white transition hover:bg-white/15"
            aria-label="Toggle dark mode"
            title="Toggle theme"
          >
            {dark ? "L" : "D"}
          </button>

          {user ? (
            <button
              onClick={handleLogout}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/15"
            >
              Log out
            </button>
          ) : (
            <Link to="/login" className="btn-primary min-h-10 px-4 py-2">
              Log in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
