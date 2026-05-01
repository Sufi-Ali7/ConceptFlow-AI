import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: "Student" },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "admin"], default: "student" },
  plan: { type: String, enum: ["free", "premium"], default: "free" },
  premiumUntil: { type: Date, default: null },
  questionsAsked: { type: Number, default: 0 },
  weakTopics: [{ type: String }],
  savedTopics: [{ type: String }],
  lastLoginAt: Date
}, { timestamps: true });

userSchema.methods.isPremiumActive = function () {
  return this.plan === "premium" && (!this.premiumUntil || this.premiumUntil > new Date());
};

export default mongoose.model("User", userSchema);
