import express from "express";
import Razorpay from "razorpay";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { verifyRazorpaySignature } from "../utils/payment.js";

const router = express.Router();

function keysReady() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  return Boolean(
    key_id &&
    key_secret &&
    key_id.startsWith("rzp_") &&
    !key_id.includes("your_") &&
    !key_secret.includes("your_")
  );
}

router.get("/plans", (req, res) => {
  res.json({
    plans: [
      { id: "free", name: "Free", amount: 0, currency: "INR" },
      { id: "premium", name: "Premium", amount: Number(process.env.RAZORPAY_PLAN_AMOUNT || 19900), currency: process.env.RAZORPAY_CURRENCY || "INR" }
    ],
    razorpayConfigured: keysReady()
  });
});

router.get("/status", protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({
    plan: user.plan,
    premium: user.isPremiumActive(),
    premiumUntil: user.premiumUntil
  });
});

router.get("/debug", (req, res) => {
  res.json({
    keyIdPresent: Boolean(process.env.RAZORPAY_KEY_ID),
    keyIdLooksValid: Boolean(process.env.RAZORPAY_KEY_ID?.startsWith("rzp_")),
    keySecretPresent: Boolean(process.env.RAZORPAY_KEY_SECRET),
    amount: Number(process.env.RAZORPAY_PLAN_AMOUNT || 19900),
    currency: process.env.RAZORPAY_CURRENCY || "INR"
  });
});

router.post("/create-order", protect, async (req, res) => {
  try {
    if (!keysReady()) {
      return res.status(400).json({
        message: "Razorpay keys not configured correctly. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env and restart server."
      });
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    const amount = Number(process.env.RAZORPAY_PLAN_AMOUNT || 19900);
    const currency = process.env.RAZORPAY_CURRENCY || "INR";

    const razorpay = new Razorpay({ key_id, key_secret });
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `cf_${Date.now()}`
    });

    await Payment.create({
      userId: req.user._id,
      orderId: order.id,
      amount,
      currency,
      status: "created"
    });

    res.json({ key: key_id, order, amount, currency });
  } catch (error) {
    res.status(500).json({ message: error.message || "Order creation failed" });
  }
});

router.post("/verify", protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const ok = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!ok) return res.status(400).json({ message: "Invalid payment signature" });

    const payment = await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id, userId: req.user._id },
      { paymentId: razorpay_payment_id, signature: razorpay_signature, status: "paid" },
      { new: true }
    );

    const premiumUntil = new Date();
    premiumUntil.setMonth(premiumUntil.getMonth() + 1);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { plan: "premium", premiumUntil },
      { new: true }
    ).select("-password");

    res.json({ ok: true, payment, user });
  } catch (error) {
    res.status(500).json({ message: error.message || "Verification failed" });
  }
});

export default router;
