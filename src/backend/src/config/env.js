import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";

export const env = {
  port: process.env.PORT || 3001,
  mongoUri: process.env.MONGODB_URI,
  mongoDb: process.env.MONGO_DB || "barbearia-prime",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  adminPassword: process.env.ADMIN_PASSWORD || (nodeEnv === "development" ? "teste123" : undefined),
  jwtSecret: process.env.JWT_SECRET || (nodeEnv === "development" ? "barbearia-prime-dev-secret" : undefined),
  nodeEnv
};

export function validateProductionEnv() {
  if (nodeEnv !== "production") return;

  const missing = [];
  if (!env.mongoUri) missing.push("MONGODB_URI");
  if (!env.adminPassword) missing.push("ADMIN_PASSWORD");
  if (!env.jwtSecret) missing.push("JWT_SECRET");
  if (!process.env.FRONTEND_URL) missing.push("FRONTEND_URL");

  if (missing.length) {
    throw new Error(`Variáveis obrigatórias ausentes: ${missing.join(", ")}`);
  }
  if (env.adminPassword.length < 12) {
    throw new Error("ADMIN_PASSWORD deve ter pelo menos 12 caracteres.");
  }
  if (env.jwtSecret.length < 32) {
    throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres.");
  }
}
