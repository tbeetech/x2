import mongoose from "mongoose";
import { env, assertProductionConfig } from "../config/env.js";

export async function connectDatabase() {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is required to establish a database connection.");
  }

  if (env.nodeEnv === "production") {
    assertProductionConfig();
  }

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
