import express from "express";
import User from "../models/User.js";
import AIHistory from "../models/AIHistory.js";
import { protect, optionalAuth } from "../middleware/auth.js";
import { buildFallbackAnswer, callGemini, detectWeakTopics } from "../utils/ai.js";

const router = express.Router();

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

router.get("/provider", (req, res) => {
  res.json({
    provider: process.env.AI_PROVIDER || "gemini",
    model: process.env.GEMINI_MODEL || process.env.OPENAI_MODEL || "fallback",
    configured: Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY)
  });
});

router.get("/test", (req, res) => {
  res.json({
    ok: true,
    provider: process.env.AI_PROVIDER || "gemini",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash"
  });
});

router.post("/solve", optionalAuth, async (req, res) => {
  try {
    const question = String(req.body.question || "").trim();
    if (!question) return res.status(400).json({ message: "Question required" });

    let user = null;
    if (req.userId) user = await User.findById(req.userId);

    const { start, end } = todayRange();
    const dailyUsed = user ? await AIHistory.countDocuments({ userId: user._id, createdAt: { $gte: start, $lt: end } }) : 0;
    const limit = user?.isPremiumActive?.()
      ? Number(process.env.PREMIUM_DAILY_AI_LIMIT || 5000)
      : Number(process.env.FREE_DAILY_AI_LIMIT || 100);

    if (user && dailyUsed >= limit) {
      return res.status(429).json({ message: `Daily AI limit reached (${dailyUsed}/${limit})`, used: dailyUsed, limit });
    }

    const weakTopics = detectWeakTopics(question);
    if (user && weakTopics.length) {
      for (const t of weakTopics) {
        if (!user.weakTopics.includes(t)) user.weakTopics.push(t);
      }
      user.questionsAsked += 1;
      await user.save();
    }

    const context = user
      ? `Name: ${user.name}\nPlan: ${user.plan}\nWeak topics: ${user.weakTopics.join(", ") || "None"}`
      : "Guest user";

    let answer = "";
    let provider = "fallback";

    try {
      if ((process.env.AI_PROVIDER || "gemini") === "gemini") {
        answer = await callGemini(question, context);
        provider = "gemini";
      }
    } catch (err) {
      answer = buildFallbackAnswer(question) + `\n\n> AI fallback active: ${err.message}`;
    }

    if (!answer) answer = buildFallbackAnswer(question);

    const history = await AIHistory.create({
      userId: user?._id || null,
      question,
      answer,
      provider,
      model: process.env.GEMINI_MODEL || ""
    });

    res.json({
      answer,
      provider,
      used: user ? dailyUsed + 1 : null,
      limit: user ? limit : null,
      historyId: history._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "AI solve failed" });
  }
});

router.get("/history", optionalAuth, async (req, res) => {
  const query = req.userId ? { userId: req.userId } : { userId: null };
  const data = await AIHistory.find(query).sort({ createdAt: -1 }).limit(50);
  res.json(data);
});

router.delete("/history/:id", protect, async (req, res) => {
  await AIHistory.deleteOne({ _id: req.params.id, userId: req.user._id });
  res.json({ ok: true });
});

export default router;
