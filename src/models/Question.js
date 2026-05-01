import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  question: String,
  answer: String,
  subject: String,
  mode: String
}, { timestamps: true });

export default mongoose.model("Question", questionSchema);
