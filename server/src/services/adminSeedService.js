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

      // Ensure the env-configured admin exists
      const envAdminExists = sampleUserStore.some(
        (u) => u.email.toLowerCase() === adminEmail.toLowerCase(),
      );
      if (!envAdminExists) {
        const hash = await bcrypt.hash(adminPassword, 8);
        sampleUserStore.push({
          id: `user-${sampleUserStore.length + 1}`,
          email: adminEmail,
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          membership: "Administrator",
          password: adminPassword,
          passwordHash: hash,
          createdAt: new Date().toISOString(),
        });
        console.log(`[seedAdmin] Seeded sample admin user: ${adminEmail}`);
      }

      // Also sync the password of the built-in sampleAdminUser entry in case the
      // env credentials differ from its hardcoded defaults (keeps all admin entries
      // up-to-date across restarts).
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
      // MongoDB mode — upsert by email so duplicate admin users are never created.
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
