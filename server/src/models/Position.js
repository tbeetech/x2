import mongoose from "mongoose";

const positionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    allocation: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    averagePrice: { type: Number, default: 0 },
    costBasis: { type: Number, default: 0 },
    currentValue: { type: Number, required: true },
    pnl: { type: Number, default: 0 },
    pnlPercent: { type: Number, default: 0 },
    pendingSell: { type: Number, default: 0 },
  },
  { timestamps: true },
);

positionSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const PositionModel = mongoose.models.Position ?? mongoose.model("Position", positionSchema);
