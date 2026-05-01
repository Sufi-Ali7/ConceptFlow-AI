import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import { protect } from "../middleware/auth.js";
import StudyMaterial from "../models/StudyMaterial.js";
import { generateAIAnswer } from "./ai.routes.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

function buildPrompt(type, { subject = "General", text = "", days = 5 }) {
  if (type === "notes") {
    return `Create exam-ready notes for subject: ${subject}.
Content/Syllabus:
${text}

Format:
1. Unit-wise headings
2. Short but deep explanation
3. Important definitions
4. Examples
5. Exam writing points
Use simple English and helpful Roman Hindi where needed.`;
  }

  if (type === "questions") {
    return `Generate expected exam questions for subject: ${subject}.
Content/Syllabus:
${text}

Include:
- 1 mark questions
- 2.5 mark questions
- 5 mark questions
- important long questions
- answers in exam format.`;
  }

  if (type === "viva") {
    return `Generate viva questions and answers for subject: ${subject}.
Content/Syllabus:
${text}

Make answers short, clear and interview/viva friendly.`;
  }

  if (type === "plan") {
    return `Create a ${days}-day revision plan for subject: ${subject}.
Content/Syllabus:
${text}

Include:
- daily topics
- time division
- practice tasks
- last day revision
- important topics.`;
  }

  return text;
}

async function createMaterial(req, res, type) {
  const { subject = "General", text = "", days = 5 } = req.body;
  if (!text || text.trim().length < 5) {
    return res.status(400).json({ message: "Syllabus/content text is required" });
  }

  const prompt = buildPrompt(type, { subject, text, days });
  const output = await generateAIAnswer({ question: prompt, mode: type, subject });

  const material = await StudyMaterial.create({
    userId: req.user._id,
    type,
    subject,
    input: text,
    output
  });

  res.json({ material, output });
}

router.post("/notes", protect, async (req, res) => {
  try { await createMaterial(req, res, "notes"); }
  catch (error) { res.status(500).json({ message: error.message }); }
});

router.post("/questions", protect, async (req, res) => {
  try { await createMaterial(req, res, "questions"); }
  catch (error) { res.status(500).json({ message: error.message }); }
});

router.post("/viva", protect, async (req, res) => {
  try { await createMaterial(req, res, "viva"); }
  catch (error) { res.status(500).json({ message: error.message }); }
});

router.post("/plan", protect, async (req, res) => {
  try { await createMaterial(req, res, "plan"); }
  catch (error) { res.status(500).json({ message: error.message }); }
});

router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File is required" });

    let text = "";

    if (req.file.mimetype === "application/pdf") {
      const parsed = await pdfParse(req.file.buffer);
      text = parsed.text;
    } else {
      text = req.file.buffer.toString("utf-8");
    }

    const material = await StudyMaterial.create({
      userId: req.user._id,
      type: "syllabus",
      subject: req.body.subject || "Uploaded Syllabus",
      input: text.slice(0, 30000),
      output: "Uploaded successfully"
    });

    res.json({
      message: "File uploaded and text extracted",
      material,
      text: text.slice(0, 12000)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/my", protect, async (req, res) => {
  try {
    const materials = await StudyMaterial.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(30);
    res.json({ materials });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
