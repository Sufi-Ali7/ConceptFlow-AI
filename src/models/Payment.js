import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  orderId: String,
  paymentId: String,
  signature: String,
  amount: Number,
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
  plan: { type: String, default: "premium" }
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
