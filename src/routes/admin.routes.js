import express from "express";
import User from "../models/User.js";
import AIHistory from "../models/AIHistory.js";
import Payment from "../models/Payment.js";
import StudyMaterial from "../models/StudyMaterial.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", protect, adminOnly, (req, res) => {
  res.json({ ok: true, admin: req.user });
});

router.get("/stats", protect, adminOnly, async (req, res) => {
  const [users, premiumUsers, aiQuestions, payments, materials] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ plan: "premium" }),
    AIHistory.countDocuments(),
    Payment.countDocuments({ status: "paid" }),
    StudyMaterial.countDocuments()
  ]);

  res.json({ users, premiumUsers, aiQuestions, payments, materials });
});

router.get("/users", protect, adminOnly, async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 }).limit(200);
  res.json(users);
});

router.patch("/users/:id/plan", protect, adminOnly, async (req, res) => {
  const { plan = "free" } = req.body;
  const update = { plan };
  if (plan === "premium") {
    const premiumUntil = new Date();
    premiumUntil.setMonth(premiumUntil.getMonth() + 1);
    update.premiumUntil = premiumUntil;
  } else {
    update.premiumUntil = null;
  }

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password");
  res.json(user);
});

router.delete("/users/:id", protect, adminOnly, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  await AIHistory.deleteMany({ userId: req.params.id });
  await Payment.deleteMany({ userId: req.params.id });
  res.json({ ok: true });
});

router.get("/ai-history", protect, adminOnly, async (req, res) => {
  const data = await AIHistory.find().populate("userId", "name email").sort({ createdAt: -1 }).limit(200);
  res.json(data);
});

router.delete("/ai-history/:id", protect, adminOnly, async (req, res) => {
  await AIHistory.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.get("/payments", protect, adminOnly, async (req, res) => {
  const data = await Payment.find().populate("userId", "name email").sort({ createdAt: -1 }).limit(200);
  res.json(data);
});

export default router;
