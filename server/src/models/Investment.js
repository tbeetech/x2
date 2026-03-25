import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User", index: true },
  planId: { type: String, required: true },
  planTitle: { type: String, required: true },
  amount: { type: Number, required: true },
  duration: { type: String, default: "30 days" },
  expectedReturn: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "active", "completed", "cancelled"], default: "pending" },
  approvedAt: { type: Date },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const InvestmentModel = mongoose.model("Investment", investmentSchema);
