import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const router = express.Router();

const SYSTEM_PROMPT = `You are LifeLink AI, a calm and clear emergency first-aid assistant embedded in an emergency response app.
Rules you must always follow:
- Give short, clear, step-by-step first-aid guidance (numbered steps).
- For anything serious (chest pain, severe bleeding, unconsciousness, difficulty breathing, suspected stroke, severe burns, poisoning), your FIRST line must tell the user to call local emergency services immediately, then give safe steps to take while help is on the way.
- Never give a medical diagnosis. You give first-aid guidance only, not medical advice.
- Keep responses under 150 words.
- Use plain, simple language a panicked person can follow.`;

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_VERSION = process.env.GEMINI_API_VERSION || "v1";
const getApiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const createModel = () => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Set GEMINI_API_KEY in server/.env.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({
    model: GEMINI_MODEL,
  }, {
    apiVersion: GEMINI_API_VERSION,
  });
};

const parseAiError = (err) => {
  const text = err?.message || String(err);
  const lower = text.toLowerCase();

  if (lower.includes("api key") || lower.includes("api_key_invalid")) {
    return {
      status: 401,
      body: {
        message: "Gemini API key is invalid or not authorized. Check your key and project billing.",
        error: text,
      },
    };
  }

  if (lower.includes("quota exceeded") || lower.includes("too many requests")) {
    const retryMatch = text.match(/retry in ([0-9]+(?:\.[0-9]+)?)s/i);
    const retryAfter = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : undefined;

    return {
      status: 429,
      body: {
        message: "Gemini quota exhausted. Check your Google Cloud project plan and retry later.",
        error: text,
        retryAfter,
      },
      retryAfter,
    };
  }

  if (lower.includes("not found") || lower.includes("unsupported")) {
    return {
      status: 400,
      body: {
        message: `Gemini model \"${GEMINI_MODEL}\" is not available. Update GEMINI_MODEL or verify the model name in server/.env.`,
        error: text,
      },
    };
  }

  return {
    status: 502,
    body: {
      message: "AI service error",
      error: text,
    },
  };
};

// POST /api/ai/chat - no auth required so it works instantly in a demo
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ message: "Message is required" });
    }

    const model = createModel();
    // pass the system prompt as the first part of the content array
    const result = await model.generateContent([SYSTEM_PROMPT, message.trim()]);
    const reply = result.response.text();

    res.json({ reply });
  } catch (err) {
    console.error("AI generation error:", err.message);
    const parsed = parseAiError(err);

    if (parsed.retryAfter) {
      res.setHeader("Retry-After", parsed.retryAfter);
    }

    res.status(parsed.status).json(parsed.body);
  }
});

export default router;
