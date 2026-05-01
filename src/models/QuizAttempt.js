import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  subject: String,
  score: Number,
  total: Number,
  wrongTopics: [String],
  answers: Array
}, { timestamps: true });

export default mongoose.model("QuizAttempt", quizAttemptSchema);
