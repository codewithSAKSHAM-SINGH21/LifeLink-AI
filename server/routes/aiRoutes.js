import express from "express";
import rateLimit from "express-rate-limit";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const SYSTEM_PROMPT = `You provide calm, concise first-aid guidance. For emergencies such as chest pain, severe bleeding, unconsciousness, difficulty breathing, stroke symptoms, severe burns or poisoning, begin by telling the person to call their local emergency number. Then give safe, numbered steps to take while help is on the way. Never diagnose, recommend prescription medicines, or imply that chat replaces emergency care. Use plain language and keep replies under 150 words.`;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_VERSION = process.env.GEMINI_API_VERSION || "v1";
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Please wait a moment before asking for more guidance." },
});

const createModel = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("AI_NOT_CONFIGURED");
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel(
    { model: GEMINI_MODEL, systemInstruction: SYSTEM_PROMPT },
    { apiVersion: GEMINI_API_VERSION }
  );
};

router.post("/chat", protect, aiLimiter, async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) return res.status(400).json({ message: "Describe what is happening first." });
  if (message.length > 2000) return res.status(413).json({ message: "Please keep your message under 2,000 characters." });

  try {
    const result = await createModel().generateContent(message);
    const reply = result.response.text()?.trim();
    if (!reply) throw new Error("AI_EMPTY_RESPONSE");
    return res.json({ reply });
  } catch (err) {
    const text = `${err?.message || ""} ${err?.status || ""}`.toLowerCase();
    console.error("First-aid guidance request failed:", err?.message || err);
    if (err?.message === "AI_NOT_CONFIGURED") {
      return res.status(503).json({ message: "First-aid guidance is temporarily unavailable. Call your local emergency number for urgent help." });
    }
    if (text.includes("quota") || text.includes("429")) {
      res.setHeader("Retry-After", "60");
      return res.status(429).json({ message: "The guidance service is busy. Please try again shortly." });
    }
    return res.status(502).json({ message: "We could not get guidance right now. For an urgent situation, call your local emergency number." });
  }
});

export default router;
