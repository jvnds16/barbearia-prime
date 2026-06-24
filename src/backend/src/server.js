import { app } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env, validateProductionEnv } from "./config/env.js";
import { seedDefaultServices } from "./services/serviceCatalog.service.js";
import mongoose from "mongoose";

async function bootstrap() {
  validateProductionEnv();

  try {
    await connectDatabase();
    await seedDefaultServices();
  } catch (error) {
    if (env.nodeEnv === "production") throw error;
    console.error("Database unavailable during startup:", error.message);
    console.error("The API will stay online; MongoDB-backed routes return 503 until the connection is restored.");
  }

  const server = app.listen(env.port, () => {
    console.log(`Barbearia Prime API running at http://localhost:${env.port}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down the application...`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
