import mongoose from "mongoose";

const verificationDocumentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "VerificationEvent" },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    notes: { type: String },
    storage: {
      bucket: { type: String },
      key: { type: String },
    },
    data: { type: Buffer },
    checksum: { type: String },
    uploadedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

verificationDocumentSchema.index({ userId: 1, uploadedAt: -1 });

export const VerificationDocumentModel =
  mongoose.models.VerificationDocument ?? mongoose.model("VerificationDocument", verificationDocumentSchema);
