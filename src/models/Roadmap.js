import mongoose from "mongoose";

const roadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  goal: String,
  skills: [String],
  projects: [String],
  timeline: [String],
  salaryRange: String,
  marketDemand: String
}, { timestamps: true });

export default mongoose.model("Roadmap", roadmapSchema);
