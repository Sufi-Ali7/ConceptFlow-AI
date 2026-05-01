import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./src/routes/auth.routes.js";
import aiRoutes from "./src/routes/ai.routes.js";
import billingRoutes from "./src/routes/billing.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import progressRoutes from "./src/routes/progress.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/api/ai/solve", rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
}));

app.get("/health", (req, res) => {
  res.json({ ok: true, app: "ConceptFlow AI", status: "running", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/progress", progressRoutes);

app.use((req, res, next) => {
  if (req.path.endsWith(".js") || req.path.endsWith(".css") || req.path.endsWith(".html") || req.path.endsWith("sw.js")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  }
  next();
});

app.use(express.static(path.join(process.cwd(), "public")));

app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "API route not found" });
  }
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

async function start() {
  try {
    if (!process.env.MONGO_URI) {
      console.warn("⚠️ MONGO_URI missing. App will run but database features will fail.");
    } else {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("✅ MongoDB connected");
    }

    app.listen(PORT, () => {
      console.log(`✅ ConceptFlow AI running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server start error:", error.message);
    process.exit(1);
  }
}

start();
