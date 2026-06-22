import mongoose from "mongoose";
import { connectDatabase } from "../src/config/database.js";
import { migrateModelFieldsToEnglish } from "../src/services/modelMigration.service.js";

try {
  await connectDatabase();
  await migrateModelFieldsToEnglish();
  console.log("Migrações concluídas com sucesso.");
} finally {
  await mongoose.disconnect();
}
