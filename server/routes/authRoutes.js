import express from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Please wait a few minutes and try again." },
});
const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  bloodGroup: user.bloodGroup || "",
  allergies: user.allergies || "",
  emergencyContactName: user.emergencyContactName || "",
  emergencyContactPhone: user.emergencyContactPhone || "",
});
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
const serverError = (res, err, action) => {
  console.error(`${action}:`, err);
  return res.status(500).json({ message: "We could not complete that request. Please try again." });
};

router.post("/signup", authLimiter, async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (name.length > 100 || phone.length > 40) {
      return res.status(400).json({ message: "Please check the length of your name or phone number." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: "Password must be between 8 and 128 characters." });
    }

    const existingUser = await User.findOne({ email }).select("_id").lean();
    if (existingUser) return res.status(409).json({ message: "An account with this email already exists." });

    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), phone });
    return res.status(201).json({ ...publicUser(user), token: generateToken(user._id) });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "An account with this email already exists." });
    return serverError(res, err, "Signup failed");
  }
});

router.post("/login", authLimiter, async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    return res.json({ ...publicUser(user), token: generateToken(user._id) });
  } catch (err) {
    return serverError(res, err, "Login failed");
  }
});

router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password").lean();
    if (!user) return res.status(404).json({ message: "Account not found." });
    return res.json(publicUser(user));
  } catch (err) {
    return serverError(res, err, "Profile lookup failed");
  }
});

router.put("/profile", protect, async (req, res) => {
  try {
    const fields = ["bloodGroup", "allergies", "emergencyContactName", "emergencyContactPhone"];
    const updates = {};
    for (const field of fields) {
      if (Object.hasOwn(req.body || {}, field)) {
        if (typeof req.body[field] !== "string") {
          return res.status(400).json({ message: "Profile details must be text." });
        }
        updates[field] = req.body[field].trim();
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Add at least one profile detail to save." });
    }
    const maxLengths = { bloodGroup: 20, allergies: 500, emergencyContactName: 100, emergencyContactPhone: 40 };
    if (Object.entries(updates).some(([field, value]) => value.length > maxLengths[field])) {
      return res.status(400).json({ message: "One or more profile details are too long." });
    }

    const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, {
      new: true,
      runValidators: true,
      projection: "-password",
    }).lean();
    if (!user) return res.status(404).json({ message: "Account not found." });
    return res.json(publicUser(user));
  } catch (err) {
    return serverError(res, err, "Profile update failed");
  }
});

export default router;
