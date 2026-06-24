import { app } from "../backend/src/app.js";
import { connectDatabase } from "../backend/src/config/database.js";
import { validateProductionEnv } from "../backend/src/config/env.js";
import { seedDefaultServices } from "../backend/src/services/serviceCatalog.service.js";

let initializationPromise;

function initializeApplication() {
  if (!initializationPromise) {
    // Cache initialization between serverless invocations in the same runtime.
    initializationPromise = (async () => {
      validateProductionEnv();
      await connectDatabase();
      await seedDefaultServices();
    })().catch((error) => {
      initializationPromise = undefined;
      throw error;
    });
  }

  return initializationPromise;
}

export function restoreOriginalApiPath(req) {
  const rewrittenPath = req.query?.path;
  if (!rewrittenPath) return;

  // Vercel rewrites /api/* into a query parameter; Express expects the original path.
  const path = Array.isArray(rewrittenPath) ? rewrittenPath.join("/") : rewrittenPath;
  const url = new URL(req.url, "http://localhost");
  url.searchParams.delete("path");
  const query = url.searchParams.toString();

  req.url = `/api/${path}${query ? `?${query}` : ""}`;
}

export default async function handler(req, res) {
  restoreOriginalApiPath(req);

  try {
    await initializeApplication();
    return app(req, res);
  } catch (error) {
    console.error("Could not initialize the serverless function:", error);
    return res.status(503).json({
      success: false,
      error: "The service is temporarily unavailable."
    });
  }
}
