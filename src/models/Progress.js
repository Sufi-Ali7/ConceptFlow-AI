import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: String, required: true },
  topic: { type: String, required: true },
  completed: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  lastOpenedAt: { type: Date, default: Date.now }
}, { timestamps: true });

progressSchema.index({ userId: 1, course: 1, topic: 1 }, { unique: true });

export default mongoose.model("Progress", progressSchema);
