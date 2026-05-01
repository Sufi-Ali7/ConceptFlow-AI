import express from "express";
import Subject from "../models/Subject.js";
import { defaultSubjects } from "../data/defaultSubjects.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    let subjects = [];
    try {
      subjects = await Subject.find().sort({ createdAt: 1 });
    } catch {}

    if (!subjects.length) subjects = defaultSubjects;

    
    const normalized = subjects.map(s => {
      const obj = s.toObject ? s.toObject() : s;
      return { ...obj, isNew: obj.isTrending || obj.isNew || false };
    });
    res.json({ subjects: normalized });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").toLowerCase();
    const source = await Subject.find().catch(() => []);
    const all = source.length ? source : defaultSubjects;

    const subjects = all.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.topics?.some(t => t.title?.toLowerCase().includes(q))
    );

    res.json({ subjects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
