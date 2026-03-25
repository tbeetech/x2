import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { PasswordResetTokenModel } from "../models/PasswordResetToken.js";
import { UserModel } from "../models/User.js";
import { sampleUserStore } from "../data/sample.js";

const RESET_TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours for admin-assisted password reset
const inMemoryResetTokens = [];

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generatePasswordResetTokenValue() {
  // Generate a 16-digit numeric token
  let token = '';
  for (let i = 0; i < 16; i++) {
    token += Math.floor(Math.random() * 10);
  }
  return token;
}

export async function createPasswordResetToken(user) {
  const rawToken = generatePasswordResetTokenValue();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  if (env.useSampleData) {
    inMemoryResetTokens.push({
      userId: user.id ?? user._id,
      tokenHash,
      expiresAt,
      createdAt: new Date(),
      usedAt: null,
    });
  } else {
    await PasswordResetTokenModel.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });
  }

  return { token: rawToken, expiresAt };
}

async function locateResetEntry(tokenValue) {
  const now = new Date();
  const tokenHash = hashToken(tokenValue);

  if (env.useSampleData) {
    return (
      inMemoryResetTokens.find(
        (entry) => entry.tokenHash === tokenHash && !entry.usedAt && entry.expiresAt > now,
      ) ?? null
    );
  }

  return PasswordResetTokenModel.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: now },
  })
    .lean()
    .exec();
}

export async function consumePasswordResetToken(tokenValue) {
  const entry = await locateResetEntry(tokenValue);
  if (!entry) {
    return null;
  }

  if (env.useSampleData) {
    entry.usedAt = new Date();
  } else {
    await PasswordResetTokenModel.updateOne(
      { tokenHash: hashToken(tokenValue) },
      { $set: { usedAt: new Date() } },
    ).exec();
  }

  return entry;
}

export async function updateUserPassword(userId, password) {
  const passwordHash = await bcrypt.hash(password, 10);

  if (env.useSampleData) {
    const target = sampleUserStore.find((candidate) => candidate.id === userId);
    if (target) {
      target.password = password;
      target.passwordHash = passwordHash;
    }
    return;
  }

  await UserModel.updateOne({ _id: userId }, { $set: { passwordHash } }).exec();
}
