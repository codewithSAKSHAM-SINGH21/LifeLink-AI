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
    <nav className="sticky top-0 z-50 border-b border-[#e1e5e0] bg-[#f7f8f5]/95 px-5 py-3 backdrop-blur sm:px-8">
      <div className="nav-inner">
        <Link to="/" className="nav-brand">
          <span className="nav-brand-mark">+</span>
          <span className="text-lg">LifeLink</span>
        </Link>

        <div className="nav-actions">
          {user && (
            <>
              <Link to="/sos" className={linkClass("/sos")}>
                SOS
              </Link>
              <Link to="/help" className={linkClass("/help")}>
                Nearby help
              </Link>
              <Link to="/assistant" className={linkClass("/assistant")}>
                First aid
              </Link>
              <Link to="/profile" className={linkClass("/profile")}>
                Profile
              </Link>
            </>
          )}

          <button
            onClick={() => setDark(!dark)}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#d9dfd9] bg-white text-xs font-bold text-[#345543] transition hover:bg-[#eef1eb]"
            aria-label="Toggle dark mode"
            title="Toggle theme"
          >
            {dark ? "☼" : "◐"}
          </button>

          {user ? (
            <button
              onClick={handleLogout}
              className="rounded border border-[#d9dfd9] px-4 py-2 text-sm font-semibold text-[#345543] transition hover:bg-[#eef1eb]"
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
