import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";

const ACCESS_TOKEN_TTL = "15m";
const TWO_FACTOR_TOKEN_TTL = "10m";

export function signAccessToken(payload) {
  return jwt.sign(payload, env.authSecret, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

// Backwards-compatible alias for legacy imports
export const signToken = signAccessToken;

export function verifyAccessToken(token) {
  return jwt.verify(token, env.authSecret);
}

// Legacy name expected by older middleware imports
export const verifyToken = verifyAccessToken;

export function signTwoFactorToken(payload) {
  return jwt.sign(payload, env.authSecret, {
    expiresIn: TWO_FACTOR_TOKEN_TTL,
  });
}

export function generateTwoFactorSecret() {
  return crypto.randomBytes(20).toString("hex");
}

// Verify a plaintext password against either a bcrypt hash or plain-sample password.
export async function verifyPassword(plain, stored) {
  if (!plain) return false;
  if (!stored) return false;

  // If caller passed a user object, try to extract hash first
  if (typeof stored === "object" && stored !== null) {
    stored = stored.passwordHash ?? stored.password ?? null;
  }

  if (!stored) return false;

  try {
    // bcrypt hashes typically start with $2
    if (typeof stored === "string" && stored.startsWith("$2")) {
      return await bcrypt.compare(plain, stored);
    }

    // Fallback: compare raw strings (used only for sample data)
    return plain === stored;
  } catch {
    return false;
  }
}
