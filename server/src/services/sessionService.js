import crypto from "crypto";
import { env } from "../config/env.js";
import { SessionTokenModel } from "../models/SessionToken.js";

const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
const inMemorySessions = [];

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateRefreshTokenValue() {
  return crypto.randomBytes(48).toString("base64url");
}

export async function issueRefreshToken({ userId, ipAddress, userAgent }) {
  const tokenValue = generateRefreshTokenValue();
  const tokenHash = hashToken(tokenValue);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  if (env.useSampleData) {
    inMemorySessions.push({
      userId,
      tokenHash,
      userAgent,
      ipAddress,
      expiresAt,
      createdAt: new Date(),
      revokedAt: null,
    });
  } else {
    await SessionTokenModel.create({
      userId,
      tokenHash,
      userAgent,
      ipAddress,
      expiresAt,
    });
  }

  return { refreshToken: tokenValue, expiresAt };
}

export async function findValidRefreshSession(tokenValue) {
  if (!tokenValue) return null;
  const tokenHash = hashToken(tokenValue);
  const now = new Date();

  if (env.useSampleData) {
    return (
      inMemorySessions.find(
        (session) =>
          session.tokenHash === tokenHash && !session.revokedAt && session.expiresAt > now,
      ) ?? null
    );
  }

  return SessionTokenModel.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: now },
  })
    .lean()
    .exec();
}

export async function revokeRefreshToken(tokenValue) {
  if (!tokenValue) return;
  const tokenHash = hashToken(tokenValue);
  if (env.useSampleData) {
    const session = inMemorySessions.find((entry) => entry.tokenHash === tokenHash);
    if (session) {
      session.revokedAt = new Date();
    }
    return;
  }

  await SessionTokenModel.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } }).exec();
}

export async function revokeAllTokensForUser(userId) {
  if (!userId) return;
  if (env.useSampleData) {
    inMemorySessions.forEach((session) => {
      if (session.userId === userId) {
        session.revokedAt = new Date();
      }
    });
    return;
  }

  await SessionTokenModel.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } }).exec();
}
