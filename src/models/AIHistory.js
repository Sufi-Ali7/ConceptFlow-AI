import mongoose from "mongoose";

const aiHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  provider: { type: String, default: "fallback" },
  model: { type: String, default: "" },
  tokensApprox: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("AIHistory", aiHistorySchema);
