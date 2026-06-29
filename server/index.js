import "dotenv/config";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import sosRoutes from "./routes/sosRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

const app = express();
const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("LifeLink AI API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/ai", aiRoutes);

const PORT = Number(process.env.PORT) || 5000;
const server = http.createServer(app);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the existing server or set a different PORT in .env.`
    );
    process.exit(1);
  }

  console.error("Server error:", err);
  process.exit(1);
});

const startServer = () => {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

const shutdown = () => {
  server.close(() => {
    mongoose.connection.close(false).finally(() => process.exit(0));
  });
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    startServer();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });
