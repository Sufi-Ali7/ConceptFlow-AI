import express from "express";
import Progress from "../models/Progress.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const items = await Progress.find({ userId: req.user._id }).sort({ updatedAt: -1 });
  const completed = items.filter(i => i.completed).length;
  res.json({
    total: items.length,
    completed,
    percent: items.length ? Math.round((completed / items.length) * 100) : 0,
    items
  });
});

router.post("/", protect, async (req, res) => {
  const { course, topic, completed = true, score = 0 } = req.body;
  const item = await Progress.findOneAndUpdate(
    { userId: req.user._id, course, topic },
    { completed, score, lastOpenedAt: new Date() },
    { new: true, upsert: true }
  );
  res.json(item);
});

router.post("/weak-topics", protect, async (req, res) => {
  const topics = Array.isArray(req.body.topics) ? req.body.topics : [];
  const user = await User.findById(req.user._id);
  for (const t of topics) {
    if (t && !user.weakTopics.includes(t)) user.weakTopics.push(t);
  }
  await user.save();
  res.json({ weakTopics: user.weakTopics });
});

export default router;
