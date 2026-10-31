import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("lifelink_user") || "null");
      if (stored?.token && stored?._id) setUser(stored);
      else localStorage.removeItem("lifelink_user");
    } catch {
      localStorage.removeItem("lifelink_user");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener("lifelink:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("lifelink:unauthorized", handleUnauthorized);
  }, []);

  const login = (userData) => {
    localStorage.setItem("lifelink_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("lifelink_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
