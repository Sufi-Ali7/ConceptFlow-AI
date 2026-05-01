import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Usage from "../models/Usage.js";

export async function getOptionalUser(req) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    return await User.findById(decoded.id).select("-password");
  } catch {
    return null;
  }
}

export function dateKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function checkAIUsageLimit(req, res, next) {
  try {
    const user = await getOptionalUser(req);

    if (!user) {
      return res.status(401).json({ message: "Login required to use AI questions" });
    }

    const now = new Date();
    let plan = user.plan || "free";

    if (plan === "premium" && user.premiumUntil && user.premiumUntil < now) {
      user.plan = "free";
      user.premiumUntil = null;
      await user.save();
      plan = "free";
    }

    const limit = plan === "premium"
      ? Number(process.env.PREMIUM_DAILY_AI_LIMIT || 500)
      : Number(process.env.FREE_DAILY_AI_LIMIT || 10);

    const key = dateKey();
    const usage = await Usage.findOneAndUpdate(
      { userId: user._id, dateKey: key },
      { $setOnInsert: { aiQuestionsUsed: 0 } },
      { new: true, upsert: true }
    );

    if (usage.aiQuestionsUsed >= limit) {
      return res.status(429).json({
        message: plan === "premium"
          ? "Daily premium AI limit reached. Try again tomorrow."
          : "Free daily AI limit reached. Upgrade to Premium for higher limits.",
        plan,
        used: usage.aiQuestionsUsed,
        limit
      });
    }

    req.user = user;
    req.usage = usage;
    req.aiLimit = limit;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function incrementAIUsage(req) {
  if (req.usage) {
    req.usage.aiQuestionsUsed += 1;
    await req.usage.save();
  }
}
