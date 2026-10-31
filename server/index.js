import "dotenv/config";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/authRoutes.js";
import sosRoutes from "./routes/sosRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());

const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]?.trim());
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
  console.warn("CLIENT_ORIGIN is not set; configure it to restrict browser access to the API.");
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "16kb" }));

app.get("/", (_req, res) => res.json({ service: "LifeLink API", status: "running" }));
app.get("/api/health", (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "unavailable", database: ready ? "connected" : "disconnected" });
});

app.use("/api/auth", authRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/ai", aiRoutes);

app.use((_req, res) => res.status(404).json({ message: "Endpoint not found" }));
app.use((err, _req, res, _next) => {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body must be valid JSON." });
  }
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large" });
  }
  if (err?.message === "Origin is not allowed by CORS") {
    return res.status(403).json({ message: "This website is not allowed to access the API" });
  }
  console.error("Unhandled API error:", err);
  return res.status(500).json({ message: "Something went wrong. Please try again." });
});

const PORT = Number(process.env.PORT) || 5000;
let shuttingDown = false;
let serverStarted = false;
const server = http.createServer(app);

const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; shutting down`);
  const closeDatabase = async () => {
    try {
      await mongoose.connection.close(false);
    } finally {
      process.exit(0);
    }
  };
  if (serverStarted) server.close(closeDatabase);
  else await closeDatabase();
  setTimeout(() => process.exit(1), 10000).unref();
};

server.on("error", (err) => {
  console.error("HTTP server failed to start:", err.message);
  process.exit(1);
});

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

mongoose
  .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => {
      serverStarted = true;
      console.log(`LifeLink API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

mongoose.connection.on("error", (err) => console.error("MongoDB connection error:", err.message));
