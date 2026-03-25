import mongoose from "mongoose";

const sessionTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

sessionTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { revokedAt: null } });

export const SessionTokenModel =
  mongoose.models.SessionToken ?? mongoose.model("SessionToken", sessionTokenSchema);
