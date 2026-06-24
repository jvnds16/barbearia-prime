import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import { routes } from "./routes/index.js";

export const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
const vercelOriginPattern = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;
const allowedOrigins = new Set([env.frontendUrl, "http://localhost:3000"]);

if (env.nodeEnv === "production") {
  // Required so Express reports secure proxy headers correctly on Vercel.
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin requests, the configured frontend, and Vercel preview URLs.
      if (!origin || env.frontendUrl === "*" || allowedOrigins.has(origin) || vercelOriginPattern.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS."));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.use("/api", routes);

app.use(express.static(frontendDistPath));
app.get("*", (req, res, next) => {
  // API misses should use the JSON error handler, while app routes fall back to React.
  if (req.path.startsWith("/api")) {
    return next();
  }

  return res.sendFile(path.join(frontendDistPath, "index.html"), (error) => {
    if (error) next();
  });
});

app.use(notFound);
app.use(errorHandler);
