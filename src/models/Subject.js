import mongoose from "mongoose";

const topicSchema = new mongoose.Schema({
  title: String,
  description: String,
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
  keywords: [String]
}, { _id: false });

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: "IT" },
  icon: { type: String, default: "📘" },
  color: { type: String, default: "purple" },
  conceptCount: { type: Number, default: 0 },
  isTrending: { type: Boolean, default: false },
  topics: [topicSchema]
}, { timestamps: true });

export default mongoose.model("Subject", subjectSchema);
