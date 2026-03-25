import mongoose from "mongoose";

const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    requestedFromIp: { type: String },
  },
  { timestamps: true },
);

passwordResetTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { usedAt: null } },
);

export const PasswordResetTokenModel =
  mongoose.models.PasswordResetToken ?? mongoose.model("PasswordResetToken", passwordResetTokenSchema);
