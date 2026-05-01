import mongoose from "mongoose";

const usageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dateKey: { type: String, required: true },
  aiQuestionsUsed: { type: Number, default: 0 }
}, { timestamps: true });

usageSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export default mongoose.model("Usage", usageSchema);
