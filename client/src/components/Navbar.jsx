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
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3 font-bold tracking-[-0.02em] text-[#203c2f] no-underline">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#244637] text-xl text-white">+</span>
          <span className="text-lg">LifeLink</span>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
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
