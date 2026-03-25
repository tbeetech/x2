import mongoose from "mongoose";

const portfolioSnapshotSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    totalValue: { type: Number, required: true },
    totalReturn: { type: Number, required: true },
    dailyChange: { type: Number, default: 0 },
    netDeposits: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const PortfolioSnapshotModel =
  mongoose.models.PortfolioSnapshot ?? mongoose.model("PortfolioSnapshot", portfolioSnapshotSchema);
