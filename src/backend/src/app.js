import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { isDatabaseConnected } from "./config/database.js";
import { routes } from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

if (env.nodeEnv === "production") {
  // Required so Express reports secure proxy headers correctly on Vercel.
  app.set("trust proxy", 1);
}

app.use(express.json({ limit: "1mb" }));

// Global DB gate keeps every Mongo-backed route honest without per-route middleware.
app.use("/api", (req, res, next) => {
  if (req.path === "/health" || req.path.startsWith("/auth")) return next();
  if (req.method === "GET") return next();
  if (isDatabaseConnected()) return next();
  return res.status(503).json({
    success: false,
    error: "This service is temporarily unavailable. Please try again shortly."
  });
});

app.use("/api", routes);
app.use(express.static(frontendDistPath));
app.use(errorHandler);

app.get("*", (req, res, next) => {
  // API misses should use the JSON error handler, while app routes fall back to React.
  if (req.path.startsWith("/api")) {
    return res.status(404).json({
      success: false,
      error: `Route not found: ${req.method} ${req.originalUrl}`
    });
  }

  return res.sendFile(path.join(frontendDistPath, "index.html"), (error) => {
    if (error) next();
  });
});