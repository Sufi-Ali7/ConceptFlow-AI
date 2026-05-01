import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

async function seed() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI missing in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const email = (process.env.ADMIN_EMAIL || "admin@conceptflow.ai").toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD || "Admin@12345";
    const hash = await bcrypt.hash(password, 10);

    const admin = await User.findOneAndUpdate(
      { email },
      {
        name: "Admin",
        email,
        password: hash,
        role: "admin",
        plan: "premium"
      },
      { new: true, upsert: true }
    );

    console.log("✅ Admin ready:", admin.email);
    console.log("✅ Password synced from ADMIN_PASSWORD");
    console.log("✅ Seed completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
}

seed();
