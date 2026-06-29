import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  if (command === "build" && !env.VITE_API_URL?.trim()) {
    throw new Error(
      "Missing VITE_API_URL. Set it to your deployed backend URL ending in /api before building the frontend."
    );
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
    },
  };
});
