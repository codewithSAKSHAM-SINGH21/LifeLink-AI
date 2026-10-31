import axios from "axios";

const LOCAL_API_URL = "http://localhost:5000/api";
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

if (import.meta.env.PROD && !configuredApiUrl) {
  throw new Error(
    "Missing VITE_API_URL. Set it to your deployed backend URL ending in /api before building the frontend."
  );
}

const api = axios.create({
  baseURL: configuredApiUrl || LOCAL_API_URL,
});

// Attach token automatically if logged in
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem("lifelink_user");
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      localStorage.removeItem("lifelink_user");
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem("lifelink_user")) {
      localStorage.removeItem("lifelink_user");
      window.dispatchEvent(new Event("lifelink:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export default api;
