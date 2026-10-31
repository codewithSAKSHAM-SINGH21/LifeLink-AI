import express from "express";
import SOS from "../models/SOS.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/sos  (protected) - trigger an SOS alert
router.post("/", protect, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (typeof latitude !== "number" || typeof longitude !== "number" ||
        !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: "Location is required" });
    }

    const sos = await SOS.create({
      user: req.userId,
      latitude,
      longitude,
    });

    return res.status(201).json({
      id: sos._id,
      latitude: sos.latitude,
      longitude: sos.longitude,
      status: sos.status,
      createdAt: sos.createdAt,
      notificationSent: false,
    });
  } catch (err) {
    console.error("SOS creation failed:", err);
    return res.status(500).json({ message: "We could not save this alert. Please try again." });
  }
});

// GET /api/sos/history (protected) - get this user's past alerts
router.get("/history", protect, async (req, res) => {
  try {
    const history = await SOS.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("latitude longitude status createdAt")
      .lean();
    return res.json(history);
  } catch (err) {
    console.error("SOS history lookup failed:", err);
    return res.status(500).json({ message: "We could not load your alert history." });
  }
});

export default router;
