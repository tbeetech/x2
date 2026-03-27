/**
 * Vercel Serverless API Handler
 *
 * Wraps the Express server so all /api/* requests are handled by the
 * same Express app that runs locally, connected to MongoDB.
 *
 * The Express app instance and the DB connection are cached across
 * warm invocations to avoid reconnecting on every request.
 */

import { createServer } from "../server/src/server.js";
import { connectDatabase } from "../server/src/lib/database.js";
import { env } from "../server/src/config/env.js";

let cachedApp = null;

async function buildApp() {
  if (cachedApp) return cachedApp;

  if (!env.useSampleData) {
    try {
      await connectDatabase();
      console.log("[api] MongoDB connected");
    } catch (err) {
      console.error("[api] MongoDB connection failed, falling back to sample data:", err.message);
      // Mirror the fallback pattern used in server/src/index.js bootstrap()
      env.useSampleData = true;
    }
  }

  const { app } = createServer();
  cachedApp = app;
  return cachedApp;
}

export default async function handler(req, res) {
  const app = await buildApp();
  return app(req, res);
}
