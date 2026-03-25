import mongoose from "mongoose";

const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    locale: { type: String, default: "en", required: true },
    value: { type: String, required: true },
    description: { type: String, default: "" },
    tags: [{ type: String }],
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
);

siteContentSchema.index({ key: 1, locale: 1 }, { unique: true });
siteContentSchema.index({ locale: 1, updatedAt: -1 });

export const SiteContentModel =
  mongoose.models.SiteContent ?? mongoose.model("SiteContent", siteContentSchema);
