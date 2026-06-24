import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";

function normalizeUrl(value) {
  const url = value?.trim();
  if (!url) return undefined;

  // Vercel exposes domains without a protocol, but CORS needs absolute origins.
  return `${/^https?:\/\//i.test(url) ? "" : "https://"}${url}`.replace(/\/+$/, "");
}

export function resolveFrontendUrl(environment = process.env) {
  // Prefer explicit configuration, then Vercel production and preview URLs.
  return (
    normalizeUrl(environment.FRONTEND_URL) ||
    normalizeUrl(environment.VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeUrl(environment.VERCEL_URL) ||
    "http://localhost:3000"
  );
}

export const env = {
  port: process.env.PORT || 3001,
  mongoUri: process.env.MONGODB_URI,
  mongoDb: process.env.MONGO_DB || "barbearia-prime",
  frontendUrl: resolveFrontendUrl(),
  adminPassword: process.env.ADMIN_PASSWORD || (nodeEnv === "development" ? "teste123" : undefined),
  jwtSecret: process.env.JWT_SECRET || (nodeEnv === "development" ? "barbearia-prime-dev-secret" : undefined),
  nodeEnv
};

export function validateProductionEnv() {
  if (nodeEnv !== "production") return;

  // Production must fail fast when security-sensitive values are missing.
  const missing = [];
  if (!env.mongoUri) missing.push("MONGODB_URI");
  if (!env.adminPassword) missing.push("ADMIN_PASSWORD");
  if (!env.jwtSecret) missing.push("JWT_SECRET");

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  if (env.adminPassword.length < 12) {
    throw new Error("ADMIN_PASSWORD must have at least 12 characters.");
  }
  if (env.jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must have at least 32 characters.");
  }
}
