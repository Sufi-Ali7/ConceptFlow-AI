import express from "express";
import Roadmap from "../models/Roadmap.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

function buildRoadmap(goal = "Full Stack Developer") {
  const lower = goal.toLowerCase();

  if (lower.includes("ai") || lower.includes("machine") || lower.includes("ml")) {
    return {
      goal,
      skills: ["Python", "Math basics", "Statistics", "Machine Learning", "Deep Learning", "Projects", "Deployment"],
      projects: ["ML prediction app", "Image classifier", "AI chatbot", "Resume screening AI"],
      timeline: ["Month 1: Python + Math", "Month 2: ML basics", "Month 3: DL + projects", "Month 4: portfolio + interviews"],
      salaryRange: "Fresher: ₹5–12 LPA, skilled candidates can target higher with strong projects.",
      marketDemand: "High demand in AI tools, automation, data products and intelligent applications."
    };
  }

  if (lower.includes("full") || lower.includes("web")) {
    return {
      goal,
      skills: ["HTML", "CSS", "JavaScript", "React", "Node.js", "MongoDB", "Auth", "Deployment"],
      projects: ["Portfolio", "Blood Bank App", "AI Learning Platform", "Admin Dashboard"],
      timeline: ["Month 1: Frontend", "Month 2: Backend", "Month 3: Full-stack projects", "Month 4: deployment + interviews"],
      salaryRange: "Fresher: ₹3–8 LPA, strong full-stack portfolio can improve chances.",
      marketDemand: "Consistently high demand in startups, services, SaaS and product companies."
    };
  }

  return {
    goal,
    skills: ["Basics", "Core concepts", "Projects", "Practice", "Interview preparation"],
    projects: ["Mini project", "Major project", "Portfolio project"],
    timeline: ["Step 1: Basics", "Step 2: Practice", "Step 3: Projects", "Step 4: Job preparation"],
    salaryRange: "Depends on skill, location, projects and interview performance.",
    marketDemand: "Good demand when practical projects and fundamentals are strong."
  };
}

router.post("/", protect, async (req, res) => {
  try {
    const roadmap = buildRoadmap(req.body.goal);
    const saved = await Roadmap.create({ ...roadmap, userId: req.user._id });
    res.json({ roadmap: saved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/my", protect, async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10);
    res.json({ roadmaps });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
