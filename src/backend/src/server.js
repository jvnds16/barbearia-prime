import { app } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env, validateProductionEnv } from "./config/env.js";
import { seedDefaultServices } from "./services/serviceCatalog.service.js";
import { migrateModelFieldsToEnglish } from "./services/modelMigration.service.js";
import mongoose from "mongoose";

async function bootstrap() {
  validateProductionEnv();

  try {
    await connectDatabase();
    await migrateModelFieldsToEnglish();
    await seedDefaultServices();
  } catch (error) {
    if (env.nodeEnv === "production") throw error;
    console.error("Banco de dados indisponível ao iniciar:", error.message);
    console.error("A API continuará online; as rotas que usam MongoDB retornarão 503 até que a conexão seja corrigida.");
  }

  const server = app.listen(env.port, () => {
    console.log(`API Barbearia Prime rodando em http://localhost:${env.port}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} recebido. Encerrando a aplicação...`);
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
  console.error("Falha ao iniciar o servidor:", error);
  process.exit(1);
});
