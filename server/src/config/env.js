import dotenv from "dotenv";

dotenv.config();

const DEFAULTS = {
  port: process.env.NODE_ENV === "production" ? 8080 : 5000,
  authSecret: process.env.NODE_ENV === "production" ? undefined : "invisphere-dev-secret",
  mongoUri: "",
  corsOrigins: "http://localhost:5173",
  clientUrl: "https://app.invisphere.com",
  consoleBaseUrl: "https://app.invisphere.com/dashboard",
};

const bool = (value, fallback = false) => {
  if (typeof value === "undefined") return fallback;
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const parseOrigins = (value) => {
  if (!value) {
    return ["http://localhost:5173"];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? DEFAULTS.port),
  authSecret: process.env.AUTH_SECRET ?? DEFAULTS.authSecret,
  useSampleData: bool(
    process.env.USE_SAMPLE_DATA,
    (process.env.NODE_ENV ?? "development") !== "production",
  ),
  mongoUri: process.env.MONGODB_URI ?? DEFAULTS.mongoUri,
  allowedOrigins: parseOrigins(process.env.CORS_ORIGINS ?? DEFAULTS.corsOrigins),
  serveStaticAssets: bool(process.env.SERVE_STATIC_ASSETS, false),
  staticAssetsDir: process.env.STATIC_ASSETS_DIR,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpSecure: bool(process.env.SMTP_SECURE, (process.env.SMTP_PORT ?? "") === "465"),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM,
  clientUrl: process.env.CLIENT_URL ?? DEFAULTS.clientUrl,
  consoleBaseUrl: process.env.CONSOLE_BASE_URL ?? DEFAULTS.consoleBaseUrl,
};

/**
 * Run this only when you are actually starting in production mode.
 * This function will throw if required production configuration is missing.
 */
export function assertProductionConfig() {
  if (env.nodeEnv !== "production") return;

  if (!env.authSecret) {
    throw new Error("AUTH_SECRET must be set to a secure value in production.");
  }

  if (env.authSecret === DEFAULTS.authSecret) {
    throw new Error("AUTH_SECRET must not use the bundled development default in production.");
  }

  // Only require a real MongoDB URI if we're not explicitly using sample data.
  if (!env.useSampleData && !env.mongoUri) {
    throw new Error("MONGODB_URI is required when USE_SAMPLE_DATA is false in production.");
  }
}
