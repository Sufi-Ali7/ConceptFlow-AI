import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function safeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.plan,
    premiumUntil: user.premiumUntil,
    questionsAsked: user.questionsAsked,
    weakTopics: user.weakTopics,
    savedTopics: user.savedTopics
  };
}

async function ensureAdminUser() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@conceptflow.ai").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  const hash = await bcrypt.hash(adminPassword, 10);

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: "Admin",
      email: adminEmail,
      password: hash,
      role: "admin",
      plan: "premium"
    });
  } else {
    admin.name = admin.name || "Admin";
    admin.password = hash;
    admin.role = "admin";
    admin.plan = admin.plan || "premium";
    await admin.save();
  }
  return admin;
}

router.post("/signup", async (req, res) => {
  try {
    const { name = "Student", email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const normalizedEmail = email.toLowerCase().trim();
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@conceptflow.ai").toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";

    if (normalizedEmail === adminEmail && password === adminPassword) {
      const admin = await ensureAdminUser();
      const token = signToken(admin);
      return res.status(201).json({ token, user: safeUser(admin) });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: normalizedEmail, password: hash, role: "student" });
    const token = signToken(user);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message || "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const password = String(req.body.password || "");
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@conceptflow.ai").toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";

    // IMPORTANT: Admin .env credentials always work.
    // This fixes old database password mismatch.
    if (email === adminEmail && password === adminPassword) {
      const admin = await ensureAdminUser();
      admin.lastLoginAt = new Date();
      await admin.save();
      const token = signToken(admin);
      return res.json({ token, user: safeUser(admin) });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    res.json({ token, user: safeUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message || "Login failed" });
  }
});

router.get("/me", protect, async (req, res) => {
  res.json({ user: safeUser(req.user) });
});

export default router;
