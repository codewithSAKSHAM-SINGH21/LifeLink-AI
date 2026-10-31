import express from "express";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const SYSTEM_PROMPT = `You provide calm, concise first-aid guidance. For emergencies such as chest pain, severe bleeding, unconsciousness, difficulty breathing, stroke symptoms, severe burns or poisoning, begin by telling the person to call their local emergency number. Then give safe, numbered steps to take while help is on the way. Never diagnose, recommend prescription medicines, or imply that chat replaces emergency care. Use plain language and keep replies under 150 words.`;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Please wait a moment before asking for more guidance." },
});

const createClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("AI_NOT_CONFIGURED");
  return new GoogleGenAI({ apiKey });
};

const getProviderErrorDetails = (err) => {
  const status = Number(err?.status || err?.httpStatus || err?.response?.status) || 0;
  const message = String(err?.message || "").toLowerCase();
  return { status, message };
};

const isModelAvailabilityError = (err) => {
  const { status, message } = getProviderErrorDetails(err);
  return (
    status === 404 ||
    (message.includes("model") &&
      ["not found", "not available", "not supported", "permission"].some((phrase) => message.includes(phrase)))
  );
};

const generateFirstAidReply = async (client, message) => {
  const models = [...new Set([GEMINI_MODEL, "gemini-3.5-flash-lite"])];
  let lastError;

  for (const [index, model] of models.entries()) {
    try {
      const result = await client.models.generateContent({
        model,
        contents: message,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          maxOutputTokens: 500,
        },
      });
      const reply = result.text?.trim();
      if (!reply) throw new Error("AI_EMPTY_RESPONSE");
      return reply;
    } catch (err) {
      lastError = err;
      if (index === models.length - 1 || !isModelAvailabilityError(err)) throw err;
      console.warn(`Configured Gemini model is unavailable; retrying with ${models[index + 1]}.`);
    }
  }

  throw lastError;
};

router.post("/chat", protect, aiLimiter, async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) return res.status(400).json({ message: "Describe what is happening first." });
  if (message.length > 2000) return res.status(413).json({ message: "Please keep your message under 2,000 characters." });

  try {
    const client = createClient();
    const reply = await generateFirstAidReply(client, message);
    return res.json({ reply });
  } catch (err) {
    const { status, message: providerMessage } = getProviderErrorDetails(err);
    console.error("First-aid guidance request failed:", {
      status: status || "unknown",
      code: err?.name || "unknown",
      message: err?.message || "Unknown provider error",
      model: GEMINI_MODEL,
    });
    if (err?.message === "AI_NOT_CONFIGURED") {
      return res.status(503).json({ message: "First-aid AI is not configured. Please contact the site administrator. For an emergency, call your local emergency number." });
    }
    if (status === 429 || providerMessage.includes("quota") || providerMessage.includes("resource exhausted")) {
      res.setHeader("Retry-After", "60");
      return res.status(429).json({ message: "The guidance service is busy. Please try again shortly." });
    }
    if (status === 401 || (status === 403 && !isModelAvailabilityError(err)) || providerMessage.includes("api key")) {
      return res.status(503).json({ message: "First-aid AI could not authenticate with its provider. Please contact the site administrator. For an emergency, call your local emergency number." });
    }
    if (isModelAvailabilityError(err)) {
      return res.status(503).json({ message: "The configured first-aid AI model is unavailable. Please contact the site administrator. For an emergency, call your local emergency number." });
    }
    return res.status(502).json({ message: "We could not get guidance right now. For an urgent situation, call your local emergency number." });
  }
});

export default router;
