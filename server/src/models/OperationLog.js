import mongoose from "mongoose";

const operationLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ["transaction", "verification", "subscription", "trade", "system"],
      required: true,
      index: true,
    },
    action: { type: String, required: true },
    context: { type: mongoose.Schema.Types.Mixed },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

operationLogSchema.index({ userId: 1, occurredAt: -1 });

export const OperationLogModel =
  mongoose.models.OperationLog ?? mongoose.model("OperationLog", operationLogSchema);
