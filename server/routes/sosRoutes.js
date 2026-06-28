import express from "express";
import SOS from "../models/SOS.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/sos  (protected) - trigger an SOS alert
router.post("/", protect, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({ message: "Location is required" });
    }

    const sos = await SOS.create({
      user: req.userId,
      latitude,
      longitude,
    });

    // In a full version: trigger SMS/email to emergency contacts here (Twilio/Nodemailer)
    res.status(201).json(sos);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/sos/history (protected) - get this user's past alerts
router.get("/history", protect, async (req, res) => {
  try {
    const history = await SOS.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
