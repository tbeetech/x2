import mongoose from "mongoose";

const verificationEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", required: false, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["completed", "in_progress", "pending"], default: "pending" },
    timestamp: { type: Date, required: true },
  },
  { timestamps: true },
);

verificationEventSchema.index({ userId: 1, timestamp: -1 });

export const VerificationEventModel =
  mongoose.models.VerificationEvent ?? mongoose.model("VerificationEvent", verificationEventSchema);
