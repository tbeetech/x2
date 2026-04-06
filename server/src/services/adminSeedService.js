/**
 * Shared admin seeding service.
 *
 * Ensures an admin user with the credentials from ADMIN_EMAIL / ADMIN_PASSWORD
 * environment variables exists in either the in-memory sample store or MongoDB.
 * Call this during server bootstrap so admin access works on every environment
 * (local dev, Vercel serverless, Render, etc.).
 */

import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { UserModel } from "../models/User.js";

/**
 * Seed the configured admin user if it does not already exist.
 *
 * @param {object} [options]
 * @param {boolean} [options.usingSampleData] - Override; defaults to env.useSampleData.
 * @returns {Promise<void>}
 */
export async function seedAdmin(options = {}) {
  const usingSampleData =
    options.usingSampleData !== undefined ? options.usingSampleData : env.useSampleData;

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@x-fa.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "XFAadmin2026!";

  try {
    if (usingSampleData) {
      const { sampleUserStore } = await import("../data/sample.js");

      // Ensure the env-configured admin exists in the in-memory store.
      const envAdminExists = sampleUserStore.some(
        (u) => u.email.toLowerCase() === adminEmail.toLowerCase(),
      );
      if (!envAdminExists) {
        const passwordHash = await bcrypt.hash(adminPassword, 8);
        // NOTE: The `password` field (plaintext) is intentionally kept here for
        // sample/demo mode only. `resolveUserByEmail` in dataService.js hashes it
        // via `bcrypt.hash(match.password, 8)` on every lookup — this is the
        // established pattern for in-memory sample users and never applies to
        // MongoDB (production) mode where only `passwordHash` is stored.
        sampleUserStore.push({
          id: `user-${sampleUserStore.length + 1}`,
          email: adminEmail,
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          membership: "Administrator",
          password: adminPassword,
          passwordHash,
          createdAt: new Date().toISOString(),
        });
        console.log(`[seedAdmin] Seeded sample admin user: ${adminEmail}`);
      }

      // Sync the password of the matching entry when env credentials differ from
      // the hardcoded defaults in sampleAdminUser (keeps all admin entries
      // up-to-date across restarts without duplicating the user).
      // NOTE: Same sample-mode-only pattern as above — plaintext is needed by
      // resolveUserByEmail; it is never persisted to MongoDB.
      const builtInEntry = sampleUserStore.find(
        (u) => u.email.toLowerCase() === adminEmail.toLowerCase(),
      );
      if (builtInEntry && builtInEntry.password !== adminPassword) {
        builtInEntry.password = adminPassword;
        builtInEntry.passwordHash = await bcrypt.hash(adminPassword, 8);
        builtInEntry.role = "admin";
        console.log(`[seedAdmin] Updated password for admin user: ${adminEmail}`);
      }
    } else {
      // MongoDB mode — only the bcrypt hash is stored; no plaintext password.
      const existing = await UserModel.findOne({ email: adminEmail }).exec();
      if (!existing) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await UserModel.create({
          firstName: "Admin",
          lastName: "User",
          email: adminEmail,
          passwordHash,
          role: "admin",
          membership: "Administrator",
        });
        console.log(`[seedAdmin] Seeded MongoDB admin user: ${adminEmail}`);
      }
    }
  } catch (err) {
    console.error("[seedAdmin] Failed to ensure admin user:", err?.message ?? err);
  }
}
