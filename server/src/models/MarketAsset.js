import mongoose from "mongoose";

const marketAssetSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    currentPrice: { type: Number, required: true },
    marketCap: { type: Number, required: true },
    priceChangePercentage24h: { type: Number, default: 0 },
    totalVolume: { type: Number, default: 0 },
  },
  { timestamps: true },
);

marketAssetSchema.index({ updatedAt: -1 });

export const MarketAssetModel =
  mongoose.models.MarketAsset ?? mongoose.model("MarketAsset", marketAssetSchema);
