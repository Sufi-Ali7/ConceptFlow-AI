import mongoose from "mongoose";

const studyMaterialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  filename: String,
  summary: String,
  type: { type: String, default: "manual" }
}, { timestamps: true });

export default mongoose.model("StudyMaterial", studyMaterialSchema);
